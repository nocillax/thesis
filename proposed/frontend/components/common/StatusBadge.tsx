import { Badge } from "@/components/ui/badge";
import { Unlock, Lock, CheckCircle, Ban } from "lucide-react";

interface StatusBadgeProps {
  isActive: boolean;
  showIcon?: boolean;
  type?: "user" | "certificate";
}

export function StatusBadge({
  isActive,
  showIcon = true,
  type = "certificate",
}: StatusBadgeProps) {
  if (type === "user") {
    return (
      <Badge
        variant="outline"
        className={
          isActive
            ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
            : "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
        }
      >
        {showIcon &&
          (isActive ? (
            <Unlock className="h-3 w-3 mr-1" />
          ) : (
            <Lock className="h-3 w-3 mr-1" />
          ))}
        {isActive ? "Authorized" : "Not Authorized"}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={
        isActive
          ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
          : "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
      }
    >
      {showIcon &&
        (isActive ? (
          <CheckCircle className="h-3 w-3 mr-1" />
        ) : (
          <Ban className="h-3 w-3 mr-1" />
        ))}
      {isActive ? "Active" : "Revoked"}
    </Badge>
  );
}
