import { Category } from './types';

// Utility to sanitize payload before sending to edge function
export const sanitizePayload = (updates: Partial<Category> & { id: string }) => {
  const sanitized: any = {};
  
  // Always include the ID
  sanitized.id = updates.id;
  
  // Handle each field with proper type conversion and validation
  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'id') return; // Already handled above
    
    switch (key) {
      case 'parent_id':
        // Handle parent_id conversion: 'none' -> null, keep actual UUIDs
        if (value === 'none' || value === null || value === undefined) {
          sanitized.parent_id = null;
        } else if (typeof value === 'string' && value.trim() !== '') {
          sanitized.parent_id = value.trim();
        }
        break;
        
      case 'name':
      case 'color':
      case 'goal_type':
        // Required string fields - only include if non-empty
        if (typeof value === 'string' && value.trim() !== '') {
          sanitized[key] = value.trim();
        }
        break;
        
      case 'description':
      case 'boolean_goal_label':
        // Optional string fields - include null values
        if (value === null || value === undefined) {
          sanitized[key] = null;
        } else if (typeof value === 'string') {
          sanitized[key] = value.trim() === '' ? null : value.trim();
        }
        break;
        
      case 'is_boolean_goal':
      case 'is_active':
        // Boolean fields
        if (typeof value === 'boolean') {
          sanitized[key] = value;
        }
        break;
        
      case 'daily_time_goal_minutes':
      case 'weekly_time_goal_minutes':
        // Optional numeric fields
        if (value === null || value === undefined) {
          sanitized[key] = null;
        } else if (typeof value === 'number' && !isNaN(value)) {
          sanitized[key] = value;
        }
        break;
        
      case 'sort_order':
      case 'level':
        // Required numeric fields
        if (typeof value === 'number' && !isNaN(value)) {
          sanitized[key] = value;
        }
        break;
        
      default:
        // For other fields, include if not undefined
        if (value !== undefined) {
          sanitized[key] = value;
        }
    }
  });
  
  // Ensure we have at least one field to update besides id
  const fieldsToUpdate = Object.keys(sanitized).filter(key => key !== 'id');
  if (fieldsToUpdate.length === 0) {
    throw new Error('No fields to update');
  }
  
  console.log('Sanitized payload for edge function:', sanitized);
  return sanitized;
};
