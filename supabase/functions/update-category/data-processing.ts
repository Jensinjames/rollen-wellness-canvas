
import { logOperation } from './logger.ts';

export const sanitizeUpdateData = (body: any) => {
  const {
    name,
    color,
    description,
    boolean_goal_label,
    goal_type,
    is_boolean_goal,
    is_active,
    daily_time_goal_minutes,
    weekly_time_goal_minutes,
    sort_order,
    level,
    parent_id
  } = body;

  const updateData: any = {};
  
  // Handle string fields with proper sanitization
  if (name !== undefined && name !== null && name.trim() !== '') {
    updateData.name = name.trim();
  }
  if (color !== undefined && color !== null && color.trim() !== '') {
    updateData.color = color.trim().toUpperCase(); // Normalize to uppercase
  }
  if (description !== undefined) {
    updateData.description = description === null ? null : description.trim();
  }
  if (boolean_goal_label !== undefined) {
    updateData.boolean_goal_label = boolean_goal_label === null ? null : boolean_goal_label.trim();
  }
  if (goal_type !== undefined && goal_type !== null) {
    updateData.goal_type = goal_type;
  }

  // Handle boolean fields
  if (is_boolean_goal !== undefined && is_boolean_goal !== null) {
    updateData.is_boolean_goal = Boolean(is_boolean_goal);
  }
  if (is_active !== undefined && is_active !== null) {
    updateData.is_active = Boolean(is_active);
  }

  // Handle numeric fields
  if (daily_time_goal_minutes !== undefined) {
    updateData.daily_time_goal_minutes = daily_time_goal_minutes === null ? null : Number(daily_time_goal_minutes);
  }
  if (weekly_time_goal_minutes !== undefined) {
    updateData.weekly_time_goal_minutes = weekly_time_goal_minutes === null ? null : Number(weekly_time_goal_minutes);
  }
  if (sort_order !== undefined && sort_order !== null) {
    updateData.sort_order = Number(sort_order);
  }
  if (level !== undefined && level !== null) {
    updateData.level = Number(level);
  }

  // Handle parent_id with enhanced logic
  if (parent_id !== undefined) {
    if (parent_id === 'none' || parent_id === null || parent_id === '') {
      updateData.parent_id = null;
    } else {
      updateData.parent_id = parent_id;
    }
  }

  // Always update the timestamp
  updateData.updated_at = new Date().toISOString();

  return updateData;
};

export const validateParentCategory = async (supabaseClient: any, parent_id: string, user_id: string, requestId: string) => {
  if (parent_id !== undefined && parent_id !== null && parent_id !== 'none' && parent_id !== '') {
    const { data: parentCategory, error: parentError } = await supabaseClient
      .from('categories')
      .select('id, level, user_id')
      .eq('id', parent_id)
      .eq('user_id', user_id)
      .single();

    if (parentError || !parentCategory) {
      logOperation('warn', 'Invalid parent category', { 
        requestId, 
        parentId: parent_id,
        error: parentError?.message 
      });
      throw new Error('Parent category not found or access denied');
    }

    if (parentCategory.level !== 0) {
      logOperation('warn', 'Parent must be top-level category', { 
        requestId, 
        parentId: parent_id,
        parentLevel: parentCategory.level 
      });
      throw new Error('Parent category must be a top-level category (level 0)');
    }
  }
};

export const validateCategoryExists = async (supabaseClient: any, id: string, user_id: string, requestId: string) => {
  const { data: existingCategory, error: fetchError } = await supabaseClient
    .from('categories')
    .select('id, user_id, name, parent_id, level')
    .eq('id', id)
    .eq('user_id', user_id)
    .single();

  if (fetchError) {
    logOperation('error', 'Error fetching category', { 
      requestId, 
      error: fetchError.message,
      categoryId: id,
      userId: user_id
    });
    throw new Error(`Failed to fetch category: ${fetchError.message}`);
  }

  if (!existingCategory) {
    logOperation('warn', 'Category not found or access denied', { 
      requestId, 
      categoryId: id, 
      userId: user_id 
    });
    throw new Error('Category not found or access denied');
  }

  return existingCategory;
};
