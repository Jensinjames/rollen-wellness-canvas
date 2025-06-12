
// Phase 3: Enhanced structured logging function
export const logOperation = (level: 'info' | 'warn' | 'error', message: string, context: any = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    function: 'update-category',
    ...context
  };
  console.log(JSON.stringify(logEntry));
};
