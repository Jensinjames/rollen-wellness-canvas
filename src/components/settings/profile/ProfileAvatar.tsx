
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera } from "lucide-react";

interface ProfileAvatarProps {
  avatarUrl: string;
  displayName: string;
}

export const ProfileAvatar = ({ avatarUrl, displayName }: ProfileAvatarProps) => {
  return (
    <div className="flex items-center gap-6">
      <Avatar className="h-20 w-20">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback className="text-lg">
          {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <Button variant="outline" size="sm">
          <Camera className="h-4 w-4 mr-2" />
          Change Photo
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, GIF or PNG. 1MB max.
        </p>
      </div>
    </div>
  );
};
