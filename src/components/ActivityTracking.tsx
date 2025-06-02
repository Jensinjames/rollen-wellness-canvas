
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export function ActivityTracking() {
  return (
    <Card className="p-8 text-center">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <Clock className="h-8 w-8 text-gray-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">No Active Tracking</h3>
          <p className="text-muted-foreground mb-6">
            Start tracking an activity to monitor your wellness progress.
          </p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded-full">
          Start Tracking
        </Button>
      </div>
    </Card>
  );
}
