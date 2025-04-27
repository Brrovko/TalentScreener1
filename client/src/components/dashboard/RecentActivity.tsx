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
import { useTranslation } from "react-i18next";

interface Activity {
  sessionId: number;
  candidateName: string;
  testName: string;
  status: string;
  date: string;
}

const RecentActivity = () => {
  const { t } = useTranslation();
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/recent-activity"],
  });

  const getStatusBadgeVariant = (status: string): "success" | "secondary" | "default" | "destructive" | "outline" => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "secondary"; // раньше было "warning", но такого варианта нет
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return t('candidates.completed');
      case "in_progress":
        return t('candidates.in_progress');
      case "pending":
        return t('candidates.pending');
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recent_activity')}</CardTitle>
        <CardDescription>{t('dashboard.latest_activity', 'Latest candidate test activity')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">{t('common.loading')}</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-neutral-500">
            {t('dashboard.no_activity', 'No recent activity')}
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
