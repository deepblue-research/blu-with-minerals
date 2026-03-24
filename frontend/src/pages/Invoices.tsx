import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Send,
  Eye,
  Trash2,
  CheckCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import { api, Invoice } from '../utils/api';
import { formatDateDDMMYYYY } from '../utils/date';

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (activeStatus !== 'ALL') params.status = activeStatus;

      const data = await api.get<Invoice[]>('/invoices', { params });
      setInvoices(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleSendEmail = async (id: string) => {
    try {
      await api.post(`/invoices/${id}/send`);
      alert('Invoice sent successfully!');
      fetchInvoices(); // Refresh to update status to SENT
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send invoice');
    }
  };

  const handlePreviewPdf = async (id: string) => {
    try {
      const data = await api.get<{ pdfUrl: string }>(`/invoices/${id}/pdf`);
      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate PDF');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      setInvoices(invoices.filter(inv => inv.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete invoice');
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (!window.confirm('Mark this invoice as paid?')) return;
    try {
      await api.patch(`/invoices/${id}/status`, { status: 'PAID' });
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update invoice status');
    }
  };

  const statuses = ['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'];

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    try {
      return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(amount || 0);
    } catch (e) {
      return `${currency || '$'} ${(amount || 0).toFixed(2)}`;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'PAID':
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100', dot: 'bg-green-500' };
      case 'SENT':
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500' };
      case 'DRAFT':
        return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', dot: 'bg-gray-400' };
      case 'OVERDUE':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-500' };
      case 'VOID':
        return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', dot: 'bg-orange-500' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', dot: 'bg-gray-400' };
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Invoices</h1>
          <p className="text-gray-500 mt-1">Create, track, and manage your client billing history.</p>
        </div>
        <Link
          to="/invoices/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-200" />
          Create Invoice
        </Link>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-1 flex-1">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                activeStatus === status
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="relative flex-[0.8]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by invoice number or client..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Invoice Table Container */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-medium">Loading your invoices...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Invoice</th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInvoices.map((invoice) => {
                  const styles = getStatusStyles(invoice.status);
                  return (
                    <tr key={invoice.id} className="group hover:bg-blue-50/20 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-white group-hover:text-blue-500 transition-colors">
                            <FileText size={18} />
                          </div>
                          <span className="text-sm font-bold text-gray-900">{invoice.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-gray-700">{invoice.client?.name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-gray-600">{formatDateDDMMYYYY(invoice.issueDate)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-extrabold text-gray-900">
                          {formatCurrency(invoice.totalAmount, invoice.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className={clsx(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wide uppercase",
                          styles.bg, styles.text, styles.border
                        )}>
                          <span className={clsx("h-1.5 w-1.5 rounded-full", styles.dot)}></span>
                          {invoice.status}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/invoices/${invoice.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Invoice"
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => handleSendEmail(invoice.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Send Email"
                          >
                            <Send size={18} />
                          </button>
                          {invoice.status === 'DRAFT' && (
                            <button
                              onClick={() => handleDelete(invoice.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Draft"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                          {invoice.status === 'SENT' && (
                            <button
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredInvoices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-200">
              <FileText className="text-gray-300" size={40} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No invoices found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              Try a different search term or create your first invoice.
            </p>
            <Link
              to="/invoices/new"
              className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4"
            >
              Create your first invoice
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
