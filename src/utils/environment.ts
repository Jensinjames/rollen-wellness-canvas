
/**
 * Environment utility functions for security-conscious development
 */

export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

export const isPreview = () => {
  // Detect Lovable preview environments
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('lovable');
};

export const getEnvironment = (): 'development' | 'preview' | 'production' => {
  if (isDevelopment()) return 'development';
  if (isPreview()) return 'preview';
  return 'production';
};

export const shouldShowDebugFeatures = () => {
  // Check for emergency debug mode override
  if (typeof window !== 'undefined') {
    const emergencyDebug = localStorage.getItem('DEBUG_MODE_ENABLED');
    if (emergencyDebug === 'true') return true;
  }
  
  // Show debug features in development and preview
  return isDevelopment() || isPreview();
};

export const shouldShowDebugInfo = () => {
  // DevPanel and debug info visible in dev and preview
  return isDevelopment() || isPreview();
};

export const getLogLevel = () => {
  const env = getEnvironment();
  if (env === 'production') return 'none';
  if (env === 'preview') return 'warn';
  return 'debug';
};

export const sanitizeForProduction = <T>(
  developmentValue: T,
  productionValue: T
): T => {
  return isProduction() ? productionValue : developmentValue;
};

// Security helper to prevent sensitive data exposure in production
export const safeConsoleLog = (message: string, data?: any) => {
  const logLevel = getLogLevel();
  
  if (logLevel === 'debug') {
    console.log(message, data);
  } else if (logLevel === 'warn') {
    // In preview, only log the message without sensitive data
    console.log(message);
  }
  // In production, don't log anything
};

export const safeConsoleError = (message: string, error?: any) => {
  const logLevel = getLogLevel();
  
  if (logLevel !== 'none') {
    console.error(message, error);
  }
};

export const safeConsoleWarn = (message: string, data?: any) => {
  const logLevel = getLogLevel();
  
  if (logLevel !== 'none') {
    console.warn(message, data);
  }
};
