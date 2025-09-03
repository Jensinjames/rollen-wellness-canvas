
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefactoredActivityEntryForm } from "@/components/forms/RefactoredActivityEntryForm";
import { SleepEntryForm } from "@/components/forms/SleepEntryForm";
import { HabitLogForm } from "@/components/forms/HabitLogForm";
import { AnimatedDashboardUpdates } from "@/components/dashboard/AnimatedDashboardUpdates";
import { Plus } from "lucide-react";

interface AddEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedCategoryId?: string;
}

export function AddEntryModal({ open, onOpenChange, preselectedCategoryId }: AddEntryModalProps) {
  const [activeTab, setActiveTab] = useState("activity");
  const [showAnimations, setShowAnimations] = useState(false);

  const handleSuccess = () => {
    onOpenChange(false);
    setActiveTab("activity"); // Reset to default tab
    setShowAnimations(true);
    
    // Hide animations after 10 seconds
    setTimeout(() => setShowAnimations(false), 10000);
  };

  // Listen for activity logged events
  useEffect(() => {
    const handleActivityLogged = (event: CustomEvent) => {
      setShowAnimations(true);
      setTimeout(() => setShowAnimations(false), 10000);
    };

    window.addEventListener('activityLogged', handleActivityLogged as EventListener);
    return () => {
      window.removeEventListener('activityLogged', handleActivityLogged as EventListener);
    };
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-describedby="activity-form-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Log Time & Activities
            </DialogTitle>
          </DialogHeader>
          <div id="activity-form-description" className="sr-only">
            Use this form to log your activities and track your time across different categories.
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity">Time Tracking</TabsTrigger>
              <TabsTrigger value="sleep">Sleep</TabsTrigger>
              <TabsTrigger value="habit">Habit Log</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="activity" className="space-y-4">
                <RefactoredActivityEntryForm 
                  onSuccess={handleSuccess}
                  preselectedCategoryId={preselectedCategoryId}
                />
              </TabsContent>

              <TabsContent value="sleep" className="space-y-4">
                <SleepEntryForm onSuccess={handleSuccess} />
              </TabsContent>

              <TabsContent value="habit" className="space-y-4">
                <HabitLogForm onSuccess={handleSuccess} />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Animated Updates */}
      {showAnimations && <AnimatedDashboardUpdates />}
    </>
  );
}
