import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera, Loader2 } from "lucide-react";

interface ProfileAvatarProps {
  avatarUrl: string;
  displayName: string;
  onUpload?: (file: File) => Promise<void>;
  loading?: boolean;
}

export const ProfileAvatar = ({ 
  avatarUrl, 
  displayName, 
  onUpload,
  loading 
}: ProfileAvatarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }
      // Validate file size (1MB max)
      if (file.size > 1024 * 1024) {
        return;
      }
      await onUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-6">
      <Avatar className="h-20 w-20">
        <AvatarImage src={avatarUrl} loading="lazy" />
        <AvatarFallback className="text-lg bg-primary/10">
          {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Camera className="h-4 w-4 mr-2" />
          )}
          {loading ? "Uploading..." : "Change Photo"}
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, GIF or WebP. 1MB max.
        </p>
      </div>
    </div>
  );
};
