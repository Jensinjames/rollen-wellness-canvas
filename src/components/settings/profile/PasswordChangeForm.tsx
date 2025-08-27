import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/UnifiedAuthContext";
import { toast } from "sonner";
import { validatePassword } from "@/utils/validation";

export const PasswordChangeForm = () => {
  const { updatePassword } = useAuth();
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validate new password
    const passwordValidation = validatePassword(passwords.new);
    if (!passwordValidation.isValid) {
      setErrors([passwordValidation.error || "Invalid password"]);
      return;
    }

    // Confirm passwords match
    if (passwords.new !== passwords.confirm) {
      setErrors(["Passwords do not match"]);
      return;
    }

    setLoading(true);
    try {
      if (updatePassword) {
        const result = await updatePassword(passwords.new);
        if (result?.error) {
          setErrors([result.error.message || "Failed to update password"]);
        } else {
          toast.success("Password updated successfully");
          setPasswords({ current: "", new: "", confirm: "" });
        }
      }
    } catch (error) {
      setErrors(["An unexpected error occurred"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
              placeholder="Confirm new password"
              required
            />
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};