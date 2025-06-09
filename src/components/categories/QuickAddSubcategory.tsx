import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Check, X } from 'lucide-react';
import { Category } from '@/hooks/categories';

interface QuickAddSubcategoryProps {
  parentCategory: Category;
  onAdd: (data: { name: string; color: string; parent_id: string; level: number }) => void;
  onCancel: () => void;
}

export const QuickAddSubcategory: React.FC<QuickAddSubcategoryProps> = ({
  parentCategory,
  onAdd,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;
    
    setIsAdding(true);
    onAdd({
      name: name.trim(),
      color: parentCategory.color, // Use parent color as default
      parent_id: parentCategory.id,
      level: 1,
    });
    setName('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
      <Plus className="h-4 w-4 text-muted-foreground" />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Add subcategory to ${parentCategory.name}`}
        className="flex-1 h-8"
        autoFocus
        disabled={isAdding}
      />
      <Button
        size="sm"
        onClick={handleAdd}
        disabled={!name.trim() || isAdding}
        className="h-8 w-8 p-0"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onCancel}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
