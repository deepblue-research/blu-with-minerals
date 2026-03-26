import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Mail,
  MapPin,
  Building2,
  UserPlus,
  MoreVertical,
  Trash2,
  Edit2,
  Users
} from 'lucide-react';
import {
  Button,
  Input,
  InputGroup,
  Card,
  Avatar,
  Dropdown,
  Tooltip,
  Modal,
  TextArea,
  Spinner,
  Alert,
  Separator,
  Label
} from '@heroui/react';
import { api } from '../utils/api';

/**
 * Clients management page using HeroUI v3 BETA.
 * Allows viewing, searching, adding, and editing client data.
 */
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

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.address) {
      setError("Please fill in all required fields.");
      return;
    }

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
      fetchClients();
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
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted">Manage your customer database and billing details.</p>
        </div>
        <Button
          variant="primary"
          onPress={() => {
            setEditingClient(null);
            setFormData({ name: '', email: '', address: '', taxId: '', notes: '', ccEmails: '' });
            setIsModalOpen(true);
          }}
        >
          <Plus size={20} className="mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search Bar */}
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

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Spinner size="lg" color="accent" />
          <p className="text-muted text-xs uppercase tracking-widest">Loading clients...</p>
        </div>
      ) : (
        <>
          {filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card key={client.id}>
                  <Card.Header className="flex flex-row justify-between items-center">
                    <Avatar size="md">
                      <Avatar.Fallback>
                        {client.name.charAt(0)}
                      </Avatar.Fallback>
                    </Avatar>
                    <Dropdown>
                      <Button
                        isIconOnly
                        variant="tertiary"
                        size="sm"
                        aria-label="Client actions"
                      >
                        <MoreVertical size={20} />
                      </Button>
                      <Dropdown.Popover>
                        <Dropdown.Menu onAction={(id: any) => {
                          if (id === 'edit') handleEdit(client);
                          if (id === 'delete') handleDelete(client.id);
                        }}>
                          <Dropdown.Item id="edit" textValue="Edit Client">
                            <div className="flex items-center gap-2">
                              <Edit2 size={16} />
                              <span>Edit Client</span>
                            </div>
                          </Dropdown.Item>
                          <Dropdown.Item id="delete" textValue="Delete Client" variant="danger">
                            <div className="flex items-center gap-2">
                              <Trash2 size={16} />
                              <span>Delete Client</span>
                            </div>
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>
                  </Card.Header>
                  <Card.Content>
                    <h3 className="text-xl font-bold truncate">{client.name}</h3>
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center gap-3 text-sm text-muted">
                        <Mail size={16} className="shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-muted">
                        <MapPin size={16} className="shrink-0" />
                        <span className="line-clamp-2">{client.address}</span>
                      </div>
                      {client.taxId && (
                        <div className="flex items-center gap-3 text-sm text-muted">
                          <Building2 size={16} className="shrink-0" />
                          <span>{client.taxId}</span>
                        </div>
                      )}
                    </div>
                  </Card.Content>
                  <Card.Footer className="flex justify-between items-center mt-auto">
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-widest">Invoices</p>
                      <p className="text-lg font-bold">{client._count?.invoices || 0}</p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                    >
                      View History
                    </Button>
                  </Card.Footer>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 border border-dashed rounded-2xl">
              <div className="p-4 mb-4">
                <Users size={32} className="text-muted" />
              </div>
              <h3 className="text-lg font-bold">No clients found</h3>
              <p className="text-muted mt-1 max-w-xs">Try adjusting your search or add a new client to your database.</p>
              <Button
                variant="primary"
                onPress={() => setIsModalOpen(true)}
              >
                Add first client
              </Button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Client Modal */}
      <Modal>
        <Modal.Backdrop isOpen={isModalOpen} onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false);
            setEditingClient(null);
            setError(null);
          }
        }}>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header className="flex items-center gap-3">
                <div className="text-accent">
                  {editingClient ? <Edit2 size={20} /> : <UserPlus size={20} />}
                </div>
                <Modal.Heading className="text-xl font-bold">
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                {error && (
                  <Alert status="danger" className="text-xs">
                    <Alert.Indicator />
                    <Alert.Content>
                       <Alert.Title>{error}</Alert.Title>
                    </Alert.Content>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs uppercase tracking-wider">Client Name</Label>
                    <Input
                      name="name"
                      required
                      placeholder="Acme Industries"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs uppercase tracking-wider">Email Address</Label>
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="billing@client.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-xs uppercase tracking-wider">Billing Address</Label>
                  <TextArea
                    name="address"
                    required
                    placeholder="Street, City, Postal Code, Country"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs uppercase tracking-wider">Tax ID / VAT (Optional)</Label>
                    <Input
                      name="taxId"
                      placeholder="e.g. TAX-12345"
                      value={formData.taxId}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs uppercase tracking-wider">CC Emails (Optional)</Label>
                    <Input
                      name="ccEmails"
                      placeholder="manager@client.com"
                      value={formData.ccEmails}
                      onChange={handleInputChange}
                    />
                    <p className="text-[10px] text-muted italic">Separate multiple emails with commas.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-xs uppercase tracking-wider">Internal Notes (Optional)</Label>
                  <TextArea
                    name="notes"
                    placeholder="Any internal notes about this client..."
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="tertiary"
                  onPress={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  isPending={isSubmitting}
                  onPress={handleSubmit}
                >
                  {editingClient ? 'Update Client' : 'Create Client'}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
};

export default Clients;
