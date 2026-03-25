import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * API Client utility for communicating with the Node.js backend.
 * Uses the Vite proxy configuration defined in vite.config.ts.
 */
class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for global error handling
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
        console.error('[API Error]:', message);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }
}

export const api = new ApiClient();

/**
 * Type definitions for API responses
 */
export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  taxId?: string;
  notes?: string;
  ccEmails?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';
  issueDate: string;
  dueDate: string;
  pdfUrl?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  clientId: string;
  client?: Client;
  clientSnapshot?: any;
  companySnapshot?: any;
  items: InvoiceItem[];
}

export interface RecurringSchedule {
  id: string;
  clientId: string;
  client?: Client;
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  dayOfMonth?: number;
  nextRunDate: string;
  dueDays: number;
  isActive: boolean;
  currency: string;
  taxRate: number;
  templateItems: any[];
}

export interface CompanyProfile {
  id: string;
  name: string;
  email: string;
  address: string;
  taxId?: string;
  bankDetails?: string;
  logoUrl?: string;
  currency: string;
  invoicePrefix: string;
  ccEmails?: string;
  emailSubject?: string;
  emailBody?: string;
  emailFooterHtml?: string;
}

export interface DashboardStats {
  totalSent: number;
  totalSentTrend: number;
  paidThisMonth: number;
  paidTrend: number;
  outstanding: number;
  outstandingTrend: number;
  activeClients: number;
  clientsTrend: number;
  upcomingRecurring: number;
  currency: string;
}

export interface RecentInvoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  date: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';
  currency: string;
}
