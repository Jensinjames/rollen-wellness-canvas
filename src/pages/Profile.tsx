import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/settings/profile/ProfileAvatar";
import { ProfileForm } from "@/components/settings/profile/ProfileForm";
import { useProfileData } from "@/components/settings/profile/useProfileData";

export default function Profile() {
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-2xl space-y-8 py-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
              <p className="text-muted-foreground">
                Manage your personal information and profile picture.
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
        </main>
      </div>
    </SidebarProvider>
  );
}
