import { Badge } from "@/components/ui/badge";
import { Ban, RefreshCw } from "lucide-react";

interface RequestActionBadgeProps {
  action: "revoke" | "reactivate";
}

export function RequestActionBadge({ action }: RequestActionBadgeProps) {
  if (action === "revoke") {
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200"
      >
        <Ban className="mr-1 h-3 w-3" />
        Revoke
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-blue-50 text-blue-700 border-blue-200"
    >
      <RefreshCw className="mr-1 h-3 w-3" />
      Reactivate
    </Badge>
  );
}
