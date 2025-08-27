import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { PreferencesSettings } from "@/components/settings/PreferencesSettings";
import { CategorySettings } from "@/components/settings/CategorySettings";
import { DataSettings } from "@/components/settings/DataSettings";
import { SystemSettings } from "@/components/settings/SystemSettings";
import { AppLayout } from "@/components/layout";

export default function Settings() {
  const searchParams = new URLSearchParams(window.location.search);
  const defaultTab = searchParams.get('tab') || 'profile';

  return (
    <AppLayout pageTitle="Settings">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto p-6 space-y-6">
          <Card className="p-6">
            <Tabs defaultValue={defaultTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <ProfileSettings />
              </TabsContent>

              <TabsContent value="preferences">
                <PreferencesSettings />
              </TabsContent>

              <TabsContent value="categories">
                <CategorySettings />
              </TabsContent>

              <TabsContent value="data">
                <DataSettings />
              </TabsContent>

              <TabsContent value="system">
                <SystemSettings />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
