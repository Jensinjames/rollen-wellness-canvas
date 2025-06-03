
// Category color utilities with brand-specific gradients
export const CATEGORY_COLORS = {
  Faith: '#10B981',
  Life: '#F59E0B', 
  Work: '#EF4444',
  Health: '#EC4899'
} as const;

export const generateSubcategoryGradient = (parentColor: string, index: number, total: number): string => {
  // Create lighter shades for subcategories
  const baseHex = parentColor.replace('#', '');
  const r = parseInt(baseHex.substr(0, 2), 16);
  const g = parseInt(baseHex.substr(2, 2), 16);
  const b = parseInt(baseHex.substr(4, 2), 16);
  
  // Generate gradient from 40% lighter to 20% darker
  const factor = 0.4 - (index / total) * 0.6;
  
  const newR = Math.max(0, Math.min(255, Math.round(r + (255 - r) * factor)));
  const newG = Math.max(0, Math.min(255, Math.round(g + (255 - g) * factor)));
  const newB = Math.max(0, Math.min(255, Math.round(b + (255 - b) * factor)));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

export const getCategoryBrandColor = (categoryName: string): string => {
  const key = Object.keys(CATEGORY_COLORS).find(k => 
    categoryName.toLowerCase().includes(k.toLowerCase())
  ) as keyof typeof CATEGORY_COLORS;
  
  return key ? CATEGORY_COLORS[key] : '#6B7280';
};
