
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityEntryForm } from "@/components/forms/ActivityEntryForm";
import { SleepEntryForm } from "@/components/forms/SleepEntryForm";
import { HabitLogForm } from "@/components/forms/HabitLogForm";
import { Plus } from "lucide-react";

interface AddEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEntryModal({ open, onOpenChange }: AddEntryModalProps) {
  const [activeTab, setActiveTab] = useState("activity");

  const handleSuccess = () => {
    onOpenChange(false);
    setActiveTab("activity"); // Reset to default tab
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Entry
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
            <TabsTrigger value="habit">Habit Log</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="activity" className="space-y-4">
              <ActivityEntryForm onSuccess={handleSuccess} />
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
  );
}
