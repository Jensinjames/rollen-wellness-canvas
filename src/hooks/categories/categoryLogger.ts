
// Enhanced logging utilities for category operations

export const logCategoryOperation = (operation: string, payload: any, result?: any, error?: any) => {
  const logData = {
    timestamp: new Date().toISOString(),
    operation,
    categoryId: payload.id,
    categoryName: payload.name,
    success: !error,
    fieldsUpdated: payload ? Object.keys(payload).filter(k => k !== 'id') : [],
    error: error?.message,
    result: result ? { id: result.id, name: result.name } : undefined
  };
  
  console.log('[Category Operation]', logData);
};
