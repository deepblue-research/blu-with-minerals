import React, { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  MapPin,
  CreditCard,
  Save,
  ShieldCheck,
  Server,
  Upload,
  Info,
  Hash,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import {
  Button,
  Input,
  InputGroup,
  TextArea,
  Select,
  ListBox,
  Label,
  Card,
  Separator,
  Tabs,
  Spinner,
  Alert,
  Avatar,
  Tooltip
} from '@heroui/react';
import { api, CompanyProfile } from '../utils/api';

interface SmtpStatus {
  configured: boolean;
  verified: boolean;
  host?: string;
  user?: string;
  from?: string;
}

/**
 * Settings page using HeroUI v3 BETA components.
 * Manages company profile, billing preferences, and email infrastructure.
 */
const Settings: React.FC = () => {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSmtp, setLoadingSmtp] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // State for Company Profile
  const [companyInfo, setCompanyInfo] = useState<Partial<CompanyProfile>>({
    name: '',
    email: '',
    address: '',
    taxId: '',
    bankDetails: '',
    logoUrl: '',
    invoicePrefix: 'INV',
    currency: 'INR',
    emailSubject: '',
    emailBody: '',
    emailFooterHtml: '',
    ccEmails: ''
  });

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const data = await api.get<CompanyProfile>('/profile');
      setCompanyInfo(data);
    } catch (error) {
      console.error('Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchSmtpStatus = async () => {
    setLoadingSmtp(true);
    try {
      const status = await api.get<SmtpStatus>('/profile/smtp-status');
      setSmtpStatus(status);
    } catch (error) {
      console.error('Failed to load SMTP status');
      setSmtpStatus({ configured: false, verified: false });
    } finally {
      setLoadingSmtp(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSmtpStatus();
  }, []);

  const handleProfileSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.patch<CompanyProfile>('/profile', companyInfo);
      setCompanyInfo(updated);
      setMessage({ type: 'success', text: 'Company profile updated successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleSmtpTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testEmail) return;

    setTestingSmtp(true);
    setMessage(null);
    try {
      await api.post('/profile/smtp-test', { testEmail });
      setMessage({ type: 'success', text: `Test email sent to ${testEmail}` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'SMTP Test failed' });
    } finally {
      setTestingSmtp(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Spinner size="lg" color="accent" />
        <p className="text-muted font-bold text-xs uppercase tracking-widest">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted mt-1">Manage your business identity and delivery infrastructure.</p>
        </div>
        <div className="flex items-center gap-3">
          <Tooltip>
            <Button
              isIconOnly
              variant="tertiary"
              onPress={() => fetchSmtpStatus()}
              isPending={loadingSmtp}
              aria-label="Refresh connection status"
            >
              <RefreshCw size={18} />
            </Button>
            <Tooltip.Content>Refresh connection status</Tooltip.Content>
          </Tooltip>
          <Button
            variant="primary"
            isPending={saving}
            onPress={handleProfileSave}
          >
            <Save size={20} className="mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {message && (
        <Alert
          status={message.type === 'success' ? 'success' : 'danger'}
          className="shadow-sm"
        >
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{message.text}</Alert.Title>
          </Alert.Content>
        </Alert>
      )}

      <Tabs
        aria-label="Settings sections"
        variant="secondary"
      >
        <Tabs.ListContainer>
          <Tabs.List>
            <Tabs.Tab id="business">
              <div className="flex items-center gap-2">
                <Building2 size={18} />
                <span>Business Profile</span>
              </div>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="email">
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <span>Email Delivery</span>
              </div>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="business" className="space-y-6 mt-6">
            <Card>
              <Card.Content className="space-y-8">
                {/* Logo Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                  <Avatar className="w-28 h-28 rounded-2xl border border-separator bg-white shadow-sm overflow-hidden">
                    <Avatar.Image
                      src={companyInfo.logoUrl || ''}
                      alt="Business Logo"
                      className="object-contain p-3"
                    />
                    <Avatar.Fallback className="rounded-2xl">
                      <Upload size={32} className="text-muted" />
                    </Avatar.Fallback>
                  </Avatar>
                  <div className="flex-1 w-full space-y-2">
                    <h4 className="text-sm font-bold">Business Logo</h4>
                    <p className="text-xs text-muted">Provide a public URL to your company logo for invoice headers.</p>
                    <Input
                      placeholder="https://storage.googleapis.com/your-bucket/logo.png"
                      value={companyInfo.logoUrl || ''}
                      onChange={(e: any) => setCompanyInfo({ ...companyInfo, logoUrl: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>

                <Separator />

                {/* Primary Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs uppercase tracking-wider mb-1 block">Legal Entity Name</Label>
                    <InputGroup>
                      <InputGroup.Prefix><Building2 size={16} className="text-muted" /></InputGroup.Prefix>
                      <InputGroup.Input
                        placeholder="Deepblue Research Pvt Ltd"
                        value={companyInfo.name || ''}
                        onChange={(e: any) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                      />
                    </InputGroup>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs uppercase tracking-wider mb-1 block">Billing Email</Label>
                    <InputGroup>
                      <InputGroup.Prefix><Mail size={16} className="text-muted" /></InputGroup.Prefix>
                      <InputGroup.Input
                        type="email"
                        placeholder="billing@company.com"
                        value={companyInfo.email || ''}
                        onChange={(e: any) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                      />
                    </InputGroup>
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <Label className="text-xs uppercase tracking-wider mb-1 block">Physical Address</Label>
                    <TextArea
                      placeholder="Full legal address for tax purposes"
                      value={companyInfo.address || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs uppercase tracking-wider mb-1 block">Tax / VAT ID</Label>
                    <InputGroup>
                      <InputGroup.Prefix><ShieldCheck size={16} className="text-muted" /></InputGroup.Prefix>
                      <InputGroup.Input
                        placeholder="GSTIN or VAT number"
                        value={companyInfo.taxId || ''}
                        onChange={(e: any) => setCompanyInfo({ ...companyInfo, taxId: e.target.value })}
                      />
                    </InputGroup>
                  </div>
                  <Select
                    className="w-full"
                    value={companyInfo.currency || 'INR'}
                    onChange={(key: any) => setCompanyInfo({ ...companyInfo, currency: key as string })}
                  >
                    <Label className="text-xs uppercase mb-2 block">Default Currency</Label>
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
                  <div className="flex flex-col gap-1">
                    <Label className="font-bold text-xs uppercase tracking-wider mb-1 block">Invoice Prefix</Label>
                    <InputGroup className="bg-default/40 h-10 rounded-lg">
                      <InputGroup.Prefix><Hash size={16} className="text-muted" /></InputGroup.Prefix>
                      <InputGroup.Input
                        placeholder="INV"
                        value={companyInfo.invoicePrefix || ''}
                        onChange={(e: any) => setCompanyInfo({ ...companyInfo, invoicePrefix: e.target.value })}
                      />
                    </InputGroup>
                  </div>
                </div>

                <Separator />

                {/* Financial Info */}
                <div className="space-y-4">
                  <h4 className="text-sm flex items-center gap-2">
                    <CreditCard size={18} className="text-accent" />
                    Bank Payment Instructions
                  </h4>
                  <TextArea
                    rows={4}
                    placeholder="Provide your IBAN, SWIFT, or wire instructions here. This appears on all PDFs."
                    value={companyInfo.bankDetails || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyInfo({ ...companyInfo, bankDetails: e.target.value })}
                    className="w-full"
                  />
                </div>
              </Card.Content>
            </Card>
        </Tabs.Panel>

        <Tabs.Panel id="email" className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <Card.Content className="space-y-6">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs uppercase tracking-wider mb-1 block">Email Subject Template</Label>
                    <Input
                      placeholder="Invoice {invoiceNumber} from {companyName}"
                      value={companyInfo.emailSubject || ''}
                      onChange={(e: any) => setCompanyInfo({ ...companyInfo, emailSubject: e.target.value })}
                    />
                    <p className="text-[10px] text-muted italic mt-1 px-1">Variables: {"{invoiceNumber}, {companyName}"}</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs uppercase tracking-wider mb-1 block">Email Body Text</Label>
                    <TextArea
                      placeholder="Write a friendly message to your clients..."
                      value={companyInfo.emailBody || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyInfo({ ...companyInfo, emailBody: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs uppercase tracking-wider mb-1 block">Email Footer (HTML allowed)</Label>
                    <TextArea
                      placeholder="<p>Sent via InvoiceApp</p>"
                      value={companyInfo.emailFooterHtml || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyInfo({ ...companyInfo, emailFooterHtml: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs uppercase tracking-wider mb-1 block">Default CC Emails</Label>
                    <InputGroup>
                      <InputGroup.Prefix><Mail size={16} className="text-muted" /></InputGroup.Prefix>
                      <InputGroup.Input
                        placeholder="finance@yourcompany.com, boss@yourcompany.com"
                        value={companyInfo.ccEmails || ''}
                        onChange={(e: any) => setCompanyInfo({ ...companyInfo, ccEmails: e.target.value })}
                      />
                    </InputGroup>
                  </div>
                </Card.Content>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <Card.Content>
                  <div className="flex items-center gap-2">
                    <Server size={18} className="text-accent" />
                    <h3 className="text-md font-bold">SMTP Status</h3>
                  </div>

                  {loadingSmtp ? (
                    <div className="flex flex-col items-center py-6 gap-3">
                      <Spinner size="sm" color="accent" />
                      <p className="text-[10px] text-muted uppercase tracking-widest">Checking infrastructure...</p>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-xl border-2 border-dashed flex flex-col gap-4 ${
                      smtpStatus?.verified ? 'border-success' : 'border-warning'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-widest text-muted">Verification</span>
                        {smtpStatus?.verified ? (
                          <div className="flex items-center gap-1.5 text-[10px] text-success uppercase">
                            <CheckCircle2 size={12} /> Live
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] text-warning uppercase">
                            <AlertCircle size={12} /> Pending
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted">Host</span>
                          <span className="font-bold">{smtpStatus?.host || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted">User</span>
                          <span className="font-bold truncate max-w-30">{smtpStatus?.user || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <form onSubmit={handleSmtpTest} className="space-y-4 mt-6">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] uppercase tracking-wider mb-1 block">Send Test Email</Label>
                      <InputGroup>
                        <InputGroup.Prefix><Send size={14} className="text-muted" /></InputGroup.Prefix>
                        <InputGroup.Input
                          placeholder="you@example.com"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                        />
                      </InputGroup>
                    </div>
                    <Button
                      fullWidth
                      variant="primary"
                      size="sm"
                      isDisabled={!smtpStatus?.configured || loadingSmtp}
                      isPending={testingSmtp}
                      onPress={() => handleSmtpTest()}
                    >
                      Fire Test Email
                    </Button>
                  </form>
                </Card.Content>
              </Card>

              <Card>
                <Card.Content className="flex flex-row gap-4">
                  <Info size={20} className="text-accent shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold">Zero Cost Tip</p>
                    <p className="text-[11px] text-muted leading-relaxed italic">
                      Use personal Gmail/Outlook SMTP with an App Password to maintain $0 infrastructure costs.
                    </p>
                  </div>
                </Card.Content>
              </Card>
            </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default Settings;
