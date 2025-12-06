import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  walletAddress: string;
  username: string;
  isAdmin?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({
  walletAddress,
  username,
  isAdmin = false,
  size = "md",
  className = "",
}: UserAvatarProps) {
  // Generate DiceBear avatar URL
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`;

  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24",
  };

  const fallbackSizeClasses = {
    sm: "text-xs",
    md: "text-base",
    lg: "text-2xl",
  };

  // Border classes - muted for regular users, gold for admins
  const borderClasses = isAdmin
    ? "ring-2 ring-yellow-500 dark:ring-yellow-600"
    : "ring-1 ring-border";

  return (
    <Avatar className={`${sizeClasses[size]} ${borderClasses} ${className}`}>
      <AvatarImage src={avatarUrl} />
      <AvatarFallback
        className={`${fallbackSizeClasses[size]} font-semibold bg-primary text-primary-foreground`}
      >
        {username.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
