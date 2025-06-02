
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Preferences {
  theme: "light" | "dark" | "system";
  defaultView: "month" | "week" | "day";
  weekStartsOn: "sunday" | "monday";
  notifications: boolean;
  showWeekends: boolean;
  timeFormat: "12h" | "24h";
}

export const PreferencesSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    theme: "system",
    defaultView: "month",
    weekStartsOn: "sunday",
    notifications: true,
    showWeekends: true,
    timeFormat: "12h",
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data?.preferences) {
        // Safely merge preferences, ensuring we have an object to spread
        const savedPreferences = data.preferences as Record<string, any>;
        if (savedPreferences && typeof savedPreferences === 'object') {
          setPreferences(prevPreferences => ({ ...prevPreferences, ...savedPreferences }));
        }
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user?.id,
          preferences: preferences as any, // Cast to satisfy Json type
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Preferences saved successfully",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => {
    setPreferences(prevPreferences => ({ ...prevPreferences, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Application Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Customize your app experience and default settings.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Appearance */}
          <div className="space-y-4">
            <h4 className="font-medium">Appearance</h4>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred theme
                  </p>
                </div>
                <Select
                  value={preferences.theme}
                  onValueChange={(value: "light" | "dark" | "system") =>
                    updatePreference("theme", value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Calendar Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Calendar Settings</h4>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default View</Label>
                  <p className="text-sm text-muted-foreground">
                    Default calendar view when opening the page
                  </p>
                </div>
                <Select
                  value={preferences.defaultView}
                  onValueChange={(value: "month" | "week" | "day") =>
                    updatePreference("defaultView", value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Week Starts On</Label>
                  <p className="text-sm text-muted-foreground">
                    First day of the week
                  </p>
                </div>
                <Select
                  value={preferences.weekStartsOn}
                  onValueChange={(value: "sunday" | "monday") =>
                    updatePreference("weekStartsOn", value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="monday">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Time Format</Label>
                  <p className="text-sm text-muted-foreground">
                    12-hour or 24-hour time format
                  </p>
                </div>
                <Select
                  value={preferences.timeFormat}
                  onValueChange={(value: "12h" | "24h") =>
                    updatePreference("timeFormat", value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 Hour</SelectItem>
                    <SelectItem value="24h">24 Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-weekends">Show Weekends</Label>
                  <p className="text-sm text-muted-foreground">
                    Display weekends in calendar views
                  </p>
                </div>
                <Switch
                  id="show-weekends"
                  checked={preferences.showWeekends}
                  onCheckedChange={(checked) =>
                    updatePreference("showWeekends", checked)
                  }
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h4 className="font-medium">Notifications</h4>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for reminders and updates
                </p>
              </div>
              <Switch
                id="notifications"
                checked={preferences.notifications}
                onCheckedChange={(checked) =>
                  updatePreference("notifications", checked)
                }
              />
            </div>
          </div>

          <Button onClick={savePreferences} disabled={loading}>
            {loading ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </Card>
    </div>
  );
};
