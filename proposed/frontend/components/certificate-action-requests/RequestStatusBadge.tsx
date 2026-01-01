import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { RequestStatus } from "@/lib/api/certificate-action-requests";

interface RequestStatusBadgeProps {
  status: RequestStatus;
}

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-700 border-blue-300"
        >
          <FileText className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "processing":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-700 border-yellow-300"
        >
          <Clock className="mr-1 h-3 w-3" />
          Processing
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-700 border-green-300"
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      );
    case "rejected":
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-700 border-red-300"
        >
          <XCircle className="mr-1 h-3 w-3" />
          Rejected
        </Badge>
      );
  }
}
