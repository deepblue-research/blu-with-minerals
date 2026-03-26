import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Send,
  FileText,
  User,
  Calendar,
  Hash,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Input,
  InputGroup,
  Select,
  ListBox,
  Label,
  TextArea,
  Card,
  Separator,
  Alert,
  Spinner,
  Tooltip
} from '@heroui/react';
import { api, Client } from '../utils/api';
import { formatDateDDMMYYYY } from '../utils/date';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Create Invoice page using HeroUI v3 BETA.
 * Allows users to configure client details, line items, and taxes.
 */
const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  // Component State
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Field State
  const [clientId, setClientId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('INR');

  // Line Items State
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);

  // Fetch initial data (clients list and next suggested invoice number or existing invoice)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingClients(true);
        const [clientsData] = await Promise.all([
          api.get<Client[]>('/clients')
        ]);
        setClients(clientsData);

        if (isEditing) {
          const invoice = await api.get<any>(`/invoices/${id}`);

          if (invoice.status !== 'DRAFT') {
            setError('Only draft invoices can be edited.');
            navigate('/invoices');
            return;
          }

          setClientId(invoice.clientId);
          setInvoiceNumber(invoice.invoiceNumber);
          setIssueDate(invoice.issueDate.split('T')[0]);
          setDueDate(invoice.dueDate?.split('T')[0] || '');
          setTaxRate(invoice.taxRate);
          setNotes(invoice.notes || '');
          setCurrency(invoice.currency || 'INR');

          if (invoice.items && invoice.items.length > 0) {
            setItems(invoice.items.map((item: any) => ({
              id: item.id || Math.random().toString(36).substr(2, 9),
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice
            })));
          }
        } else {
          const numberData = await api.get<{ nextNumber: string }>('/invoices/next-number');
          setInvoiceNumber(numberData.nextNumber);
        }
      } catch (err: any) {
        setError('Failed to load initial data. Please try again.');
      } finally {
        setIsLoadingClients(false);
      }
    };
    fetchData();
  }, [id, isEditing, navigate]);

  // Calculation Logic
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  const formatValue = (value: number) => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  // Line Item Handlers
  const addItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = Number(updatedItem.quantity) * Number(updatedItem.unitPrice);
        }
        return updatedItem;
      }
      return item;
    });
    setItems(newItems);
  };

  // Submission Logic
  const handleSaveInvoice = async (sendImmediately: boolean = false) => {
    if (!clientId) {
      setError('Please select a client');
      return;
    }
    if (!dueDate) {
      setError('Please set a due date');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const invoiceData = {
        clientId,
        invoiceNumber,
        issueDate,
        dueDate,
        taxRate,
        notes,
        currency,
        items: items.map(({ description, quantity, unitPrice }) => ({
          description,
          quantity,
          unitPrice
        }))
      };

      let currentInvoiceId = id;

      if (isEditing) {
        await api.patch(`/invoices/${id}`, invoiceData);
      } else {
        const createdInvoice: any = await api.post('/invoices', invoiceData);
        currentInvoiceId = createdInvoice.id;
      }

      if (sendImmediately && currentInvoiceId) {
        await api.post(`/invoices/${currentInvoiceId}/send`);
      }

      navigate('/invoices');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process invoice. Check your server connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="tertiary"
            onPress={() => navigate('/invoices')}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{isEditing ? 'Edit Invoice' : 'Create Invoice'}</h1>
            <p className="text-muted">
              {isEditing ? 'Modify your draft invoice details.' : 'Configure details and line items for your new invoice.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="tertiary"
            isPending={isSubmitting}
            onPress={() => handleSaveInvoice(false)}
          >
            <Save size={18} className="mr-2" />
            {isEditing ? 'Update Draft' : 'Save Draft'}
          </Button>
          <Button
            variant="primary"
            isPending={isSubmitting}
            onPress={() => handleSaveInvoice(true)}
          >
            <Send size={18} className="mr-2" />
            Send Invoice
          </Button>
        </div>
      </div>

      {/* Validation Error Alert */}
      {error && (
        <Alert status="danger" className="shadow-sm">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Validation Error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {/* Main Form Area */}
      <form className="grid grid-cols-1 lg:grid-cols-3 gap-8" onSubmit={(e) => e.preventDefault()}>

        {/* Left Column: Details & Items */}
        <div className="lg:col-span-2 space-y-4">

          {/* Invoice Details Card */}
          <Card>
            <Card.Header className="px-3 pt-3 pb-1">
              <Card.Title className="text-lg font-bold">Invoice Details</Card.Title>
            </Card.Header>
            <Card.Content className="px-3 pb-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Client Selection */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs uppercase tracking-wider">Select Client</Label>
                  <Select
                    className="w-full"
                    placeholder={isLoadingClients ? "Loading clients..." : "Choose a client"}
                    value={clientId}
                    onChange={(key: any) => setClientId(key as string)}
                  >
                    <Select.Trigger>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-muted" />
                        <Select.Value />
                      </div>
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {clients.map((client) => (
                          <ListBox.Item key={client.id} id={client.id} textValue={client.name}>
                            <div className="flex flex-col">
                              <span className="font-bold">{client.name}</span>
                              <span className="text-xs text-muted">{client.email}</span>
                            </div>
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  {clients.length === 0 && !isLoadingClients && (
                    <p className="text-[10px] text-warning font-bold uppercase mt-1">No clients found. Go to Clients page to add one.</p>
                  )}
                </div>

                {/* Invoice Number */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs uppercase tracking-wider">Invoice Number</Label>
                  <InputGroup>
                    <InputGroup.Prefix><Hash size={16} className="text-muted" /></InputGroup.Prefix>
                    <InputGroup.Input
                      placeholder="e.g. INV-001"
                      value={invoiceNumber}
                      onChange={(e: any) => setInvoiceNumber(e.target.value)}
                    />
                  </InputGroup>
                </div>

                {/* Currency Selection */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs uppercase tracking-wider">Currency</Label>
                  <Select
                    className="w-full"
                    value={currency}
                    onChange={(key: any) => setCurrency(key as string)}
                  >
                    <Select.Trigger>
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-muted" />
                        <Select.Value />
                      </div>
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="INR" textValue="INR">INR - Indian Rupee</ListBox.Item>
                        <ListBox.Item id="USD" textValue="USD">USD - US Dollar</ListBox.Item>
                        <ListBox.Item id="EUR" textValue="EUR">EUR - Euro</ListBox.Item>
                        <ListBox.Item id="GBP" textValue="GBP">GBP - British Pound</ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                {/* Issue Date */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs uppercase tracking-wider">Issue Date</Label>
                  <InputGroup>
                    <InputGroup.Prefix><Calendar size={16} className="text-muted" /></InputGroup.Prefix>
                    <InputGroup.Input
                      type="date"
                      value={issueDate}
                      onChange={(e: any) => setIssueDate(e.target.value)}
                    />
                  </InputGroup>
                </div>

                {/* Due Date */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs uppercase tracking-wider">Due Date</Label>
                  <InputGroup>
                    <InputGroup.Prefix><Calendar size={16} className="text-muted" /></InputGroup.Prefix>
                    <InputGroup.Input
                      type="date"
                      value={dueDate}
                      onChange={(e: any) => setDueDate(e.target.value)}
                    />
                  </InputGroup>
                </div>

              </div>
            </Card.Content>
          </Card>

          {/* Invoice Items Card */}
          <Card>
            <Card.Header className="px-3 pt-3 pb-1">
              <Card.Title className="text-lg font-bold">Invoice Items</Card.Title>
            </Card.Header>
            <Card.Content className="p-0">
              {/* Header for Desktop */}
              <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] font-bold uppercase tracking-widest text-muted px-3 py-2 border-y border-separator/30 bg-default/5">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              <div className="px-3 py-3 space-y-6 md:space-y-2">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-x-4 gap-y-3 md:gap-y-0 items-start md:items-center">
                    {/* Row 1: Item Description */}
                    <div className="col-span-12 md:col-span-5 flex flex-col gap-1">
                      <Label className="md:hidden text-[10px] font-bold uppercase text-muted">Description</Label>
                      <Input
                        fullWidth
                        placeholder="Service description..."
                        value={item.description}
                        onChange={(e: any) => updateItem(item.id, 'description', e.target.value)}
                      />
                    </div>

                    {/* Row 2: Quantity and Unit Price */}
                    <div className="col-span-6 md:col-span-2 flex flex-col gap-1">
                      <Label className="md:hidden text-[10px] font-bold uppercase text-muted text-center">Qty</Label>
                      <Input
                        fullWidth
                        type="number"
                        placeholder="0"
                        value={item.quantity as any}
                        onChange={(e: any) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>

                    <div className="col-span-6 md:col-span-2 flex flex-col gap-1">
                      <Label className="md:hidden text-[10px] font-bold uppercase text-muted text-right">Price</Label>
                      <Input
                        fullWidth
                        type="number"
                        placeholder="0.00"
                        value={item.unitPrice as any}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </div>

                    {/* Row 3: Total per item */}
                    <div className="col-span-12 md:col-span-2 flex flex-row justify-between items-center md:justify-end gap-1">
                      <Label className="md:hidden text-[10px] font-bold uppercase text-muted">Line Total</Label>
                      <div className="text-right h-10 flex items-center justify-end">
                        <span className="font-bold tabular-nums whitespace-nowrap">
                          {formatValue(item.total)}
                        </span>
                      </div>
                    </div>

                    {/* Row 4: Delete Button */}
                    <div className="col-span-12 md:col-span-1 flex justify-end md:items-center">
                      <Tooltip>
                        <Button
                          isIconOnly
                          variant="danger"
                          size="sm"
                          onPress={() => removeItem(item.id)}
                          isDisabled={items.length <= 1}
                          aria-label="Remove Item"
                        >
                          <Trash2 size={16} />
                        </Button>
                        <Tooltip.Content>Remove Item</Tooltip.Content>
                      </Tooltip>
                    </div>

                    {/* Visual Divider for Mobile */}
                    <div className="col-span-12 md:hidden border-b border-separator/30 my-1" />
                  </div>
                ))}
              </div>

              {/* Add Item Action at the Bottom */}
              <div className="px-3 py-2 bg-default/5 flex justify-start border-t border-separator/30">
                <Button
                  variant="tertiary"
                  size="sm"
                  onPress={addItem}
                >
                  <Plus size={16} className="mr-2" />
                  Add New Line Item
                </Button>
              </div>
            </Card.Content>
          </Card>

          {/* Notes & Terms Card */}
          <Card>
            <Card.Header className="px-3 pt-3 pb-1">
              <Card.Title className="text-lg font-bold">Additional Notes</Card.Title>
            </Card.Header>
            <Card.Content className="px-3 pb-3 space-y-3">
              <TextArea
                placeholder="Any additional information, bank details, or terms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Card.Content>
          </Card>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-4">
          <Card>
            <Card.Header className="px-3 pt-3 pb-1">
              <Card.Title className="text-lg font-bold">Summary</Card.Title>
            </Card.Header>
            <Card.Content className="px-3 pb-3 space-y-3">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-bold">{formatValue(subtotal)}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">Tax Rate (%)</span>
                    <Input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-20 text-right font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">Tax Amount</span>
                    <span className="font-medium">{formatValue(taxAmount)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-end pt-2">
                  <span className="text-xs uppercase tracking-widest font-bold text-muted">Total Due</span>
                  <div className="text-right">
                    <p className="text-3xl font-bold leading-none tabular-nums">
                      {formatValue(totalAmount)}
                    </p>
                    <p className="text-[10px] text-muted mt-2 uppercase tracking-widest font-medium">
                      All inclusive ({currency})
                    </p>
                  </div>
                </div>
              </div>

              {/* Informational Tip */}
              <div className="flex gap-3">
                <FileText className="text-muted shrink-0" size={20} />
                <p className="text-xs leading-relaxed italic text-muted">
                  A professional PDF will be generated and stored securely in your cloud storage once the invoice is saved.
                </p>
              </div>
            </Card.Content>
          </Card>
        </div>

      </form>
    </div>
  );
};

export default CreateInvoice;
