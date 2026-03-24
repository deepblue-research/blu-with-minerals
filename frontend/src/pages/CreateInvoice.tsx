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
  Loader2,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api, Client } from '../utils/api';
import { formatDateDDMMYYYY } from '../utils/date';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [clientId, setClientId] = useState('');
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

  // Fetch initial data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsData, numberData] = await Promise.all([
          api.get<Client[]>('/clients'),
          api.get<{ nextNumber: string }>('/invoices/next-number')
        ]);
        setClients(clientsData);
        setInvoiceNumber(numberData.nextNumber);
      } catch (err: any) {
        setError('Failed to load initial data. Please try again.');
      } finally {
        setIsLoadingClients(false);
      }
    };
    fetchData();
  }, []);

  // Totals Calculation
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  const formatValue = (value: number) => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  // Handlers
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
      // 1. Create the invoice
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

      const createdInvoice: any = await api.post('/invoices', invoiceData);

      // 2. If "Generate & Send" was clicked, trigger the send endpoint
      if (sendImmediately) {
        await api.post(`/invoices/${createdInvoice.id}/send`);
      }

      navigate('/invoices');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process invoice. Check your server connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/invoices" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create Invoice</h1>
            <p className="text-gray-500 mt-1">Configure details and line items for your new invoice.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSaveInvoice(false)}
            className="px-4 py-2 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save as Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSaveInvoice(true)}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Generate & Send
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-8" onSubmit={(e) => e.preventDefault()}>
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Invoice Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User size={14} className="text-gray-400" /> Select Client
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none disabled:opacity-50"
                  value={clientId}
                  disabled={isLoadingClients}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  <option value="">{isLoadingClients ? 'Loading clients...' : 'Choose a client...'}</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
                {clients.length === 0 && !isLoadingClients && (
                  <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">No clients found. Go to Clients page to add one.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Hash size={14} className="text-gray-400" /> Invoice Number
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign size={14} className="text-gray-400" /> Currency
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" /> Issue Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {formatDateDDMMYYYY(issueDate)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" /> Due Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  {dueDate && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {formatDateDDMMYYYY(dueDate)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
              <h3 className="text-lg font-bold text-gray-900">Line Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1"
              >
                <Plus size={16} /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center group">
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="Service or product description..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-center focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-right focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 w-full text-right pr-2">
                      {formatValue(item.total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Notes & Terms</h3>
            <textarea
              rows={4}
              placeholder="Any additional information, bank details, or terms..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: Summary & Preview */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6 sticky top-8">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Summary</h3>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Subtotal</span>
                <span className="text-gray-900 font-bold">{formatValue(subtotal)}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Tax Rate (%)</span>
                  <input
                    type="number"
                    className="w-16 text-right px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax Amount</span>
                  <span className="text-gray-900">{formatValue(taxAmount)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total Amount</span>
                <span className="text-3xl font-extrabold text-blue-600">{formatValue(totalAmount)}</span>
              </div>
            </div>

            <div className="pt-6">
              <div className="bg-blue-50 rounded-2xl p-4 flex gap-3">
                <div className="text-blue-600">
                  <FileText size={20} />
                </div>
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  Saving this invoice will automatically generate a professional PDF and store it in your Cloud Storage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;
