import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/UnifiedAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateTextInput } from "@/utils/validation";

interface FormErrors {
  display_name?: string;
}

interface Profile {
  display_name: string;
  avatar_url: string;
}

export const useProfileData = () => {
  const { user } = useAuth();
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
        .maybeSingle();

      if (error) {
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
      toast.error("Failed to load profile information");
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const displayName = profile.display_name || "";

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

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }
      if (file.size > 1024 * 1024) {
        throw new Error('File size must be less than 1MB');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache buster to force refresh
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      toast.success("Avatar updated successfully");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!validateForm()) {
      toast.error("Please correct the errors before saving");
      return;
    }

    setLoading(true);
    try {
      const displayName = profile.display_name || "";
      
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

      setProfile(prev => ({ ...prev, display_name: nameValidation.sanitized }));
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
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
    uploadAvatar,
    user
  };
};
