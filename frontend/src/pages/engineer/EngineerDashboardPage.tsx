import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { List, Briefcase, CheckCircle, Clock, MapPin, BarChart2, ArrowRight } from 'lucide-react';
import { reportService } from '../../services/report.service';
import { ticketService } from '../../services/ticket.service';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuthStore } from '../../store/authStore';

export const EngineerDashboardPage = () => {
  const user = useAuthStore((s) => s.user);

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['engineer-report'],
    queryFn: () => reportService.getEngineerReport(),
  });

  const { data: queue, isLoading: queueLoading } = useQuery({
    queryKey: ['engineer-queue-count'],
    queryFn: () => ticketService.getQueue({ limit: '5' }),
  });

  const { data: myJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['my-assigned-active'],
    queryFn: () => ticketService.getMyAssigned({ limit: '5' }),
  });

  if (reportLoading || queueLoading || jobsLoading) return <PageLoader />;

  const available = queue?.pagination?.total ?? 0;
  const activeJobs = (myJobs?.data ?? []).filter((t) => t.status !== 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here's your work overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={List} label="Jobs Available" value={String(available)} color="cyan" />
        <StatCard icon={Briefcase} label="Assigned to Me" value={String(report?.assignedTickets ?? 0)} color="blue" />
        <StatCard icon={CheckCircle} label="Completed" value={String(report?.completedTickets ?? 0)} color="green" />
        <StatCard icon={MapPin} label="Site Visits" value={String(report?.visitCount ?? 0)} color="purple" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/queue" className="card p-5 hover:shadow-md transition-shadow flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <List className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Job Queue</p>
              <p className="text-xs text-gray-500">{available} job(s) available to claim</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-brand-600" />
        </Link>

        <Link to="/my-jobs" className="card p-5 hover:shadow-md transition-shadow flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">My Jobs</p>
              <p className="text-xs text-gray-500">{activeJobs.length} active job(s)</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-brand-600" />
        </Link>
      </div>

      {/* Active jobs list */}
      <section className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Active Jobs</h2>
          <Link to="/my-jobs" className="text-sm text-brand-600 hover:text-brand-700">View all</Link>
        </div>
        {activeJobs.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-2" strokeWidth={1} />
            <p className="text-sm text-gray-500">No active jobs yet.</p>
            <Link to="/queue" className="btn-primary inline-flex mt-4">Browse Job Queue</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activeJobs.map((t) => (
              <Link
                key={t._id}
                to={`/my-jobs/${t._id}`}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-600">{t.ticketNumber}</p>
                  <p className="text-xs text-gray-500 truncate">{t.issueTitle}</p>
                  <p className="text-xs text-gray-400">{t.companyName}</p>
                </div>
                <StatusBadge
                  status={t.engineerStatus ?? t.status}
                  type={t.engineerStatus ? 'engineer' : 'ticket'}
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Link to full reports */}
      <Link to="/reports" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow group">
        <div className="h-10 w-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
          <BarChart2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">View Full Reports</p>
          <p className="text-xs text-gray-500">Your performance summary and completed jobs</p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-brand-600" />
      </Link>
    </div>
  );
};

interface StatCardProps { icon: React.ElementType; label: string; value: string; color: string }
const colorMap: Record<string, string> = {
  cyan: 'bg-cyan-50 text-cyan-600',
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
