import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, FolderPlus } from 'lucide-react';
import { useSeedDefaultCategories } from '@/hooks/categories/useCategorySeed';
import { useNavigate } from 'react-router-dom';

export function DashboardEmptyState() {
  const seedCategories = useSeedDefaultCategories();
  const navigate = useNavigate();

  const handleSeedCategories = async () => {
    await seedCategories.mutateAsync();
  };

  const handleCreateCustom = () => {
    navigate('/categories');
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-12 pb-12 px-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Welcome to Your Wellness Tracker!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Get started by creating categories to organize your activities. 
              Categories help you track time, set goals, and monitor your progress.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={handleSeedCategories}
              disabled={seedCategories.isPending}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {seedCategories.isPending ? 'Adding Categories...' : 'Add Suggested Categories'}
            </Button>

            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleCreateCustom}
            >
              <FolderPlus className="mr-2 h-5 w-5" />
              Create Custom Category
            </Button>
          </div>

          <div className="pt-4 space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Suggested categories include:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Work', 'Exercise', 'Sleep', 'Social', 'Learning'].map((cat) => (
                <span 
                  key={cat} 
                  className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
