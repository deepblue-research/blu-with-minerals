import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { api, Invoice } from '../utils/api';
import { clsx } from 'clsx';

const InvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await api.get<Invoice>(`/invoices/${id}`);
        setInvoice(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load invoice details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.print();
    } else {
      window.print();
    }
  };

  const handleSendEmail = async () => {
    if (!id || !invoice) return;
    setIsSending(true);
    try {
      await api.post(`/invoices/${id}/send`);
      alert('Invoice sent successfully to ' + (invoice.client?.email || 'client'));
      // Refresh status
      const updated = await api.get<Invoice>(`/invoices/${id}`);
      setInvoice(updated);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send invoice');
    } finally {
      setIsSending(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 inline-block">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Error Loading Invoice</h2>
          <p className="text-red-600 mb-6">{error || 'Invoice not found'}</p>
          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 hover:underline"
          >
            <ArrowLeft size={16} /> Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Action Header - Hidden on print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl transition-all text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              {(() => {
                const styles = getStatusStyles(invoice.status);
                return (
                  <div className={clsx(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wide uppercase",
                    styles.bg, styles.text, styles.border
                  )}>
                    <span className={clsx("h-1.5 w-1.5 rounded-full", styles.dot)}></span>
                    {invoice.status}
                  </div>
                );
              })()}
            </div>
            <p className="text-xs text-gray-500">View and manage this invoice</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <Printer size={18} /> Print / Save PDF
          </button>
          <button
            onClick={handleSendEmail}
            disabled={isSending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Send to Client
          </button>
        </div>
      </div>

      {/* Invoice HTML Preview via Iframe */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden max-w-4xl mx-auto print:shadow-none print:border-none print:m-0">
        <iframe
          ref={iframeRef}
          src={`/api/invoices/${id}/html`}
          className="w-full h-[1200px] border-none"
          title="Invoice Preview"
        />
      </div>

      {/* Styles for print */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:m-0 { margin: 0 !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default InvoiceDetails;
