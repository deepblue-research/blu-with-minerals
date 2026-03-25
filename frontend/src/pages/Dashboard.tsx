import React, { useEffect, useState } from 'react';
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, DashboardStats, RecentInvoice } from '../utils/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [stats, invoices] = await Promise.all([
          api.get<DashboardStats>('/dashboard/stats'),
          api.get<RecentInvoice[]>('/dashboard/recent-invoices')
        ]);
        setStatsData(stats);
        setRecentInvoices(invoices);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const stats = statsData ? [
    { label: 'Total Sent', value: formatCurrency(statsData.totalSent, statsData.currency), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', trend: statsData.totalSentTrend },
    { label: 'Paid this Month', value: formatCurrency(statsData.paidThisMonth, statsData.currency), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', trend: statsData.paidTrend },
    { label: 'Outstanding', value: formatCurrency(statsData.outstanding, statsData.currency), icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', trend: statsData.outstandingTrend },
    { label: 'Active Clients', value: statsData.activeClients.toString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: statsData.clientsTrend },
  ] : [];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
      case 'SENT': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Upcoming Tasks Banner */}
      {statsData && statsData.upcomingRecurring > 0 && (
        <div className="bg-blue-600 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg shadow-blue-200">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="font-bold text-sm">Action Required</p>
              <p className="text-blue-50 text-xs">You have {statsData.upcomingRecurring} recurring {statsData.upcomingRecurring === 1 ? 'invoice' : 'invoices'} scheduled to be generated this week.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/recurring')}
            className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors"
          >
            Review Schedules
          </button>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Here is what's happening with your invoices today.</p>
        </div>
        <button
          onClick={() => navigate('/invoices/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <FileText size={18} />
          Create New Invoice
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center text-xs font-bold ${
                (stat.trend || 0) > 0 ? 'text-green-500' : (stat.trend || 0) < 0 ? 'text-red-500' : 'text-gray-400'
              }`}>
                {(stat.trend || 0) >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                {stat.trend !== undefined ? `${stat.trend > 0 ? '+' : ''}${stat.trend}%` : 'Stable'}
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent Invoices</h2>
          <button
            onClick={() => navigate('/invoices')}
            className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
          >
            View All <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">{invoice.number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{invoice.client}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(invoice.amount, invoice.currency)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentInvoices.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-500 font-medium">No invoices found. Create your first invoice to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
