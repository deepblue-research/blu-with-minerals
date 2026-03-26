import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit2,
  RefreshCw,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Hash,
  Trash
} from 'lucide-react';
import {
  Button,
  Input,
  InputGroup,
  Card,
  Table,
  Tooltip,
  Chip,
  Modal,
  ListBox,
  Label,
  Select,
  Switch,
  Spinner,
  Alert,
  Separator,
  Dropdown
} from '@heroui/react';
import { api, Client } from '../utils/api';
import { formatDateDDMMYYYY } from '../utils/date';

interface RecurringSchedule {
  id: string;
  clientId: string;
  client?: { name: string; email: string };
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  nextRunDate: string;
  lastRunDate?: string;
  isActive: boolean;
  taxRate: number;
  dueDays: number;
  currency: string;
  templateItems: any[];
}

/**
 * Recurring Schedules management page using HeroUI v3 BETA.
 * Automates the generation and delivery of periodic invoices.
 */
const RecurringSchedules: React.FC = () => {
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<RecurringSchedule | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    frequency: 'MONTHLY',
    nextRunDate: new Date().toISOString().split('T')[0],
    taxRate: 0,
    dueDays: 7,
    currency: 'INR',
    templateItems: [{ description: '', quantity: 1, unitPrice: 0 }]
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [schedulesData, clientsData] = await Promise.all([
        api.get<RecurringSchedule[]>('/recurring'),
        api.get<Client[]>('/clients')
      ]);
      setSchedules(schedulesData);
      setClients(clientsData);
    } catch (err: any) {
      setError('Failed to load data. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/recurring/${id}`, { isActive: !currentStatus });
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s));
    } catch (err: any) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recurring schedule?')) return;
    try {
      await api.delete(`/recurring/${id}`);
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert('Failed to delete schedule');
    }
  };

  const handleEdit = (schedule: RecurringSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      clientId: schedule.clientId,
      frequency: schedule.frequency,
      nextRunDate: new Date(schedule.nextRunDate).toISOString().split('T')[0],
      taxRate: schedule.taxRate,
      dueDays: schedule.dueDays,
      currency: schedule.currency,
      templateItems: schedule.templateItems.length > 0
        ? schedule.templateItems.map(item => ({ ...item }))
        : [{ description: '', quantity: 1, unitPrice: 0 }]
    });
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      templateItems: [...formData.templateItems, { description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.templateItems.length > 1) {
      const newItems = formData.templateItems.filter((_, i) => i !== index);
      setFormData({ ...formData, templateItems: newItems });
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.templateItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, templateItems: newItems });
  };

  const handleSubmit = async () => {
    if (!formData.clientId) {
      setError('Please select a client');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        nextRunDate: new Date(formData.nextRunDate).toISOString()
      };
      if (editingSchedule) {
        await api.patch(`/recurring/${editingSchedule.id}`, payload);
      } else {
        await api.post('/recurring', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, curr: string = 'INR') => {
    return new Intl.NumberFormat(curr === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: curr,
    }).format(amount);
  };

  const calculateTotal = (items: any[], taxRate: number) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return subtotal + (subtotal * taxRate / 100);
  };

  const filteredSchedules = schedules.filter(s =>
    (s.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.client?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Recurring Invoices</h1>
          <p className="text-muted">Automate your billing with scheduled invoice generation.</p>
        </div>
        <Button
          variant="primary"
          onPress={() => {
            setEditingSchedule(null);
            setFormData({
              clientId: '',
              frequency: 'MONTHLY',
              nextRunDate: new Date().toISOString().split('T')[0],
              taxRate: 0,
              dueDays: 7,
              currency: 'USD',
              templateItems: [{ description: '', quantity: 1, unitPrice: 0 }]
            });
            setIsModalOpen(true);
          }}
        >
          <Plus size={20} className="mr-2" />
          New Schedule
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="flex-1 w-full lg:ml-auto lg:max-w-2xl flex flex-col sm:flex-row items-center gap-3">
          <InputGroup className="flex-1">
            <InputGroup.Prefix>
              <Search size={20} />
            </InputGroup.Prefix>
            <InputGroup.Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      {/* Error Alert */}
      {error && !isModalOpen && (
        <Alert status="danger" className="shadow-sm">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Schedules list">
              <Table.Header>
                <Table.Column isRowHeader>CLIENT</Table.Column>
                <Table.Column>FREQUENCY</Table.Column>
                <Table.Column>NEXT RUN</Table.Column>
                <Table.Column className="text-right">TOTAL ESTIMATE</Table.Column>
                <Table.Column className="text-center">STATUS</Table.Column>
                <Table.Column className="text-right">ACTIONS</Table.Column>
              </Table.Header>
              <Table.Body>
                {filteredSchedules.map((schedule) => (
                  <Table.Row key={schedule.id}>
                    <Table.Cell>
                      <div className="flex flex-col">
                        <span className="font-bold">{schedule.client?.name}</span>
                        <span className="text-xs text-muted">{schedule.client?.email}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Chip size="sm" variant="soft" color="accent">
                        <Chip.Label>{schedule.frequency}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell>
                      {formatDateDDMMYYYY(schedule.nextRunDate)}
                    </Table.Cell>
                    <Table.Cell className="text-right font-bold">
                      {formatCurrency(calculateTotal(schedule.templateItems, schedule.taxRate), schedule.currency)}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Switch
                        size="sm"
                        aria-label="Toggle schedule status"
                        isSelected={schedule.isActive}
                        onChange={(isSelected: boolean) => toggleStatus(schedule.id, isSelected)}
                      >
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <Button
                            isIconOnly
                            variant="tertiary"
                            size="sm"
                            onPress={() => handleEdit(schedule)}
                            aria-label="Edit Schedule"
                          >
                            <Edit2 size={18} />
                          </Button>
                          <Tooltip.Content>Edit Schedule</Tooltip.Content>
                        </Tooltip>
                        <Tooltip>
                          <Button
                            isIconOnly
                            variant="danger"
                            size="sm"
                            onPress={() => handleDelete(schedule.id)}
                            aria-label="Delete Schedule"
                          >
                            <Trash2 size={18} />
                          </Button>
                          <Tooltip.Content>Delete Schedule</Tooltip.Content>
                        </Tooltip>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
        {!isLoading && filteredSchedules.length === 0 && (
          <div className="p-12 text-center text-muted">
            No recurring schedules found.
          </div>
        )}
        {isLoading && (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <Spinner color="accent" />
            <p className="text-muted text-xs uppercase tracking-widest">Loading schedules...</p>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal>
        <Modal.Backdrop isOpen={isModalOpen} onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false);
            setEditingSchedule(null);
            setError(null);
          }
        }}>
          <Modal.Container size="lg">
            <Modal.Dialog className="bg-surface border border-separator shadow-2xl">
              <Modal.CloseTrigger />
              <Modal.Header className="flex items-center gap-3">
                <div className="text-accent">
                  <RefreshCw size={20} />
                </div>
                <Modal.Heading className="text-xl font-bold">{editingSchedule ? 'Edit Schedule' : 'New Recurring Schedule'}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-8">
                {error && (
                  <Alert status="danger" className="text-xs">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>{error}</Alert.Title>
                    </Alert.Content>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    className="w-full"
                    placeholder="Choose a client"
                    value={formData.clientId}
                    onChange={(key: any) => setFormData({ ...formData, clientId: key as string })}
                  >
                    <Label className="text-xs uppercase mb-2 block">Select Client</Label>
                    <Select.Trigger>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-muted" />
                        <Select.Value />
                      </div>
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {clients.map((c) => (
                          <ListBox.Item key={c.id} id={c.id} textValue={c.name}>{c.name}</ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <Select
                    className="w-full"
                    value={formData.frequency}
                    onChange={(key: any) => setFormData({ ...formData, frequency: key as any })}
                  >
                    <Label className="text-xs uppercase mb-2 block">Billing Frequency</Label>
                    <Select.Trigger>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-muted" />
                        <Select.Value />
                      </div>
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="WEEKLY" textValue="Weekly">Weekly</ListBox.Item>
                        <ListBox.Item id="MONTHLY" textValue="Monthly">Monthly</ListBox.Item>
                        <ListBox.Item id="QUARTERLY" textValue="Quarterly">Quarterly</ListBox.Item>
                        <ListBox.Item id="YEARLY" textValue="Yearly">Yearly</ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs uppercase mb-1 block">First/Next Run Date</Label>
                    <InputGroup>
                      <InputGroup.Prefix>
                        <Calendar size={16} className="text-muted" />
                      </InputGroup.Prefix>
                      <InputGroup.Input
                        type="date"
                        value={formData.nextRunDate}
                        onChange={(e) => setFormData({ ...formData, nextRunDate: e.target.value })}
                      />
                    </InputGroup>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs uppercase mb-1 block">Payment Due Days</Label>
                    <InputGroup>
                      <InputGroup.Prefix>
                        <Hash size={16} className="text-muted" />
                      </InputGroup.Prefix>
                      <InputGroup.Input
                        type="number"
                        value={formData.dueDays as any}
                        onChange={(e: any) => setFormData({ ...formData, dueDays: parseInt(e.target.value) || 0 })}
                      />
                    </InputGroup>
                  </div>
                </div>

                <Separator className="bg-separator/30" />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm uppercase tracking-wider text-muted">Invoice Template</h4>
                    <Button variant="primary" size="sm" onPress={handleAddItem}>
                      <Plus size={16} className="mr-1" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {formData.templateItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-12 md:col-span-6">
                          <Input
                            placeholder="Description"
                            value={item.description}
                            onChange={(e: any) => handleItemChange(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity as any}
                            onChange={(e: any) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="text-center"
                          />
                        </div>
                        <div className="col-span-4 md:col-span-3">
                          <InputGroup>
                            <InputGroup.Prefix>
                              <span className="text-xs text-muted">{formData.currency}</span>
                            </InputGroup.Prefix>
                            <InputGroup.Input
                              type="number"
                              placeholder="Price"
                              value={item.unitPrice as any}
                              onChange={(e: any) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="text-right"
                            />
                          </InputGroup>
                        </div>
                        <div className="col-span-4 md:col-span-1 flex justify-end">
                          <Button isIconOnly variant="tertiary" size="sm" onPress={() => handleRemoveItem(index)} isDisabled={formData.templateItems.length === 1}>
                            <Trash className="text-muted hover:text-danger" size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-bold">{formatCurrency(formData.templateItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0), formData.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">Tax Rate (%)</span>
                    <Input
                      type="number"
                      value={formData.taxRate as any}
                      onChange={(e: any) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                      className="w-20 text-right font-bold"
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total Estimate</span>
                    <span className="text-2xl font-bold text-accent">{formatCurrency(calculateTotal(formData.templateItems, formData.taxRate), formData.currency)}</span>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" isPending={isSubmitting} onPress={handleSubmit}>
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
};

export default RecurringSchedules;
