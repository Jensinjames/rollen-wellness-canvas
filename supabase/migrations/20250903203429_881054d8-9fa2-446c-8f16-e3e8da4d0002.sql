-- Phase 1: Data Cleanup - Clean up duplicate categories with proper hierarchy handling

-- Step 1: Temporarily disable hierarchy validation during cleanup
ALTER TABLE public.activities DISABLE TRIGGER validate_activity_category_hierarchy_trigger;

-- Step 2: Deactivate duplicate categories, keeping only the most recent one per name/user
WITH ranked_categories AS (
  SELECT 
    id,
    user_id,
    name,
    level,
    parent_id,
    ROW_NUMBER() OVER (PARTITION BY user_id, LOWER(TRIM(name)), level, parent_id ORDER BY created_at DESC, updated_at DESC) as rn
  FROM public.categories
  WHERE is_active = true
)
UPDATE public.categories 
SET is_active = false, updated_at = now()
WHERE id IN (
  SELECT id FROM ranked_categories WHERE rn > 1
);

-- Step 3: Create mapping for category updates with hierarchy preservation
WITH category_mapping AS (
  SELECT DISTINCT
    old_cat.id as old_id,
    new_cat.id as new_id,
    old_cat.level
  FROM public.categories old_cat
  JOIN public.categories new_cat ON (
    old_cat.user_id = new_cat.user_id 
    AND LOWER(TRIM(old_cat.name)) = LOWER(TRIM(new_cat.name))
    AND old_cat.level = new_cat.level
    AND COALESCE(old_cat.parent_id::text, 'NULL') = COALESCE(new_cat.parent_id::text, 'NULL')
    AND old_cat.is_active = false 
    AND new_cat.is_active = true
  )
)
UPDATE public.activities 
SET 
  category_id = CASE 
    WHEN category_mapping.level = 0 THEN category_mapping.new_id 
    ELSE activities.category_id 
  END,
  subcategory_id = CASE 
    WHEN category_mapping.level = 1 THEN category_mapping.new_id 
    ELSE activities.subcategory_id 
  END,
  updated_at = now()
FROM category_mapping 
WHERE (activities.category_id = category_mapping.old_id AND category_mapping.level = 0)
   OR (activities.subcategory_id = category_mapping.old_id AND category_mapping.level = 1);

-- Step 4: Re-enable validation trigger
ALTER TABLE public.activities ENABLE TRIGGER validate_activity_category_hierarchy_trigger;

-- Step 5: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_user_name_level_active 
ON public.categories (user_id, LOWER(TRIM(name)), level, parent_id) 
WHERE is_active = true;

-- Step 6: Create enhanced category uniqueness function
CREATE OR REPLACE FUNCTION public.check_enhanced_category_name_uniqueness()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Only check for active categories
  IF NEW.is_active = true THEN
    -- Trim whitespace from name
    NEW.name := TRIM(NEW.name);
    
    -- Check for duplicate names in the same scope (case-insensitive)
    IF NEW.parent_id IS NULL THEN
      -- Top-level category check
      IF EXISTS (
        SELECT 1 FROM public.categories 
        WHERE user_id = NEW.user_id 
          AND parent_id IS NULL 
          AND LOWER(TRIM(name)) = LOWER(NEW.name)
          AND is_active = true
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      ) THEN
        RAISE EXCEPTION 'A category named "%s" already exists at the top level', NEW.name;
      END IF;
    ELSE
      -- Subcategory check
      IF EXISTS (
        SELECT 1 FROM public.categories 
        WHERE user_id = NEW.user_id 
          AND parent_id = NEW.parent_id 
          AND LOWER(TRIM(name)) = LOWER(NEW.name)
          AND is_active = true
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      ) THEN
        RAISE EXCEPTION 'A subcategory named "%s" already exists under this parent', NEW.name;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 7: Update the trigger
DROP TRIGGER IF EXISTS check_category_name_uniqueness_trigger ON public.categories;
DROP TRIGGER IF EXISTS check_enhanced_category_name_uniqueness_trigger ON public.categories;
CREATE TRIGGER check_enhanced_category_name_uniqueness_trigger
    BEFORE INSERT OR UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.check_enhanced_category_name_uniqueness();