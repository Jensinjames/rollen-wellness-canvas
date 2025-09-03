-- Emergency cleanup for duplicate categories
-- Step 1: Find and deactivate duplicate categories (keep most recent)
WITH category_duplicates AS (
  SELECT 
    user_id,
    name,
    parent_id,
    MAX(created_at) as latest_created_at,
    COUNT(*) as duplicate_count
  FROM public.categories 
  WHERE is_active = true
  GROUP BY user_id, name, parent_id
  HAVING COUNT(*) > 1
),
categories_to_keep AS (
  SELECT c.id, c.user_id, c.name, c.parent_id
  FROM public.categories c
  INNER JOIN category_duplicates cd ON 
    c.user_id = cd.user_id AND 
    c.name = cd.name AND 
    COALESCE(c.parent_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(cd.parent_id, '00000000-0000-0000-0000-000000000000'::uuid) AND
    c.created_at = cd.latest_created_at
),
categories_to_deactivate AS (
  SELECT c.id
  FROM public.categories c
  INNER JOIN category_duplicates cd ON 
    c.user_id = cd.user_id AND 
    c.name = cd.name AND 
    COALESCE(c.parent_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(cd.parent_id, '00000000-0000-0000-0000-000000000000'::uuid)
  WHERE c.id NOT IN (SELECT id FROM categories_to_keep)
)
UPDATE public.categories 
SET is_active = false, updated_at = now()
WHERE id IN (SELECT id FROM categories_to_deactivate);

-- Step 2: Create mapping table for category updates
CREATE TEMP TABLE category_mappings AS
WITH category_duplicates AS (
  SELECT 
    user_id,
    name,
    parent_id,
    MAX(created_at) as latest_created_at
  FROM public.categories 
  WHERE is_active = false -- Now the duplicates we just deactivated
  GROUP BY user_id, name, parent_id
),
old_to_new_mapping AS (
  SELECT 
    old_cat.id as old_id,
    new_cat.id as new_id
  FROM public.categories old_cat
  INNER JOIN category_duplicates cd ON 
    old_cat.user_id = cd.user_id AND 
    old_cat.name = cd.name AND 
    COALESCE(old_cat.parent_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(cd.parent_id, '00000000-0000-0000-0000-000000000000'::uuid)
  INNER JOIN public.categories new_cat ON 
    new_cat.user_id = cd.user_id AND 
    new_cat.name = cd.name AND 
    COALESCE(new_cat.parent_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(cd.parent_id, '00000000-0000-0000-0000-000000000000'::uuid) AND
    new_cat.is_active = true
  WHERE old_cat.is_active = false
)
SELECT * FROM old_to_new_mapping;

-- Step 3: Update activities to reference correct categories
UPDATE public.activities 
SET category_id = cm.new_id, updated_at = now()
FROM category_mappings cm 
WHERE activities.category_id = cm.old_id;

UPDATE public.activities 
SET subcategory_id = cm.new_id, updated_at = now()
FROM category_mappings cm 
WHERE activities.subcategory_id = cm.old_id;

-- Step 4: Update parent_id references in categories table
UPDATE public.categories 
SET parent_id = cm.new_id, updated_at = now()
FROM category_mappings cm 
WHERE categories.parent_id = cm.old_id AND categories.is_active = true;

-- Step 5: Add performance index and constraint
CREATE INDEX IF NOT EXISTS idx_categories_user_name_parent_active 
ON public.categories(user_id, name, parent_id) 
WHERE is_active = true;

-- Step 6: Add enhanced unique constraint (will prevent future duplicates)
DROP TRIGGER IF EXISTS check_enhanced_category_name_uniqueness_trigger ON public.categories;
CREATE TRIGGER check_enhanced_category_name_uniqueness_trigger
  BEFORE INSERT OR UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.check_enhanced_category_name_uniqueness();