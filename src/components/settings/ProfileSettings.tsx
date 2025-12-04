import { Card } from "@/components/ui/card";
import { ProfileAvatar } from "./profile/ProfileAvatar";
import { ProfileForm } from "./profile/ProfileForm";
import { useProfileData } from "./profile/useProfileData";

export const ProfileSettings = () => {
  const {
    profile,
    setProfile,
    loading,
    formErrors,
    updateProfile,
    uploadAvatar,
    user
  } = useProfileData();

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
          <ProfileAvatar 
            avatarUrl={profile.avatar_url}
            displayName={displayName}
            onUpload={uploadAvatar}
            loading={loading}
          />

          <ProfileForm
            user={user}
            profile={profile}
            setProfile={setProfile}
            formErrors={formErrors}
            loading={loading}
            onSave={updateProfile}
          />
        </div>
      </Card>
    </div>
  );
};
