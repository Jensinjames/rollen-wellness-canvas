import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/UnifiedAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateTextInput } from "@/utils/validation";
import { logResourceEvent } from "@/utils/auditLog";

interface FormErrors {
  display_name?: string;
}

interface Profile {
  display_name: string;
  avatar_url: string;
}

export const useProfileData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [profile, setProfile] = useState<Profile>({
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

  return {
    profile,
    setProfile,
    loading,
    formErrors,
    updateProfile,
    user
  };
};
