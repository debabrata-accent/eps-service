import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/report.service';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/format';
import { Briefcase, CheckCircle, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const EngineerReportsPage = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['engineer-report'],
    queryFn: () => reportService.getEngineerReport(),
  });

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <div className="card p-8 text-center">
          <p className="text-sm text-gray-600 mb-4">Couldn't load your report. Please try again.</p>
          <button onClick={() => refetch()} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  // Fall back to zeros so the page always renders, even with no data yet
  const report = data ?? {
    assignedTickets: 0, completedTickets: 0, avgCompletionDays: 0, visitCount: 0, recentCompleted: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Your performance summary</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Assigned" value={String(report.assignedTickets)} color="blue" />
        <StatCard icon={CheckCircle} label="Completed" value={String(report.completedTickets)} color="green" />
        <StatCard icon={Clock} label="Avg Days" value={String(report.avgCompletionDays)} color="yellow" />
        <StatCard icon={MapPin} label="Site Visits" value={String(report.visitCount)} color="purple" />
      </div>

      {report.recentCompleted?.length > 0 ? (
        <section className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Completed Jobs</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {report.recentCompleted.map((t: any) => (
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
      ) : (
        <section className="card p-10 text-center">
          <CheckCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" strokeWidth={1} />
          <p className="text-sm text-gray-500">No completed jobs yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Completed jobs will appear here once you finish them.
          </p>
          <Link to="/queue" className="btn-primary inline-flex mt-4">Browse Job Queue</Link>
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
