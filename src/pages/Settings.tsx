
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { PreferencesSettings } from "@/components/settings/PreferencesSettings";
import { CategorySettings } from "@/components/settings/CategorySettings";
import { DataSettings } from "@/components/settings/DataSettings";
import { SystemSettings } from "@/components/settings/SystemSettings";

export default function Settings() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto p-6 space-y-6">
              {/* Header with Sidebar Trigger */}
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Settings
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage your account and application preferences
                  </p>
                </div>
              </div>

              {/* Settings Tabs */}
              <Card className="p-6">
                <Tabs defaultValue="profile" className="space-y-6">
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
