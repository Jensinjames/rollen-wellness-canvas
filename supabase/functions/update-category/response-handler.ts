
import { corsHeaders } from './cors.ts';

export const createErrorResponse = (req: Request, error: string, details?: string, requestId?: string, status = 400) => {
  const responseBody = { 
    error,
    ...(details && { details }),
    ...(requestId && { requestId })
  };

  return new Response(JSON.stringify(responseBody), {
    status,
    headers: { ...corsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
  });
};

export const createSuccessResponse = (req: Request, data: any, fieldsUpdated: string[], requestId: string) => {
  const responseBody = { 
    data,
    message: 'Category updated successfully',
    fieldsUpdated,
    requestId
  };

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { ...corsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
  });
};
