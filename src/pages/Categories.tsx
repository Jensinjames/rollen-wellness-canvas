import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/Sidebar';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { HierarchicalCategoryCard } from '@/components/categories/HierarchicalCategoryCard';
import { Button } from '@/components/ui/button';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useSeedDefaultCategories, Category } from '@/hooks/categories';
import { Loader2, FolderOpen, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const Categories = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [parentForNewSubcategory, setParentForNewSubcategory] = useState<Category | undefined>(undefined);

  const { data: categories, isLoading } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const seedDefaultCategories = useSeedDefaultCategories();

  const handleCreateCategory = (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'path' | 'children'>) => {
    console.log('Creating category:', categoryData);
    createCategoryMutation.mutate(categoryData, {
      onSuccess: () => {
        handleCloseForm();
        toast.success(`${categoryData.level === 1 ? 'Subcategory' : 'Category'} created successfully!`);
      },
      onError: (error: any) => {
        if (error.message.includes('already exists')) {
          toast.error(error.message);
        } else {
          toast.error('Failed to create category. Please try again.');
        }
        console.error('Category creation error:', error);
      }
    });
  };

  const handleUpdateCategory = (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'path' | 'children'>) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        ...categoryData,
      }, {
        onSuccess: () => {
          handleCloseForm();
          toast.success('Category updated successfully!');
        },
        onError: (error: any) => {
          if (error.message.includes('already exists')) {
            toast.error(error.message);
          } else {
            toast.error('Failed to update category. Please try again.');
          }
          console.error('Category update error:', error);
        }
      });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setParentForNewSubcategory(undefined);
    setIsFormOpen(true);
  };

  const handleAddSubcategory = (parentCategory: Category) => {
    console.log('Adding subcategory to parent:', parentCategory.name);
    setParentForNewSubcategory(parentCategory);
    setEditingCategory(undefined);
    setIsFormOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all subcategories and associated activities.')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(undefined);
    setParentForNewSubcategory(undefined);
  };

  const handleAddDefaultCategories = () => {
    seedDefaultCategories.mutate();
  };

  const getFormTitle = () => {
    if (editingCategory) {
      return editingCategory.level === 0 ? 'Edit Category' : 'Edit Subcategory';
    }
    if (parentForNewSubcategory) {
      return `Add Subcategory to ${parentForNewSubcategory.name}`;
    }
    return 'Create New Category';
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
                  <p className="text-blue-100">Create and manage your personal category structure</p>
                </div>
              </div>
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </div>

          <div className="p-6">
            {categories && categories.length > 0 ? (
              <div className="space-y-6">
                {categories.map((category) => (
                  <HierarchicalCategoryCard
                    key={category.id}
                    category={category}
                    onEdit={handleEditCategory}
                    onArchive={handleDeleteCategory}
                    onDelete={handleDeleteCategory}
                    onAddSubcategory={handleAddSubcategory}
                    activityCount={0}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="text-gray-500 mb-4">
                  No categories yet. Create your first category to get started!
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={() => setIsFormOpen(true)}
                    className="mr-3"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                  <Button
                    onClick={handleAddDefaultCategories}
                    variant="outline"
                    disabled={seedDefaultCategories.isPending}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Add Suggested Categories
                  </Button>
                </div>
                <p className="text-sm text-gray-400 mt-4">
                  Or start with suggested categories: Faith, Life, Work, and Health
                </p>
              </div>
            )}
          </div>

          <CategoryForm
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
            category={editingCategory}
            title={getFormTitle()}
            forceParent={parentForNewSubcategory}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Categories;
