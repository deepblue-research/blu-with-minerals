import { Router } from 'express';
import { prisma } from '../db';
import { InvoiceService } from '../services/invoice.service';
import { InvoiceStatus } from '@prisma/client';

const router = Router();
const invoiceService = new InvoiceService(prisma);

/**
 * GET /api/invoices
 * List all invoices with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { status, clientId } = req.query;

    const invoices = await prisma.invoice.findMany({
      where: {
        ...(status ? { status: status as InvoiceStatus } : {}),
        ...(clientId ? { clientId: clientId as string } : {}),
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    });

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * GET /api/invoices/next-number
 * Calculates the next sequential invoice number based on the fiscal year logic
 * (Uses previous year until the third month inclusive)
 */
router.get('/next-number', async (req, res) => {
  try {
    const nextNumber = await invoiceService.generateNextInvoiceNumber();
    res.json({ nextNumber });
  } catch (error) {
    console.error('Error generating next invoice number:', error);
    res.status(500).json({ error: 'Failed to generate next invoice number' });
  }
});

/**
 * POST /api/invoices
 * Create a new manual invoice. Captures snapshots of client and company data.
 */
router.post('/', async (req, res) => {
  try {
    const {
      clientId,
      invoiceNumber,
      issueDate,
      dueDate,
      items,
      taxRate,
      notes,
      currency
    } = req.body;

    // 1. Validate Client
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    // 2. Fetch Company Profile (for snapshot)
    const company = await prisma.companyProfile.findFirst();
    if (!company) return res.status(400).json({ error: 'Please configure your Company Profile first' });

    // 3. Calculate Totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = (subtotal * (taxRate || 0)) / 100;
    const totalAmount = subtotal + taxAmount;

    // 4. Create Invoice with Snapshots and Items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        status: 'DRAFT',
        clientId,
        subtotal,
        taxRate: taxRate || 0,
        taxAmount,
        totalAmount,
        notes,
        currency: currency || 'INR',
        clientSnapshot: {
          name: client.name,
          email: client.email,
          address: client.address,
          taxId: client.taxId,
          ccEmails: client.ccEmails,
        },
        companySnapshot: {
          name: company.name,
          email: company.email,
          address: company.address,
          taxId: company.taxId,
          bankDetails: company.bankDetails,
          logoUrl: company.logoUrl,
          emailFooterHtml: company.emailFooterHtml,
          ccEmails: company.ccEmails,
        },
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json(invoice);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

/**
 * PATCH /api/invoices/:id
 * Update an existing draft invoice
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      clientId,
      invoiceNumber,
      issueDate,
      dueDate,
      items,
      taxRate,
      notes,
      currency
    } = req.body;

    // 1. Check if invoice exists and is DRAFT
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });
    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft invoices can be modified' });
    }

    // 2. Validate Client
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    // 3. Fetch Company Profile (for fresh snapshot)
    const company = await prisma.companyProfile.findFirst();
    if (!company) return res.status(400).json({ error: 'Please configure your Company Profile first' });

    // 4. Calculate Totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = (subtotal * (taxRate || 0)) / 100;
    const totalAmount = subtotal + taxAmount;

    // 5. Update Invoice with fresh Snapshots and Items
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        invoiceNumber,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        clientId,
        subtotal,
        taxRate: taxRate || 0,
        taxAmount,
        totalAmount,
        notes,
        currency: currency || 'INR',
        clientSnapshot: {
          name: client.name,
          email: client.email,
          address: client.address,
          taxId: client.taxId,
          ccEmails: client.ccEmails,
        },
        companySnapshot: {
          name: company.name,
          email: company.email,
          address: company.address,
          taxId: company.taxId,
          bankDetails: company.bankDetails,
          logoUrl: company.logoUrl,
          emailFooterHtml: company.emailFooterHtml,
          ccEmails: company.ccEmails,
        },
        items: {
          deleteMany: {},
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    res.json(invoice);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

/**
 * GET /api/invoices/:id
 * Get full invoice details
 */
router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        client: true,
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

/**
 * GET /api/invoices/:id/html
 * Returns the rendered HTML of the invoice using the Handlebars template
 */
router.get('/:id/html', async (req, res) => {
  try {
    const html = await invoiceService.getInvoiceHtml(req.params.id);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error: any) {
    console.error('HTML Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate invoice HTML' });
  }
});

/**
 * GET /api/invoices/:id/pdf
 * Generates/processes the PDF and returns the storage URL
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const pdfUrl = await invoiceService.processInvoicePdf(req.params.id);
    res.json({ pdfUrl });
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate PDF' });
  }
});

/**
 * POST /api/invoices/:id/send
 * Generates PDF (if needed) and sends it via email
 */
router.post('/:id/send', async (req, res) => {
  try {
    // 1. Ensure PDF is generated and uploaded
    await invoiceService.processInvoicePdf(req.params.id);

    // 2. Send email
    await invoiceService.sendInvoiceToClient(req.params.id);

    res.json({ message: 'Invoice sent successfully' });
  } catch (error: any) {
    console.error('Email Sending Error:', error);
    res.status(500).json({ error: error.message || 'Failed to send invoice' });
  }
});

/**
 * PATCH /api/invoices/:id/status
 * Update status (e.g., mark as PAID)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: status as InvoiceStatus },
    });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * DELETE /api/invoices/:id
 * Delete a draft invoice
 */
router.delete('/:id', async (req, res) => {
  try {
    // Only allow deleting DRAFT invoices for safety
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft invoices can be deleted. Use VOID for issued invoices.' });
    }

    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

export default router;
