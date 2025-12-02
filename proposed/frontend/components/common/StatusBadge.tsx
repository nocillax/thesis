import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface StatusBadgeProps {
  isActive: boolean;
  showIcon?: boolean;
}

export function StatusBadge({ isActive, showIcon = true }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={
        isActive
          ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
          : "bg-destructive/10 text-destructive border-destructive"
      }
    >
      {showIcon &&
        (isActive ? (
          <CheckCircle2 className="h-3 w-3 mr-1" />
        ) : (
          <XCircle className="h-3 w-3 mr-1" />
        ))}
      {isActive ? "Active" : "Revoked"}
    </Badge>
  );
}
