import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/report.service';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/format';
import { Briefcase, CheckCircle, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const EngineerReportsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['engineer-report'],
    queryFn: () => reportService.getEngineerReport(),
  });

  if (isLoading) return <PageLoader />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Your performance summary</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Assigned" value={String(data.assignedTickets)} color="blue" />
        <StatCard icon={CheckCircle} label="Completed" value={String(data.completedTickets)} color="green" />
        <StatCard icon={Clock} label="Avg Days" value={String(data.avgCompletionDays)} color="yellow" />
        <StatCard icon={MapPin} label="Site Visits" value={String(data.visitCount)} color="purple" />
      </div>

      {data.recentCompleted?.length > 0 && (
        <section className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Completed Jobs</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentCompleted.map((t: any) => (
              <div key={t._id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    to={`/my-jobs/${t._id}`}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    {t.ticketNumber}
                  </Link>
                  <p className="text-xs text-gray-500 truncate">{t.issueTitle}</p>
                  <p className="text-xs text-gray-400">{t.companyName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <StatusBadge status={t.priority} type="priority" />
                  <p className="text-xs text-gray-500 mt-1">
                    {t.completedAt ? formatDate(t.completedAt) : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

interface StatCardProps { icon: React.ElementType; label: string; value: string; color: string }
const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  purple: 'bg-purple-50 text-purple-600',
};
const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => (
  <div className="card p-5">
    <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-0.5">{label}</p>
  </div>
);
