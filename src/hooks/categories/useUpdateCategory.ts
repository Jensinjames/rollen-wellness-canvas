
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { Category } from './types';
import { updateCategoryRequest } from './updateCategoryRequest';
import { logCategoryOperation } from './categoryLogger';

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Category> & { id: string }) => {
      if (!user || !session) {
        throw new Error('User not authenticated');
      }

      if (!updates.id) {
        throw new Error('Category ID is required for update');
      }

      return updateCategoryRequest(updates, session, user);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      const fieldsUpdated = Object.keys(variables).filter(k => k !== 'id' && variables[k] !== undefined);
      const successMessage = `Category updated successfully (${fieldsUpdated.length} field${fieldsUpdated.length === 1 ? '' : 's'})`;
      
      toast.success(successMessage);
      
      console.log('[Category Update Success Toast]', {
        categoryId: data.id,
        categoryName: data.name,
        fieldsUpdated,
        successTimestamp: new Date().toISOString()
      });
    },
    onError: (error, variables) => {
      console.error('[Category Update Error Toast]', {
        error: error.message,
        categoryId: variables.id,
        categoryName: variables.name,
        errorTimestamp: new Date().toISOString()
      });
      
      toast.error(`Failed to update category: ${error.message}`);
    },
  });
};
