
import { logOperation } from './logger.ts';

export const parseRequestBody = async (req: Request, requestId: string) => {
  let body;
  let bodyText = '';
  
  try {
    const contentType = req.headers.get('content-type') || 'not-specified';
    
    bodyText = await req.text();
    logOperation('info', 'Raw request body received', { 
      requestId, 
      bodyLength: bodyText.length,
      contentType: contentType,
      bodyPreview: bodyText.length > 0 ? bodyText.substring(0, 200) : 'empty',
      headers: Object.fromEntries(req.headers.entries())
    });
    
    if (!bodyText || bodyText.trim() === '') {
      logOperation('error', 'Empty or missing request body', { 
        requestId,
        contentType,
        bodyLength: bodyText.length,
        rawBody: bodyText
      });
      throw new Error('Request body is required and cannot be empty');
    }
    
    body = JSON.parse(bodyText);
    logOperation('info', 'Request body parsed successfully', { 
      requestId, 
      fieldsProvided: Object.keys(body),
      categoryId: body.id,
      bodySize: JSON.stringify(body).length
    });

    return body;
  } catch (parseError) {
    logOperation('error', 'JSON parse error', { 
      requestId, 
      error: parseError.message,
      bodyText: bodyText.substring(0, 200),
      bodyLength: bodyText.length
    });
    throw new Error(`Invalid JSON in request body: ${parseError.message}`);
  }
};
