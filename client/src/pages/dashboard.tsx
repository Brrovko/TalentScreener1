import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Users, CheckCircle, Clock } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { useTranslation } from "react-i18next";

interface DashboardStats {
  totalTests: number;
  activeTests: number;
  totalCandidates: number;
  pendingSessions: number;
  completedSessions: number;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-800 mb-6">{t('common.dashboard')}</h1>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-neutral-100 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={t('dashboard.total_tests')}
            value={stats?.totalTests || 0}
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <StatsCard
            title={t('dashboard.active_tests')}
            value={stats?.activeTests || 0}
            description={`${Math.round(
              ((stats?.activeTests || 0) / (stats?.totalTests || 1)) * 100
            )}% of total tests`}
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <StatsCard
            title={t('common.candidates')}
            value={stats?.totalCandidates || 0}
            icon={<Users className="h-5 w-5" />}
          />
          <StatsCard
            title={t('dashboard.pending_sessions')}
            value={stats?.pendingSessions || 0}
            description={`${stats?.completedSessions || 0} ${t('dashboard.completed_sessions').toLowerCase()}`}
            icon={<Clock className="h-5 w-5" />}
          />
        </div>
      )}

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecentActivity />
          
          <div className="bg-white p-6 rounded-lg border border-neutral-200">
            <h3 className="text-lg font-medium mb-4">{t('dashboard.quick_actions', 'Quick Actions')}</h3>
            <div className="space-y-3">
              <a
                href="/tests"
                className="block p-3 border border-neutral-200 rounded-md hover:bg-neutral-50"
              >
                <div className="font-medium">{t('tests.create_test')}</div>
                <div className="text-sm text-neutral-500">
                  {t('dashboard.create_test_description', 'Add questions, set time limits, and more')}
                </div>
              </a>
              <a
                href="/candidates"
                className="block p-3 border border-neutral-200 rounded-md hover:bg-neutral-50"
              >
                <div className="font-medium">{t('dashboard.view_candidates', 'View candidates')}</div>
                <div className="text-sm text-neutral-500">
                  {t('dashboard.view_candidates_description', 'Review candidate progress and results')}
                </div>
              </a>
              <a
                href="/settings"
                className="block p-3 border border-neutral-200 rounded-md hover:bg-neutral-50"
              >
                <div className="font-medium">{t('dashboard.configure_settings', 'Configure settings')}</div>
                <div className="text-sm text-neutral-500">
                  {t('dashboard.configure_settings_description', 'Manage your account preferences')}
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
