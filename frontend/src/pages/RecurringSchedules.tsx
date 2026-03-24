import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Search,
  Calendar,
  Trash2,
  Clock,
  X,
  Loader2,
  AlertCircle,
  Edit2,
  Percent,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { clsx } from 'clsx';
import { api, RecurringSchedule, Client } from '../utils/api';
import { formatDateDDMMYYYY } from '../utils/date';

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
    frequency: 'MONTHLY' as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    nextRunDate: new Date().toISOString().split('T')[0],
    taxRate: 0,
    dueDays: 30,
    currency: 'INR',
    templateItems: [{ description: '', quantity: 1, unitPrice: 0 }]
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [schedulesData, clientsData] = await Promise.all([
        api.get<RecurringSchedule[]>('/recurring'),
        api.get<Client[]>('/clients')
      ]);
      setSchedules(schedulesData);
      setClients(clientsData);
    } catch (err) {
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleStatus = async (schedule: RecurringSchedule) => {
    try {
      const updated = await api.patch<RecurringSchedule>(`/recurring/${schedule.id}`, {
        isActive: !schedule.isActive
      });
      setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recurring schedule?')) return;
    try {
      await api.delete(`/recurring/${id}`);
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete schedule');
    }
  };

  const handleEdit = (schedule: RecurringSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      clientId: schedule.clientId,
      frequency: schedule.frequency,
      nextRunDate: new Date(schedule.nextRunDate).toISOString().split('T')[0],
      taxRate: schedule.taxRate || 0,
      dueDays: schedule.dueDays || 30,
      currency: schedule.currency || 'USD',
      templateItems: schedule.templateItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    });
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      templateItems: [...prev.templateItems, { description: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      templateItems: prev.templateItems.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.templateItems];
    (newItems[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, templateItems: newItems }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        nextRunDate: new Date(formData.nextRunDate).toISOString(),
      };

      if (editingSchedule) {
        await api.patch(`/recurring/${editingSchedule.id}`, payload);
      } else {
        await api.post('/recurring', payload);
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${editingSchedule ? 'update' : 'create'} schedule`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingSchedule(null);
    setFormData({
      clientId: '',
      frequency: 'MONTHLY',
      nextRunDate: new Date().toISOString().split('T')[0],
      taxRate: 0,
      dueDays: 30,
      currency: 'INR',
      templateItems: [{ description: '', quantity: 1, unitPrice: 0 }]
    });
    setError(null);
  };

  const calculateSubtotal = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTotal = (items: any[], taxRate: number) => {
    const subtotal = calculateSubtotal(items);
    const taxAmount = (subtotal * taxRate) / 100;
    return subtotal + taxAmount;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading schedules...</p>
      </div>
    );
  }

  const filteredSchedules = schedules.filter(s =>
    s.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Recurring Schedules</h1>
          <p className="text-gray-500 mt-1">Automate your periodic billing workflows.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          New Schedule
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-4 items-start">
        <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0">
          <RefreshCw size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900">Automation Trigger</h4>
          <p className="text-sm text-blue-700 mt-0.5 leading-relaxed">
            Recurring invoices are processed via Cloud Scheduler. Active schedules automatically generate and email PDFs on their next run date.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by client name..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Client</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Frequency</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount (Inc. Tax)</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Next Run</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs">
                        {schedule.client?.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{schedule.client?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">{schedule.frequency}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-extrabold text-gray-900">
                        {new Intl.NumberFormat(schedule.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: schedule.currency || 'INR' }).format(calculateTotal(schedule.templateItems, schedule.taxRate))}
                      </span>
                      {schedule.taxRate > 0 && (
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Incl. {schedule.taxRate}% Tax</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-blue-600">
                        {formatDateDDMMYYYY(schedule.nextRunDate)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Terms: {schedule.dueDays} Days</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={() => toggleStatus(schedule)}
                      className={clsx(
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        schedule.isActive ? 'bg-blue-600' : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={clsx(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          schedule.isActive ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Schedule"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Schedule"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSchedules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <RefreshCw className="text-gray-200 mb-4" size={48} />
            <h3 className="text-lg font-bold text-gray-900">No schedules found</h3>
            <p className="text-gray-500 mt-1">Create a schedule to automate your billing.</p>
          </div>
        )}
      </div>

      {/* Creation/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  {editingSchedule ? <Edit2 size={20} /> : <Calendar size={20} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingSchedule ? 'Edit Schedule' : 'Create Recurring Schedule'}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">Define automation rules and line items.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-semibold">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              {/* Basic Config */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Select Client</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    value={formData.clientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                  >
                    <option value="">Choose a client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Frequency</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    {editingSchedule ? 'Next Run Date' : 'First Run Date'}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                      value={formData.nextRunDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextRunDate: e.target.value }))}
                    />
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {formatDateDDMMYYYY(formData.nextRunDate)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-1">
                    Payment Terms (Days)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                      placeholder="e.g. 30"
                      value={formData.dueDays}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDays: parseInt(e.target.value) || 0 }))}
                    />
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Tax Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                      value={formData.taxRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    />
                    <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Currency</label>
                  <div className="relative">
                    <select
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium appearance-none"
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    >
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                    <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              {/* Template Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Invoice Line Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.templateItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-start animate-in slide-in-from-top-2 duration-200">
                      <div className="col-span-6">
                        <input
                          placeholder="Item description"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                          required
                        />
                      </div>
                      <div className="col-span-1 flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          disabled={formData.templateItems.length === 1}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-gray-50 rounded-2xl p-6 space-y-2 border border-gray-100">
                <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                  <span>Subtotal</span>
                  <span>{new Intl.NumberFormat(formData.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: formData.currency }).format(calculateSubtotal(formData.templateItems))}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                  <span>Tax ({formData.taxRate}%)</span>
                  <span>{new Intl.NumberFormat(formData.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: formData.currency }).format((calculateSubtotal(formData.templateItems) * formData.taxRate) / 100)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-gray-900 font-bold">Total Amount</span>
                  <span className="text-2xl font-black text-gray-900">
                    {new Intl.NumberFormat(formData.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: formData.currency }).format(calculateTotal(formData.templateItems, formData.taxRate))}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    editingSchedule ? 'Save Changes' : 'Activate Automation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringSchedules;
