
import { Category } from './types';

// Enhanced hierarchical tree structure builder with deduplication and validation
export const buildCategoryTree = (categories: Category[]): Category[] => {
  if (!categories || !Array.isArray(categories)) {
    console.warn('buildCategoryTree: Invalid categories input:', { categories, type: typeof categories });
    return [];
  }

  // Step 1: Deduplicate categories by ID and validate
  const uniqueCategories = new Map<string, Category>();
  categories.forEach(category => {
    if (category && 
        category.id && 
        typeof category.id === 'string' &&
        category.name && 
        typeof category.name === 'string' &&
        category.name.trim() !== '') {
      
      // Keep the most recently updated category if duplicates exist
      const existing = uniqueCategories.get(category.id);
      if (!existing || new Date(category.updated_at || category.created_at) > new Date(existing.updated_at || existing.created_at)) {
        uniqueCategories.set(category.id, { ...category, children: [] });
      }
    }
  });

  console.log('buildCategoryTree: Processed categories:', {
    inputCount: categories.length,
    uniqueCount: uniqueCategories.size,
    validCategories: Array.from(uniqueCategories.values()).map(c => ({ id: c.id, name: c.name, level: c.level, parent_id: c.parent_id }))
  });

  const categoryMap = uniqueCategories;
  const rootCategories: Category[] = [];

  // Step 2: Build tree structure with validation
  Array.from(categoryMap.values()).forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)!;
    
    if (category.parent_id && typeof category.parent_id === 'string') {
      const parent = categoryMap.get(category.parent_id);
      if (parent && parent.level === 0) {
        // Ensure we don't add the same child twice
        if (!parent.children?.some(child => child.id === categoryWithChildren.id)) {
          parent.children!.push(categoryWithChildren);
        }
      } else {
        console.warn('buildCategoryTree: Invalid parent reference:', { 
          childId: category.id, 
          childName: category.name,
          parentId: category.parent_id,
          parentExists: !!parent,
          parentLevel: parent?.level
        });
        // Treat as root category if parent is invalid
        if (category.level === 0) {
          rootCategories.push(categoryWithChildren);
        }
      }
    } else if (category.level === 0) {
      rootCategories.push(categoryWithChildren);
    }
  });

  // Step 3: Sort categories and their children
  const sortCategories = (cats: Category[]) => {
    if (!cats || !Array.isArray(cats)) return;
    
    cats.sort((a, b) => {
      const aOrder = typeof a.sort_order === 'number' ? a.sort_order : 999;
      const bOrder = typeof b.sort_order === 'number' ? b.sort_order : 999;
      return aOrder - bOrder;
    });
    
    cats.forEach(cat => {
      if (cat.children && Array.isArray(cat.children) && cat.children.length > 0) {
        sortCategories(cat.children);
      }
    });
  };

  sortCategories(rootCategories);
  
  console.log('buildCategoryTree: Final tree structure:', {
    rootCategoriesCount: rootCategories.length,
    tree: rootCategories.map(root => ({
      id: root.id,
      name: root.name,
      childrenCount: root.children?.length || 0,
      children: root.children?.map(child => ({ id: child.id, name: child.name })) || []
    }))
  });

  return rootCategories;
};
