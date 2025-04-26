import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Users, CheckCircle, Clock } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentActivity from "@/components/dashboard/RecentActivity";

interface DashboardStats {
  totalTests: number;
  activeTests: number;
  totalCandidates: number;
  pendingSessions: number;
  completedSessions: number;
}

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neutral-800 mb-6">Dashboard</h1>

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
            title="Total Tests"
            value={stats?.totalTests || 0}
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <StatsCard
            title="Active Tests"
            value={stats?.activeTests || 0}
            description={`${Math.round(
              ((stats?.activeTests || 0) / (stats?.totalTests || 1)) * 100
            )}% of total tests`}
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <StatsCard
            title="Candidates"
            value={stats?.totalCandidates || 0}
            icon={<Users className="h-5 w-5" />}
          />
          <StatsCard
            title="Pending Sessions"
            value={stats?.pendingSessions || 0}
            description={`${stats?.completedSessions || 0} completed`}
            icon={<Clock className="h-5 w-5" />}
          />
        </div>
      )}

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">
          Activity Overview
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecentActivity />
          
          <div className="bg-white p-6 rounded-lg border border-neutral-200">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/tests"
                className="block p-3 border border-neutral-200 rounded-md hover:bg-neutral-50"
              >
                <div className="font-medium">Create a new test</div>
                <div className="text-sm text-neutral-500">
                  Add questions, set time limits, and more
                </div>
              </a>
              <a
                href="/candidates"
                className="block p-3 border border-neutral-200 rounded-md hover:bg-neutral-50"
              >
                <div className="font-medium">View candidates</div>
                <div className="text-sm text-neutral-500">
                  Review candidate progress and results
                </div>
              </a>
              <a
                href="/settings"
                className="block p-3 border border-neutral-200 rounded-md hover:bg-neutral-50"
              >
                <div className="font-medium">Configure settings</div>
                <div className="text-sm text-neutral-500">
                  Manage your account preferences
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
