import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/report.service';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/format';
import { BarChart2, Clock, CheckCircle, FileText, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OwnerReportsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['owner-report'],
    queryFn: () => reportService.getOwnerReport(),
  });

  if (isLoading) return <PageLoader />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Summary of your service history</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Tickets" value={String(data.totalTickets)} color="blue" />
        <StatCard icon={BarChart2} label="Open" value={String(data.openTickets)} color="yellow" />
        <StatCard icon={CheckCircle} label="Completed" value={String(data.completedTickets)} color="green" />
        <StatCard icon={DollarSign} label="Total Spend" value={formatCurrency(data.totalSpend)} color="purple" />
      </div>

      {/* Avg turnaround */}
      <div className="card p-6 flex items-center gap-4">
        <div className="h-12 w-12 bg-brand-100 rounded-xl flex items-center justify-center">
          <Clock className="h-6 w-6 text-brand-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Average Turnaround</p>
          <p className="text-2xl font-bold text-gray-900">{data.avgTurnaroundDays} days</p>
        </div>
      </div>

      {/* Recent completed */}
      {data.recentCompleted?.length > 0 && (
        <section className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Completed Jobs</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentCompleted.map((t: any) => (
              <div key={t._id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <Link
                    to={`/tickets/${t._id}`}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    {t.ticketNumber}
                  </Link>
                  <p className="text-xs text-gray-500">{t.issueTitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(t.quotedAmount ?? 0)}</p>
                  <p className="text-xs text-gray-500">{t.completedAt ? formatDate(t.completedAt) : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  green: 'bg-green-50 text-green-600',
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
