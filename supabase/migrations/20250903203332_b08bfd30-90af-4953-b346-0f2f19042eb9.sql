-- Phase 1: Data Cleanup - Clean up duplicate categories and add constraints

-- Step 1: Deactivate duplicate categories, keeping only the most recent one per name/user
WITH ranked_categories AS (
  SELECT 
    id,
    user_id,
    name,
    ROW_NUMBER() OVER (PARTITION BY user_id, LOWER(TRIM(name)) ORDER BY created_at DESC, updated_at DESC) as rn
  FROM public.categories
  WHERE is_active = true
)
UPDATE public.categories 
SET is_active = false, updated_at = now()
WHERE id IN (
  SELECT id FROM ranked_categories WHERE rn > 1
);

-- Step 2: Update activities to reference the kept (most recent) categories
WITH category_mapping AS (
  SELECT 
    old_cat.id as old_id,
    new_cat.id as new_id
  FROM public.categories old_cat
  JOIN public.categories new_cat ON (
    old_cat.user_id = new_cat.user_id 
    AND LOWER(TRIM(old_cat.name)) = LOWER(TRIM(new_cat.name))
    AND old_cat.is_active = false 
    AND new_cat.is_active = true
  )
)
UPDATE public.activities 
SET 
  category_id = category_mapping.new_id,
  updated_at = now()
FROM category_mapping 
WHERE activities.category_id = category_mapping.old_id;

-- Step 3: Update subcategory activities similarly
WITH subcategory_mapping AS (
  SELECT 
    old_sub.id as old_id,
    new_sub.id as new_id
  FROM public.categories old_sub
  JOIN public.categories new_sub ON (
    old_sub.user_id = new_sub.user_id 
    AND LOWER(TRIM(old_sub.name)) = LOWER(TRIM(new_sub.name))
    AND old_sub.is_active = false 
    AND new_sub.is_active = true
    AND old_sub.level = 1
    AND new_sub.level = 1
  )
)
UPDATE public.activities 
SET 
  subcategory_id = subcategory_mapping.new_id,
  updated_at = now()
FROM subcategory_mapping 
WHERE activities.subcategory_id = subcategory_mapping.old_id;

-- Step 4: Add index for better performance on category name uniqueness checks
CREATE INDEX IF NOT EXISTS idx_categories_user_name_active 
ON public.categories (user_id, LOWER(TRIM(name))) 
WHERE is_active = true;

-- Step 5: Create a function to check category name uniqueness more robustly
CREATE OR REPLACE FUNCTION public.check_enhanced_category_name_uniqueness()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Only check for active categories
  IF NEW.is_active = true THEN
    -- Check for duplicate names in the same parent scope (case-insensitive, trimmed)
    IF NEW.parent_id IS NULL THEN
      -- Top-level category check
      IF EXISTS (
        SELECT 1 FROM public.categories 
        WHERE user_id = NEW.user_id 
          AND parent_id IS NULL 
          AND LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
          AND is_active = true
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      ) THEN
        RAISE EXCEPTION 'A category with the name "%s" already exists at the top level', TRIM(NEW.name);
      END IF;
    ELSE
      -- Subcategory check
      IF EXISTS (
        SELECT 1 FROM public.categories 
        WHERE user_id = NEW.user_id 
          AND parent_id = NEW.parent_id 
          AND LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
          AND is_active = true
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      ) THEN
        RAISE EXCEPTION 'A subcategory with the name "%s" already exists under this parent', TRIM(NEW.name);
      END IF;
    END IF;
  END IF;

  -- Trim whitespace from name
  NEW.name := TRIM(NEW.name);
  
  RETURN NEW;
END;
$$;

-- Step 6: Replace the old trigger with the enhanced one
DROP TRIGGER IF EXISTS check_category_name_uniqueness_trigger ON public.categories;
CREATE TRIGGER check_enhanced_category_name_uniqueness_trigger
    BEFORE INSERT OR UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.check_enhanced_category_name_uniqueness();