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
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { api, CompanyProfile } from '../utils/api';

interface SmtpStatus {
  configured: boolean;
  verified: boolean;
  host?: string;
  user?: string;
  from?: string;
}

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

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleSmtpTest = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your business identity and delivery infrastructure.</p>
        </div>
        <button
          onClick={() => fetchSmtpStatus()}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Refresh connection status"
        >
          <RefreshCw size={18} className={loadingSmtp ? 'animate-spin' : ''} />
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Company Profile */}
        <div className="xl:col-span-2 space-y-6">
          <section className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Building2 size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Company Profile</h2>
              </div>
              <button
                onClick={handleProfileSave}
                disabled={saving || loadingProfile}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Profile
              </button>
            </div>

            {loadingProfile ? (
              <div className="p-20 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                <p className="text-gray-500 font-medium text-sm">Loading profile data...</p>
              </div>
            ) : (
              <form className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex items-center gap-6 mb-4">
                  <div className="h-24 w-24 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 group hover:border-blue-400 hover:text-blue-500 transition-all">
                    {companyInfo.logoUrl ? (
                      <img src={companyInfo.logoUrl} alt="Logo" className="h-full w-full object-contain p-2 rounded-2xl" />
                    ) : (
                      <>
                        <Upload size={24} />
                        <span className="text-[10px] font-bold uppercase mt-2">Logo</span>
                      </>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">Business Logo</h4>
                    <p className="text-xs text-gray-500 mt-1">Provide a URL to your company logo for the invoices.</p>
                    <input
                      type="text"
                      className="mt-2 text-xs w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://storage.googleapis.com/..."
                      value={companyInfo.logoUrl || ''}
                      onChange={(e) => setCompanyInfo({...companyInfo, logoUrl: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Legal Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Tech Solutions"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={companyInfo.name || ''}
                      onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Support Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email"
                      required
                      placeholder="contact@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={companyInfo.email || ''}
                      onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Billing Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                    <textarea
                      rows={3}
                      required
                      placeholder="Street, City, Country, Zip Code"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      value={companyInfo.address || ''}
                      onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Tax ID / VAT Number</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. GB12345678"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={companyInfo.taxId || ''}
                      onChange={(e) => setCompanyInfo({...companyInfo, taxId: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Invoice Number Prefix</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. INV"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={companyInfo.invoicePrefix || ''}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, invoicePrefix: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Default Currency</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                      value={companyInfo.currency || 'INR'}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, currency: e.target.value })}
                    >
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Bank Payment Instructions</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 text-gray-400" size={16} />
                    <textarea
                      rows={3}
                      placeholder="Provide your IBAN, SWIFT, or wire instructions here..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-mono text-sm"
                      value={companyInfo.bankDetails || ''}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, bankDetails: e.target.value })}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Custom Email Subject</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. Invoice {invoiceNumber} from {companyName}"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={companyInfo.emailSubject || ''}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, emailSubject: e.target.value })}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Available variables: {'{invoiceNumber}, {companyName}'}</p>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Custom Email Body</label>
                  <div className="relative">
                    <Info className="absolute left-3 top-3 text-gray-400" size={16} />
                    <textarea
                      rows={4}
                      placeholder="Enter the message you want to send with your invoices..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm"
                      value={companyInfo.emailBody || ''}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, emailBody: e.target.value })}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Footer HTML</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 text-gray-400" size={16} />
                    <textarea
                      rows={6}
                      placeholder="Enter HTML for the email footer..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-mono text-xs"
                      value={companyInfo.emailFooterHtml || ''}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, emailFooterHtml: e.target.value })}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">This HTML will be appended to the bottom of the invoice emails.</p>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Default CC Emails</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. boss@company.com, accounting@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={companyInfo.ccEmails || ''}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, ccEmails: e.target.value })}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Separate multiple emails with commas. These will be CC'd on every invoice sent.</p>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* Right Column: SMTP Connection Info */}
        <div className="space-y-6">
          <section className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Server size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-900">SMTP Connection</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {loadingSmtp ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="animate-spin text-purple-600 mb-3" size={24} />
                  <p className="text-xs text-gray-500 font-medium tracking-tight">Verifying connection...</p>
                </div>
              ) : (
                <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                  smtpStatus?.verified ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Connection Status</span>
                    {smtpStatus?.verified ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase">
                        <CheckCircle2 size={10} /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
                        <AlertCircle size={10} /> Not Verified
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Host:</span>
                      <span className="font-bold text-gray-900 truncate ml-4">{smtpStatus?.host || 'None Set'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">User:</span>
                      <span className="font-bold text-gray-900 truncate ml-4">{smtpStatus?.user || 'None Set'}</span>
                    </div>
                  </div>

                  {!smtpStatus?.configured && (
                    <div className="mt-2 text-[11px] text-amber-700 italic">
                      Configure <code>SMTP_HOST</code> and <code>SMTP_USER</code> in your <code>.env</code> file.
                    </div>
                  )}
                </div>
              )}

              {/* Test Email Form */}
              <form onSubmit={handleSmtpTest} className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Send Test Email</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="email"
                      required
                      placeholder="test@example.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={testingSmtp || !smtpStatus?.configured || loadingSmtp}
                    className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 shadow-md shadow-purple-100 transition-all"
                    title="Send Test"
                  >
                    {testingSmtp ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4">
            <div className="text-amber-500 shrink-0">
              <Info size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 uppercase tracking-tight">Zero Cost Tip</h4>
              <p className="text-xs text-amber-800 leading-relaxed mt-1">
                To keep costs at $0, use your personal Gmail or Outlook SMTP settings with an App Password. These settings are read directly from your server's environment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
