
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

interface FormErrors {
  display_name?: string;
}

interface Profile {
  display_name: string;
  avatar_url: string;
}

interface ProfileFormProps {
  user: User;
  profile: Profile;
  setProfile: (profile: Profile) => void;
  formErrors: FormErrors;
  loading: boolean;
  onSave: () => void;
}

export const ProfileForm = ({ 
  user, 
  profile, 
  setProfile, 
  formErrors, 
  loading, 
  onSave 
}: ProfileFormProps) => {
  const displayName = profile.display_name || "";

  return (
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

      <Button onClick={onSave} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
};
