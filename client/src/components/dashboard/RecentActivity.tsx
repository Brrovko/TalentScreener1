import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Activity {
  sessionId: number;
  candidateName: string;
  testName: string;
  status: string;
  date: string;
}

const RecentActivity = () => {
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/recent-activity"],
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In progress";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest candidate test activity</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-neutral-500">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.sessionId}
                className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <div className="font-medium">{activity.candidateName}</div>
                  <div className="text-sm text-neutral-500">
                    {activity.testName}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Badge variant={getStatusBadgeVariant(activity.status)}>
                    {getStatusLabel(activity.status)}
                  </Badge>
                  <div className="text-xs text-neutral-500 mt-1">
                    {formatDistanceToNow(new Date(activity.date), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
