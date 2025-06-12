
import { logOperation } from './logger.ts';
import { sanitizeUpdateData, validateParentCategory, validateCategoryExists } from './data-processing.ts';

export const performCategoryUpdate = async (
  supabaseClient: any, 
  body: any, 
  user: any, 
  requestId: string
) => {
  // Verify the category exists and belongs to the user
  await validateCategoryExists(supabaseClient, body.id, user.id, requestId);

  // Enhanced parent_id validation
  await validateParentCategory(supabaseClient, body.parent_id, user.id, requestId);

  // Prepare update data with enhanced sanitization
  const updateData = sanitizeUpdateData(body);

  // Ensure we have something meaningful to update
  const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'updated_at');
  if (fieldsToUpdate.length === 0) {
    logOperation('warn', 'No valid fields to update', { requestId });
    throw new Error('No valid fields to update');
  }

  logOperation('info', 'Performing category update', { 
    requestId, 
    categoryId: body.id,
    fieldsToUpdate,
    updateData: { ...updateData, updated_at: undefined } // Don't log timestamp
  });

  // Perform the update
  const { data: updatedCategory, error: updateError } = await supabaseClient
    .from('categories')
    .update(updateData)
    .eq('id', body.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) {
    logOperation('error', 'Database update error', {
      requestId,
      error: updateError.message,
      code: updateError.code,
      details: updateError.details
    });
    
    throw new Error(`Failed to update category: ${updateError.message}`);
  }

  logOperation('info', 'Category updated successfully', {
    requestId,
    categoryId: updatedCategory.id,
    categoryName: updatedCategory.name,
    fieldsUpdated: fieldsToUpdate
  });

  return { updatedCategory, fieldsToUpdate };
};
