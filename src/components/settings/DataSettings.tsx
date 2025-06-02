
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const DataSettings = () => {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      // This would implement actual data export logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate export
      
      toast({
        title: "Export Started",
        description: "Your data export will be ready shortly.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      // This would implement actual data import logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate import
      
      toast({
        title: "Import Successful",
        description: "Your data has been imported successfully.",
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import your data. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      // This would implement actual data deletion logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate deletion
      
      toast({
        title: "Data Deleted",
        description: "All your data has been permanently deleted.",
      });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Data Management</h3>
        <p className="text-sm text-muted-foreground">
          Export, import, or delete your data.
        </p>
      </div>

      {/* Export Data */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-blue-500" />
            <div>
              <h4 className="font-medium">Export Data</h4>
              <p className="text-sm text-muted-foreground">
                Download all your activities, categories, and settings as a JSON file.
              </p>
            </div>
          </div>
          <Button onClick={handleExportData} disabled={exporting}>
            {exporting ? "Exporting..." : "Export All Data"}
          </Button>
        </div>
      </Card>

      {/* Import Data */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-green-500" />
            <div>
              <h4 className="font-medium">Import Data</h4>
              <p className="text-sm text-muted-foreground">
                Upload a previously exported JSON file to restore your data.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="import-file">Select File</Label>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImportData}
              disabled={importing}
            />
          </div>
          {importing && (
            <p className="text-sm text-muted-foreground">Importing data...</p>
          )}
        </div>
      </Card>

      {/* Delete All Data */}
      <Card className="p-6 border-destructive">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <h4 className="font-medium text-destructive">Danger Zone</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete all your data. This action cannot be undone.
              </p>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-fit">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all
                  your activities, categories, and account data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </div>
  );
};
