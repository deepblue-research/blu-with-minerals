import React from 'react';
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // Mock data for initial UI layout
  const stats = [
    { label: 'Total Sent', value: '$12,450.00', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Paid this Month', value: '$4,200.00', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Outstanding', value: '$1,850.00', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Active Clients', value: '12', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const recentInvoices = [
    { id: '1', number: 'INV-2023-001', client: 'Acme Corp', amount: '$1,200.00', date: '20-11-2023', status: 'PAID' },
    { id: '2', number: 'INV-2023-002', client: 'Global Tech', amount: '$850.00', date: '25-11-2023', status: 'SENT' },
    { id: '3', number: 'INV-2023-003', client: 'Nexus Solutions', amount: '$2,400.00', date: '01-12-2023', status: 'DRAFT' },
    { id: '4', number: 'INV-2023-004', client: 'Starlight Inc', amount: '$450.00', date: '05-12-2023', status: 'OVERDUE' },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
      case 'SENT': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
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
              <div className="flex items-center text-green-500 text-xs font-bold">
                <TrendingUp size={14} className="mr-1" />
                +4.5%
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
          <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1">
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
                    <span className="text-sm font-bold text-gray-900">{invoice.amount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{invoice.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
