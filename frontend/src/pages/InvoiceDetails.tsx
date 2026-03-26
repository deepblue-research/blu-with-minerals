import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Send,
  AlertCircle,
  FileText,
  Download,
  MoreVertical,
  CheckCircle,
  Edit2
} from 'lucide-react';
import {
  Button,
  Card,
  Chip,
  Spinner,
  Alert,
  Tooltip,
  Dropdown,
  Separator
} from '@heroui/react';
import { api, Invoice } from '../utils/api';

/**
 * Invoice Details page using HeroUI v3 BETA.
 * Provides a full-screen preview of the generated invoice PDF/HTML
 * and actions to send or print.
 */
const InvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.focus();
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
      // Refresh status to SENT
      const updated = await api.get<Invoice>(`/invoices/${id}`);
      setInvoice(updated);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send invoice');
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!id || !invoice) return;
    if (!window.confirm('Mark this invoice as paid?')) return;
    try {
      await api.patch(`/invoices/${id}/status`, { status: 'PAID' });
      const updated = await api.get<Invoice>(`/invoices/${id}`);
      setInvoice(updated);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string): "success" | "accent" | "default" | "danger" | "warning" => {
    switch (status) {
      case 'PAID': return 'success';
      case 'SENT': return 'accent';
      case 'DRAFT': return 'default';
      case 'OVERDUE': return 'danger';
      case 'VOID': return 'warning';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Spinner size="lg" color="accent" />
        <p className="text-muted font-bold text-xs uppercase tracking-widest">Loading invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Error Loading Invoice</Alert.Title>
            <Alert.Description>{error || 'The requested invoice could not be found.'}</Alert.Description>
          </Alert.Content>
        </Alert>
        <div className="mt-6 flex justify-center">
           <Button variant="tertiary" onPress={() => navigate('/invoices')}>
             <ArrowLeft size={16} className="mr-2" />
             Back to Invoices
           </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header - Hidden on print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="tertiary"
            onPress={() => navigate('/invoices')}
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
              <Chip
                color={getStatusColor(invoice.status)}
                variant="soft"
                size="sm"
              >
                <Chip.Label>{invoice.status}</Chip.Label>
              </Chip>
            </div>
            <p className="text-xs text-muted flex items-center gap-1">
              <FileText size={12} /> View and manage client billing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {invoice.status === 'DRAFT' && (
            <Button
              variant="tertiary"
              onPress={() => navigate(`/invoices/${id}/edit`)}
            >
              <Edit2 size={18} className="mr-2" />
              Edit Draft
            </Button>
          )}

          <Button
            variant="primary"
            isPending={isSending}
            onPress={handleSendEmail}
          >
            <Send size={18} className="mr-2" />
            Send Email
          </Button>

          <Dropdown>
            <Button
              variant="tertiary"
              isIconOnly
              aria-label="More Actions"
            >
              <MoreVertical size={18} />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu
                aria-label="Invoice actions"
                onAction={(key: any) => {
                  if (key === 'print') handlePrint();
                  if (key === 'mark-paid') handleMarkAsPaid();
                }}
              >
                <Dropdown.Item id="print" textValue="Print / Download">
                  <div className="flex items-center gap-2">
                    <Printer size={16} />
                    <span>Print / Download</span>
                  </div>
                </Dropdown.Item>
                {invoice.status !== 'PAID' && (
                  <Dropdown.Item id="mark-paid" textValue="Mark as Paid">
                    <div className="flex items-center gap-2 text-success font-medium">
                      <CheckCircle size={16} />
                      <span>Mark as Paid</span>
                    </div>
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      {/* Invoice HTML Preview via Iframe */}
      <Card className="max-w-5xl mx-auto print:shadow-none print:border-none print:m-0">
        <Card.Content className="p-0">
          <iframe
            ref={iframeRef}
            src={`/api/invoices/${id}/html?token=${localStorage.getItem('auth_token')}`}
            className="w-full h-300 border-none bg-white"
            title="Invoice Preview"
          />
        </Card.Content>
      </Card>

      {/* Styles for print */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          .max-w-5xl { max-width: 100% !important; }
          main { padding: 0 !important; }
          header, aside, nav { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default InvoiceDetails;
