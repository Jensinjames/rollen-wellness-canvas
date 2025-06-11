
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { logCategoryOperation } from '@/components/categories/CategoryValidation';
import { Category } from './types';
import { sanitizePayload } from './categoryMutationUtils';

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Category> & { id: string }) => {
      if (!user || !session) throw new Error('User not authenticated');

      // Validate that we have required fields
      if (!updates.id) {
        throw new Error('Category ID is required for update');
      }

      // Sanitize the payload before sending
      let sanitizedPayload;
      try {
        sanitizedPayload = sanitizePayload(updates);
      } catch (error: any) {
        throw new Error(`Payload validation failed: ${error.message}`);
      }

      // Log the operation
      logCategoryOperation('update', sanitizedPayload);

      console.log('Sending update request:', {
        payload: sanitizedPayload,
        hasSession: !!session.access_token,
        userId: user.id
      });

      try {
        // Call the edge function with proper body stringification
        const response = await fetch(`https://dhtgoqoapwxioayzbdfu.supabase.co/functions/v1/update-category`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sanitizedPayload),
        });

        console.log('Edge function response status:', response.status);

        const responseData = await response.json();
        console.log('Edge function response data:', responseData);

        if (!response.ok) {
          console.error('Edge function error response:', responseData);
          throw new Error(responseData.error || `Server error: ${response.status}`);
        }

        if (!responseData.data) {
          console.error('Invalid response format:', responseData);
          throw new Error(responseData.error || 'Invalid response from server');
        }

        console.log('Category update successful:', responseData.data);
        return responseData.data;
      } catch (error: any) {
        // Enhanced error logging and handling
        console.error('Update category error details:', {
          error: error.message,
          payload: sanitizedPayload,
          hasSession: !!session,
          userId: user?.id,
          errorType: error.name
        });
        
        // Provide more user-friendly error messages
        if (error.message.includes('timeout') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
        
        if (error.message.includes('unauthorized') || error.message.includes('401')) {
          throw new Error('Session expired. Please refresh the page and try again.');
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast.error(`Failed to update category: ${error.message}`);
    },
  });
};
