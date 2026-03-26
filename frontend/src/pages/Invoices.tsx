import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  Send,
  Eye,
  Trash2,
  CheckCircle,
  Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  InputGroup,
  Chip,
  Tabs,
  Card,
  Dropdown,
  Spinner,
  Alert,
  Tooltip
} from '@heroui/react';
import { api, Invoice } from '../utils/api';
import { formatDateDDMMYYYY } from '../utils/date';

/**
 * Invoices management page using HeroUI v3 BETA components.
 * Lists all invoices with filtering, searching, and quick actions.
 */
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
      fetchInvoices(); // Refresh to update status to SENT
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send invoice');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
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

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted">Manage, track, and send invoices to your clients.</p>
        </div>
        <Button
          variant="primary"
          onPress={() => navigate('/invoices/new')}
        >
          <Plus size={20} className="mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="w-full lg:w-auto overflow-x-auto">
          <Tabs
            selectedKey={activeStatus}
            onSelectionChange={(key: any) => setActiveStatus(key as string)}
            variant="secondary"
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Invoice status filters">
                {statuses.map((status) => (
                  <Tabs.Tab key={status} id={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
        <div className="flex-1 w-full lg:ml-auto lg:max-w-2xl flex flex-col sm:flex-row items-center gap-3">
          <InputGroup className="flex-1">
            <InputGroup.Prefix>
              <Search size={20} />
            </InputGroup.Prefix>
            <InputGroup.Input
              placeholder="Search by number or client..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert status="danger" className="shadow-sm">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Error Loading Invoices</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {/* Table Section */}
      <Card>
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Invoices list">
              <Table.Header>
                <Table.Column isRowHeader>INVOICE</Table.Column>
                <Table.Column>CLIENT</Table.Column>
                <Table.Column>DATE</Table.Column>
                <Table.Column className="text-right">AMOUNT</Table.Column>
                <Table.Column className="text-center">STATUS</Table.Column>
                <Table.Column className="text-right">ACTIONS</Table.Column>
              </Table.Header>
              <Table.Body>
                {filteredInvoices.map((invoice: any) => (
                  <Table.Row key={invoice.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-muted" />
                        <span className="font-bold">{invoice.invoiceNumber}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {invoice.client?.name || 'N/A'}
                    </Table.Cell>
                    <Table.Cell>
                      {formatDateDDMMYYYY(invoice.issueDate)}
                    </Table.Cell>
                    <Table.Cell className="text-right font-bold">
                      {formatCurrency(invoice.totalAmount, invoice.currency)}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Chip
                        size="sm"
                        variant="soft"
                        color={getStatusColor(invoice.status)}
                      >
                        <Chip.Label>{invoice.status}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <Button
                            isIconOnly
                            variant="tertiary"
                            size="sm"
                            onPress={() => navigate(`/invoices/${invoice.id}`)}
                            aria-label="View Details"
                          >
                            <Eye size={18} />
                          </Button>
                          <Tooltip.Content>View Details</Tooltip.Content>
                        </Tooltip>

                        <Tooltip>
                          <Button
                            isIconOnly
                            variant="tertiary"
                            size="sm"
                            onPress={() => handleSendEmail(invoice.id)}
                            aria-label="Send via Email"
                          >
                            <Send size={18} />
                          </Button>
                          <Tooltip.Content>Send via Email</Tooltip.Content>
                        </Tooltip>

                        {invoice.status === 'SENT' && (
                          <Tooltip>
                            <Button
                              isIconOnly
                              variant="tertiary"
                              size="sm"
                              onPress={() => handleMarkAsPaid(invoice.id)}
                              aria-label="Mark as Paid"
                            >
                              <CheckCircle size={18} className="text-success" />
                            </Button>
                            <Tooltip.Content>Mark as Paid</Tooltip.Content>
                          </Tooltip>
                        )}

                        {invoice.status === 'DRAFT' && (
                          <>
                            <Tooltip>
                              <Button
                                isIconOnly
                                variant="tertiary"
                                size="sm"
                                onPress={() => navigate(`/invoices/${invoice.id}/edit`)}
                                aria-label="Edit Draft"
                              >
                                <Edit2 size={18} />
                              </Button>
                              <Tooltip.Content>Edit Draft</Tooltip.Content>
                            </Tooltip>
                            <Tooltip>
                              <Button
                                isIconOnly
                                variant="danger"
                                size="sm"
                                onPress={() => handleDelete(invoice.id)}
                                aria-label="Delete Draft"
                              >
                                <Trash2 size={18} />
                              </Button>
                              <Tooltip.Content>Delete Draft</Tooltip.Content>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

        {/* Empty States */}
        {!isLoading && filteredInvoices.length === 0 && (
          <div className="p-12 text-center text-muted">
            No invoices found matching your criteria.
          </div>
        )}
        {isLoading && (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <Spinner color="accent" />
            <p className="text-muted text-xs uppercase tracking-widest">Loading invoices...</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Invoices;
