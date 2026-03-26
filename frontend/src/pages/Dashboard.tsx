import React, { useEffect, useState } from 'react';
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Table,
  Chip,
  Alert,
  Tooltip,
  Spinner
} from '@heroui/react';
import { api, DashboardStats, RecentInvoice } from '../utils/api';

/**
 * Dashboard page using HeroUI v3 BETA components.
 * Displays financial statistics and recent invoices.
 */
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
      } catch (error: any) {
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
    { label: 'Total Sent', value: formatCurrency(statsData.totalSent, statsData.currency), icon: FileText, color: 'accent' as const, trend: statsData.totalSentTrend },
    { label: 'Paid this Month', value: formatCurrency(statsData.paidThisMonth, statsData.currency), icon: CheckCircle, color: 'success' as const, trend: statsData.paidTrend },
    { label: 'Outstanding', value: formatCurrency(statsData.outstanding, statsData.currency), icon: Clock, color: 'warning' as const, trend: statsData.outstandingTrend },
    { label: 'Active Clients', value: statsData.activeClients.toString(), icon: Users, color: 'default' as const, trend: statsData.clientsTrend },
  ] : [];

  const getStatusColor = (status: string): "success" | "accent" | "default" | "danger" | "warning" => {
    switch (status) {
      case 'PAID': return 'success';
      case 'SENT': return 'accent';
      case 'DRAFT': return 'default';
      case 'OVERDUE': return 'danger';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Spinner size="lg" color="accent" />
        <p className="text-muted font-bold text-xs uppercase tracking-widest">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming Tasks Alert */}
      {statsData && statsData.upcomingRecurring > 0 && (
        <Alert status="accent">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Action Required</Alert.Title>
            <Alert.Description>
              You have {statsData.upcomingRecurring} recurring {statsData.upcomingRecurring === 1 ? 'invoice' : 'invoices'} scheduled to be generated this week.
            </Alert.Description>
          </Alert.Content>
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => navigate('/recurring')}
          >
            Review Schedules
          </Button>
        </Alert>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted">Manage your financial overview and recent activity.</p>
        </div>
        <Button
          variant="primary"
          onPress={() => navigate('/invoices/new')}
        >
          <Plus size={20} className="mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat: any, idx: number) => (
          <Card key={idx}>
            <Card.Content>
              <div className="flex items-center justify-between mb-4">
                <div className="text-foreground">
                  <stat.icon size={22} />
                </div>
                <div className={`flex items-center text-xs ${
                  (stat.trend || 0) > 0 ? 'text-success' : (stat.trend || 0) < 0 ? 'text-danger' : 'text-muted'
                }`}>
                  {(stat.trend || 0) >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                  {stat.trend !== undefined ? `${stat.trend > 0 ? '+' : ''}${stat.trend}%` : 'Stable'}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Recent Invoices Table */}
      <Card>
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-lg font-bold">Recent Invoices</h2>
          <Button
            variant="primary"
            size="sm"
            onPress={() => navigate('/invoices')}
          >
            View All
            <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>

        <Table aria-label="Recent invoices table">
          <Table.ScrollContainer>
            <Table.Content aria-label="Recent invoices list">
              <Table.Header>
                <Table.Column isRowHeader>INVOICE</Table.Column>
                <Table.Column>CLIENT</Table.Column>
                <Table.Column className="text-right">AMOUNT</Table.Column>
                <Table.Column>DATE</Table.Column>
                <Table.Column className="text-center">STATUS</Table.Column>
                <Table.Column className="text-right">ACTION</Table.Column>
              </Table.Header>
              <Table.Body>
                {recentInvoices.map((invoice: any) => (
                  <Table.Row key={invoice.id}>
                    <Table.Cell>
                      <span className="font-bold">{invoice.number}</span>
                    </Table.Cell>
                    <Table.Cell>
                      {invoice.client}
                    </Table.Cell>
                    <Table.Cell className="text-right font-bold">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-muted">{new Date(invoice.date).toLocaleDateString()}</span>
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
                            size="sm"
                            variant="tertiary"
                            onPress={() => navigate(`/invoices/${invoice.id}`)}
                            aria-label="View Details"
                          >
                            <Eye size={18} />
                          </Button>
                          <Tooltip.Content>View Details</Tooltip.Content>
                        </Tooltip>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
        {recentInvoices.length === 0 && (
          <div className="p-12 text-center text-muted">
            No recent invoices found.
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
