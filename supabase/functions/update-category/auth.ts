
import { logOperation } from './logger.ts';

export const validateAuthHeader = (authHeader: string | null, requestId: string) => {
  if (!authHeader) {
    logOperation('warn', 'Missing authorization header', { requestId });
    throw new Error('Authorization header required');
  }
};

export const authenticateUser = async (supabaseClient: any, authHeader: string | null, requestId: string) => {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    logOperation('error', 'Authentication error', { 
      requestId, 
      error: userError?.message,
      hasAuthHeader: !!authHeader
    });
    throw new Error('Unauthorized - invalid or expired session');
  }

  logOperation('info', 'User authenticated successfully', { 
    requestId, 
    userId: user.id
  });

  return user;
};
