import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { reportService } from '../../services/report.service';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatStatus } from '../../utils/format';
import { ClipboardList, Clock, CheckCircle, AlertCircle, DollarSign, Users } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export const AdminReportsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-report'],
    queryFn: () => reportService.getAdminReport(),
  });

  if (isLoading) return <PageLoader />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide service overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Tickets" value={String(data.totalTickets)} color="blue" />
        <StatCard icon={Clock} label="Pending Review" value={String(data.pendingReview)} color="yellow" />
        <StatCard icon={AlertCircle} label="Pending Payment" value={String(data.pendingPayment)} color="red" />
        <StatCard icon={CheckCircle} label="Unassigned (Approved)" value={String(data.approvedUnassigned)} color="orange" />
      </div>

      <div className="card p-6 flex items-center gap-4">
        <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
          <DollarSign className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Revenue (Advances Collected)</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalRevenue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status distribution */}
        {data.statusDistribution?.length > 0 && (
          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Ticket Status Distribution</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.statusDistribution.map((d: any) => ({ ...d, name: formatStatus(d.status) }))}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.statusDistribution.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Engineer utilization */}
        {data.engineerUtilization?.length > 0 && (
          <section className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Engineer Utilization (Completed Jobs)</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.engineerUtilization} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="engineerName" type="category" tick={{ fontSize: 12 }} width={120} />
                <Tooltip />
                <Bar dataKey="completed" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}
      </div>

      {/* Completion trend */}
      {data.completionTrend?.length > 0 && (
        <section className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Completion Trend (Last 12 Weeks)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.completionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  );
};

interface StatCardProps { icon: React.ElementType; label: string; value: string; color: string }
const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600', yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600', orange: 'bg-orange-50 text-orange-600', green: 'bg-green-50 text-green-600',
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
