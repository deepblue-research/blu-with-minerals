import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  MapPin,
  Building2,
  MoreHorizontal,
  X,
  UserPlus,
  Loader2
} from 'lucide-react';
import { api, Client } from '../utils/api';

const Clients: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    taxId: '',
    notes: '',
    ccEmails: ''
  });

  // Fetch clients on mount
  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<any[]>('/clients');
      setClients(data);
      setError(null);
    } catch (err: any) {
      setError('Failed to load clients. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingClient) {
        await api.patch(`/clients/${editingClient.id}`, formData);
      } else {
        await api.post('/clients', formData);
      }
      setIsModalOpen(false);
      setEditingClient(null);
      setFormData({ name: '', email: '', address: '', taxId: '', notes: '', ccEmails: '' });
      fetchClients(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${editingClient ? 'update' : 'create'} client`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      address: client.address,
      taxId: client.taxId || '',
      notes: client.notes || '',
      ccEmails: client.ccEmails || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this client? This will fail if they have associated invoices.')) return;

    try {
      await api.delete(`/clients/${id}`);
      fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete client');
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Clients</h1>
          <p className="text-gray-500 mt-1">Manage your customer database and billing details.</p>
        </div>
        <button
          onClick={() => {
            setEditingClient(null);
            setFormData({ name: '', email: '', address: '', taxId: '', notes: '', ccEmails: '' });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add New Client
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search clients by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && !isModalOpen && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading your clients...</p>
        </div>
      ) : (
        <>
          {/* Clients Grid/List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div key={client.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(client)}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="Edit Client"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Delete Client"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{client.name}</h3>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail size={14} />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={14} />
                    <span className="truncate">{client.address}</span>
                  </div>
                  {client.taxId && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Building2 size={14} />
                      <span>{client.taxId}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoices</p>
                    <p className="text-lg font-bold text-gray-900">{client._count?.invoices || 0}</p>
                  </div>
                  <button className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                    View History
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredClients.length === 0 && (
            <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No clients found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search or add a new client to get started.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 text-blue-600 font-bold hover:underline"
              >
                Add your first client
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <UserPlus size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingClient(null);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Client / Company Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Acme Industries"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="billing@client.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Billing Address</label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  placeholder="Street, City, Postcode, Country"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tax ID / VAT (Optional)</label>
                <input
                  type="text"
                  name="taxId"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. US123456789"
                  value={formData.taxId}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">CC Emails (Optional)</label>
                <input
                  type="text"
                  name="ccEmails"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. manager@client.com, info@client.com"
                  value={formData.ccEmails}
                  onChange={handleInputChange}
                />
                <p className="text-[10px] text-gray-400 mt-1">Separate multiple emails with commas.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  placeholder="Internal notes about this client..."
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    editingClient ? 'Update Client' : 'Create Client'
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

export default Clients;
