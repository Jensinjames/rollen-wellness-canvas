
import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category } from '@/hooks/useCategories';
import { Loader2 } from 'lucide-react';

const Categories = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);

  const { data: categories, isLoading } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const handleCreateCategory = (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    createCategoryMutation.mutate(categoryData);
  };

  const handleUpdateCategory = (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        ...categoryData,
      });
      setEditingCategory(undefined);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleArchiveCategory = (id: string) => {
    deleteCategoryMutation.mutate(id);
  };

  const handleDeleteCategory = (id: string) => {
    // For now, we'll just archive - permanent deletion can be added later
    deleteCategoryMutation.mutate(id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(undefined);
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:bg-white/10" />
                <div>
                  <h1 className="text-2xl font-bold">Category Management</h1>
                  <p className="text-blue-100">Organize your wellness activities</p>
                </div>
              </div>
              <Button 
                onClick={() => setIsFormOpen(true)}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          </div>

          <div className="p-6">
            {categories && categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={handleEditCategory}
                    onArchive={handleArchiveCategory}
                    onDelete={handleDeleteCategory}
                    activityCount={0} // TODO: Add activity count from database
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">No categories found</div>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Category
                </Button>
              </div>
            )}
          </div>

          <CategoryForm
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
            category={editingCategory}
            title={editingCategory ? 'Edit Category' : 'Create New Category'}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Categories;
