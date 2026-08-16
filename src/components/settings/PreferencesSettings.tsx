
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/UnifiedAuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SleepPreferences {
  target_sleep_hours: number;
  acceptable_range_min: number;
  acceptable_range_max: number;
  sleep_quality_weight: number;
  sleep_duration_weight: number;
  motivation_boost_threshold: number;
}

export const PreferencesSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [sleepPreferences, setSleepPreferences] = useState<SleepPreferences>({
    target_sleep_hours: 8,
    acceptable_range_min: 6,
    acceptable_range_max: 10,
    sleep_quality_weight: 0.3,
    sleep_duration_weight: 0.7,
    motivation_boost_threshold: 7,
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
        .select("sleep_preferences")
        .eq("id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data?.sleep_preferences) {
        const prefs = data.sleep_preferences as Record<string, any>;
        setSleepPreferences(prev => ({ ...prev, ...prefs }));
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching preferences:", error);
      }
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive",
      });
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          sleep_preferences: sleepPreferences as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Preferences saved successfully",
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error saving preferences:", error);
      }
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sleep Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target_sleep_hours">Target Sleep (hours)</Label>
              <Input
                id="target_sleep_hours"
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={sleepPreferences.target_sleep_hours}
                onChange={(e) => setSleepPreferences(prev => ({
                  ...prev,
                  target_sleep_hours: parseFloat(e.target.value)
                }))}
              />
            </div>
            <div>
              <Label htmlFor="motivation_boost_threshold">Motivation Boost Threshold (hours)</Label>
              <Input
                id="motivation_boost_threshold"
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={sleepPreferences.motivation_boost_threshold}
                onChange={(e) => setSleepPreferences(prev => ({
                  ...prev,
                  motivation_boost_threshold: parseFloat(e.target.value)
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="acceptable_range_min">Minimum Acceptable (hours)</Label>
              <Input
                id="acceptable_range_min"
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={sleepPreferences.acceptable_range_min}
                onChange={(e) => setSleepPreferences(prev => ({
                  ...prev,
                  acceptable_range_min: parseFloat(e.target.value)
                }))}
              />
            </div>
            <div>
              <Label htmlFor="acceptable_range_max">Maximum Acceptable (hours)</Label>
              <Input
                id="acceptable_range_max"
                type="number"
                min="1"
                max="15"
                step="0.5"
                value={sleepPreferences.acceptable_range_max}
                onChange={(e) => setSleepPreferences(prev => ({
                  ...prev,
                  acceptable_range_max: parseFloat(e.target.value)
                }))}
              />
            </div>
          </div>

          <Button 
            onClick={savePreferences} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
