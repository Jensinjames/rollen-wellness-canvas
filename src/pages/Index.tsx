import { AppLayout } from "@/components/layout";
import { EnhancedDashboard } from "@/components/dashboard/EnhancedDashboard";

export default function IndexPage() {
  return (
    <AppLayout pageTitle="Dashboard">
      <EnhancedDashboard />
    </AppLayout>
  );
}
