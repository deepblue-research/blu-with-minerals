import nodemailer from 'nodemailer';
import { prisma } from '../db';

export interface EmailOptions {
  to: string;
  cc?: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true'; // true for 465, false for other ports
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('SMTP configuration is missing. Email service might not function correctly.');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      // Increase timeouts for better diagnosis of slow connections
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 15000,
      debug: true, // Enable debug output in the console
      logger: true // Log internal nodemailer activity
    });
  }

  /**
   * Sends an email with the provided options
   */
  async sendEmail(options: EmailOptions): Promise<any> {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Invoice Service" <invoices@yourcompany.com>',
      to: options.to,
      cc: options.cc,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
      return info;
    } catch (error: any) {
      console.error('--- SMTP SEND ERROR ---');
      console.error('Code:', error.code);
      console.error('Command:', error.command);
      console.error('Response:', error.response);
      console.error('Message:', error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Specialized method to send an invoice PDF
   */
  async sendInvoiceEmail(to: string, invoiceId: string, pdfBuffer: Buffer): Promise<any> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }

    const invoiceNumber = invoice.invoiceNumber;
    const clientSnapshot = invoice.clientSnapshot as any;
    const companySnapshot = invoice.companySnapshot as any;

    const profile = await prisma.companyProfile.findFirst();
    const companyName = profile?.name || companySnapshot?.name || process.env.COMPANY_NAME || 'Our Company';

    const subjectTemplate = profile?.emailSubject || 'Invoice {invoiceNumber} from {companyName}';
    const bodyTemplate = profile?.emailBody || 'Please find attached your invoice {invoiceNumber}.\n\nThank you for your business!';
    const footerHtml = profile?.emailFooterHtml || companySnapshot?.emailFooterHtml || '';

    // Collect CC emails from both client and company settings
    const ccEmails = [
      profile?.ccEmails,
      companySnapshot?.ccEmails,
      clientSnapshot?.ccEmails
    ].filter(Boolean).join(',');

    const subject = subjectTemplate
      .replace(/{invoiceNumber}/g, invoiceNumber)
      .replace(/{companyName}/g, companyName);

    const body = bodyTemplate
      .replace(/{invoiceNumber}/g, invoiceNumber)
      .replace(/{companyName}/g, companyName);

    const htmlBody = body.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<br/>').join('') + footerHtml;

    return this.sendEmail({
      to,
      cc: ccEmails || undefined,
      subject,
      text: body,
      html: htmlBody,
      attachments: [
        {
          filename: `Invoice_${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  /**
   * Verifies the SMTP connection with a timeout to prevent infinite loading
   */
  async verifyConnection(): Promise<boolean> {
    try {
      console.log(`Attempting to verify SMTP connection to ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}...`);

      // Race the verification against a 7-second timeout
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('SMTP Verification Timeout after 7s')), 7000)
      );

      await Promise.race([this.transporter.verify(), timeout]);
      console.log('SMTP Connection Verified Successfully');
      return true;
    } catch (error: any) {
      console.error('--- SMTP VERIFICATION FAILED ---');
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);

      if (error.code === 'ETIMEDOUT') {
        console.error('Diagnosis: The connection timed out. Check if the port (587/465) is blocked by a firewall or if the Hostname is correct.');
      } else if (error.message.includes('Greeting never received')) {
        console.error('Diagnosis: Connected to server but received no response. This often happens if "SMTP_SECURE" is set incorrectly for the given port.');
      }

      return false;
    }
  }
}
