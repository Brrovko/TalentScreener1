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
import { Link } from "wouter";

interface Activity {
  sessionId: number;
  candidateId: number;
  candidateName: string;
  testName: string;
  status: string;
  date: string;
  passed?: boolean | null;
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
            {[...activities]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .map((activity) => (
    <div
      key={`${activity.sessionId}-${activity.date}`}
      className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
    >
      <div>
        <div className="font-medium">
          <Link to={`/dashboard/candidates/${activity.candidateId}`} className="text-blue-600 hover:underline">
            {activity.candidateName}
          </Link>
        </div>
        <div className="text-sm text-neutral-500 flex items-center gap-1">
  {activity.passed === true && <span title="Тест сдан" className="text-green-600">✅</span>}
  {activity.passed === false && <span title="Тест не сдан" className="text-red-500">❌</span>}
  {activity.testName}
</div>
      </div>
      <div className="flex flex-col items-end">
        <Badge variant={getStatusBadgeVariant(activity.status)}>
          {getStatusLabel(activity.status)}
        </Badge>
        <div className="text-xs text-neutral-500 mt-1 flex items-center">
  <span title={activity.date} className="text-sm text-neutral-500">
    {new Date(activity.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
  </span>
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
