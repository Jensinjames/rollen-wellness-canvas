
// Unified category color utilities with design system integration
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

// Color manipulation utilities
export const adjustColorOpacity = (color: string, opacity: number): string => {
  // If color is HSL, return as-is with opacity
  if (color.startsWith('hsl')) {
    return color.replace(')', `, ${opacity})`).replace('hsl', 'hsla');
  }
  
  const hex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${color}${hex}`;
};

export const lightenColor = (color: string, factor: number): string => {
  // If color is HSL, use CSS calc() function
  if (color.startsWith('hsl')) {
    return `hsl(var(--primary) / ${1 - factor})`;
  }
  
  const baseHex = color.replace('#', '');
  const r = parseInt(baseHex.substr(0, 2), 16);
  const g = parseInt(baseHex.substr(2, 2), 16);
  const b = parseInt(baseHex.substr(4, 2), 16);
  
  const newR = Math.max(0, Math.min(255, Math.round(r + (255 - r) * factor)));
  const newG = Math.max(0, Math.min(255, Math.round(g + (255 - g) * factor)));
  const newB = Math.max(0, Math.min(255, Math.round(b + (255 - b) * factor)));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

// Design system color utilities
export const getSemanticColor = (colorType: 'primary' | 'secondary' | 'accent' | 'muted'): string => {
  switch (colorType) {
    case 'primary':
      return 'hsl(var(--primary))';
    case 'secondary':
      return 'hsl(var(--secondary))';
    case 'accent':
      return 'hsl(var(--accent))';
    case 'muted':
      return 'hsl(var(--muted))';
    default:
      return 'hsl(var(--primary))';
  }
};

// Category-specific color schemes using design system
export const getCategoryColorScheme = (category: string): string => {
  const colorMap: Record<string, string> = {
    'Faith': '#8B5CF6',
    'Life': '#10B981',
    'Work': '#3B82F6',
    'Health': '#F59E0B',
    // Fallback to design system colors
    default: getSemanticColor('primary')
  };
  
  return colorMap[category] || colorMap.default;
};
