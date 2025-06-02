
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Camera } from "lucide-react";
import { validateTextInput } from "@/utils/validation";
import { logResourceEvent } from "@/utils/auditLog";

interface FormErrors {
  display_name?: string;
}

export const ProfileSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [profile, setProfile] = useState({
    display_name: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfile({
          display_name: data.display_name || "",
          avatar_url: data.avatar_url || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive",
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const displayName = profile.display_name || "";

    // Validate display name
    const nameValidation = validateTextInput(displayName, {
      required: false,
      minLength: 0,
      maxLength: 50,
      allowEmpty: true
    });
    
    if (!nameValidation.isValid) {
      errors.display_name = nameValidation.error;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateProfile = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors before saving",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const displayName = profile.display_name || "";
      
      // Sanitize input
      const nameValidation = validateTextInput(displayName, { maxLength: 50 });
      
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.error);
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user?.id,
          display_name: nameValidation.sanitized,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Log the profile update
      if (user) {
        logResourceEvent('profile.update', user.id, user.id, {
          display_name_changed: nameValidation.sanitized !== displayName
        });
      }

      // Update local state with sanitized value
      setProfile(prev => ({ ...prev, display_name: nameValidation.sanitized }));

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const displayName = profile.display_name || "";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile Information</h3>
        <p className="text-sm text-muted-foreground">
          Update your personal information and profile picture.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-lg">
                {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, GIF or PNG. 1MB max.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) =>
                  setProfile({ ...profile, display_name: e.target.value })
                }
                placeholder="Enter your display name"
                maxLength={50}
              />
              {formErrors.display_name && (
                <p className="text-sm text-red-600">{formErrors.display_name}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {displayName.length}/50 characters
              </p>
            </div>
          </div>

          <Button onClick={updateProfile} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>
    </div>
  );
};
