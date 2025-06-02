
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Link } from "react-router-dom";

export function Calendar() {
  return (
    <Card className="p-8 text-center">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <CalendarIcon className="h-8 w-8 text-gray-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Calendar View</h3>
          <p className="text-muted-foreground mb-6">
            View your activities and sleep patterns in calendar format.
          </p>
        </div>
        <Link to="/calendar">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded-full">
            Open Calendar
          </Button>
        </Link>
      </div>
    </Card>
  );
}
