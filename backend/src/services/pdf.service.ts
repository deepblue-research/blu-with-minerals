import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

export interface InvoiceItemData {
  description: string;
  quantity: number;
  unitPriceFormatted: string;
  totalFormatted: string;
}

export interface InvoiceTemplateData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  company: {
    name: string;
    address: string;
    taxId?: string;
    logoUrl?: string;
    initials?: string;
    bankDetails?: string;
  };
  client: {
    name: string;
    email: string;
    address: string;
    taxId?: string;
  };
  items: InvoiceItemData[];
  subtotalFormatted: string;
  taxRate?: number;
  taxAmountFormatted?: string;
  totalAmountFormatted: string;
  notes?: string;
}

export class PdfService {
  private templateCache: HandlebarsTemplateDelegate | null = null;

  /**
   * Loads and compiles the Handlebars template from the filesystem
   */
  private async getTemplate(): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache) {
      return this.templateCache;
    }

    const templatePath = path.join(__dirname, '../templates/invoice.hbs');
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    this.templateCache = handlebars.compile(templateSource);
    return this.templateCache;
  }

  /**
   * Generates the rendered HTML string for the invoice
   */
  async generateInvoiceHtml(data: InvoiceTemplateData): Promise<string> {
    const template = await this.getTemplate();
    return template(data);
  }

  /**
   * Generates a PDF buffer from invoice data using Puppeteer
   */
  async generateInvoicePdf(data: InvoiceTemplateData): Promise<Buffer> {
    const template = await this.getTemplate();
    const html = template(data);

    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
      ],
      headless: true,
    });

    try {
      const page = await browser.newPage();

      // Set the HTML content and wait for the Tailwind CDN and fonts to load
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'load', 'domcontentloaded']
      });

      // Generate the PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
        displayHeaderFooter: false,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error during PDF generation:', error);
      throw new Error('Failed to generate PDF');
    } finally {
      await browser.close();
    }
  }

  /**
   * Helper to format numbers as currency (utility for the caller)
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    // Use en-IN locale for Indian Rupees to support the lakhs/crores grouping system
    const locale = currency.toUpperCase() === 'INR' ? 'en-IN' : 'en-US';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount);
  }
}
