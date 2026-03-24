import { PrismaClient, Invoice, InvoiceStatus } from '@prisma/client';
import { PdfService, InvoiceTemplateData, InvoiceItemData } from './pdf.service';
import { EmailService } from './email.service';
import { StorageService } from './storage.service';
import { formatDateDDMMYYYY } from '../utils/date';

export class InvoiceService {
  private prisma: PrismaClient;
  private pdfService: PdfService;
  private emailService: EmailService;
  private storageService: StorageService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.pdfService = new PdfService();
    this.emailService = new EmailService();
    this.storageService = new StorageService();
  }

  /**
   * Prepares the data object required by the Handlebars template
   */
  async getInvoiceTemplateData(invoiceId: string): Promise<InvoiceTemplateData> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        items: true,
      },
    });

    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }

    const clientSnapshot = invoice.clientSnapshot as any;
    const companySnapshot = invoice.companySnapshot as any;
    const currency = (invoice as any).currency || 'USD';

    return {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: formatDateDDMMYYYY(invoice.issueDate),
      dueDate: formatDateDDMMYYYY(invoice.dueDate),
      company: {
        name: companySnapshot.name,
        address: companySnapshot.address,
        taxId: companySnapshot.taxId,
        logoUrl: companySnapshot.logoUrl,
        bankDetails: companySnapshot.bankDetails,
        initials: companySnapshot.name
          ? companySnapshot.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
          : '',
      },
      client: {
        name: clientSnapshot.name,
        email: clientSnapshot.email,
        address: clientSnapshot.address,
        taxId: clientSnapshot.taxId,
      },
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPriceFormatted: PdfService.formatCurrency(item.unitPrice, currency),
        totalFormatted: PdfService.formatCurrency(item.total, currency),
      })),
      subtotalFormatted: PdfService.formatCurrency(invoice.subtotal, currency),
      taxRate: invoice.taxRate,
      taxAmountFormatted: PdfService.formatCurrency(invoice.taxAmount, currency),
      totalAmountFormatted: PdfService.formatCurrency(invoice.totalAmount, currency),
      notes: invoice.notes || '',
    };
  }

  /**
   * Generates the rendered HTML string for an invoice
   */
  async getInvoiceHtml(invoiceId: string): Promise<string> {
    const data = await this.getInvoiceTemplateData(invoiceId);
    return this.pdfService.generateInvoiceHtml(data);
  }

  /**
   * Generates a PDF for an existing invoice, uploads it to GCS, and updates the DB with the URL.
   */
  async processInvoicePdf(invoiceId: string): Promise<string> {
    // 1. Fetch invoice for file naming
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }

    // 2. Prepare Template Data
    const templateData = await this.getInvoiceTemplateData(invoiceId);

    // 3. Generate PDF Buffer
    const pdfBuffer = await this.pdfService.generateInvoicePdf(templateData);

    // 4. Upload to Google Cloud Storage
    const fileName = `invoices/${invoice.invoiceNumber.replace(/[^a-z0-9]/gi, '_')}_${invoice.id.substring(0, 8)}.pdf`;
    const pdfUrl = await this.storageService.uploadFile(pdfBuffer, fileName);

    // 5. Update Invoice with PDF URL
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { pdfUrl },
    });

    return pdfUrl;
  }

  /**
   * Sends an invoice to the client via email
   */
  async sendInvoiceToClient(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    });

    if (!invoice || !invoice.pdfUrl) {
      throw new Error('Invoice not found or PDF not yet generated');
    }

    // Since pdfUrl is a signed URL or GCS path, we need the actual buffer to attach it
    // For simplicity, we re-generate or fetch the buffer.
    // Re-generating is often safer than fetching over network if the PDF isn't public.
    const clientSnapshot = invoice.clientSnapshot as any;

    // We'll re-generate the buffer for the attachment to ensure it's the latest
    // In a production environment, you might fetch from GCS instead.
    const pdfBuffer = await this.generateBufferForInvoice(invoice.id);

    await this.emailService.sendInvoiceEmail(
      clientSnapshot.email,
      invoice.id,
      pdfBuffer
    );

    // Update status to SENT
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'SENT' as InvoiceStatus },
    });
  }

  /**
   * Private helper to generate a buffer for an invoice ID
   */
  private async generateBufferForInvoice(invoiceId: string): Promise<Buffer> {
    const templateData = await this.getInvoiceTemplateData(invoiceId);
    return this.pdfService.generateInvoicePdf(templateData);
  }

  /**
   * Automated method to process a full invoice flow: Generate -> Store -> Send
   */
  async processAndSend(invoiceId: string): Promise<void> {
    await this.processInvoicePdf(invoiceId);
    await this.sendInvoiceToClient(invoiceId);
  }
}
