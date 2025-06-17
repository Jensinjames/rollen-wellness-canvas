
/**
 * Environment utility functions for security-conscious development
 */

export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

export const shouldShowDebugFeatures = () => {
  // Only show debug features in development
  return isDevelopment();
};

export const getLogLevel = () => {
  // In production, only log warnings and errors
  return isProduction() ? 'warn' : 'debug';
};

export const sanitizeForProduction = <T>(
  developmentValue: T,
  productionValue: T
): T => {
  return isProduction() ? productionValue : developmentValue;
};

// Security helper to prevent sensitive data exposure in production
export const safeConsoleLog = (message: string, data?: any) => {
  if (isDevelopment()) {
    console.log(message, data);
  } else {
    // In production, only log the message without sensitive data
    console.log(message);
  }
};
