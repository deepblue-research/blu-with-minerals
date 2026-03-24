import { Router } from 'express';
import { prisma } from '../db';
import { InvoiceService } from '../services/invoice.service';
import { Frequency, InvoiceStatus } from '@prisma/client';

const router = Router();
const invoiceService = new InvoiceService(prisma);

/**
 * GET /api/recurring
 * List all recurring schedules with client info
 */
router.get('/', async (req, res) => {
  try {
    const schedules = await prisma.recurringSchedule.findMany({
      include: {
        client: true,
      },
      orderBy: {
        nextRunDate: 'asc',
      },
    });
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch recurring schedules' });
  }
});

/**
 * POST /api/recurring
 * Create a new recurring schedule
 */
router.post('/', async (req, res) => {
  try {
    const { clientId, frequency, dayOfMonth, nextRunDate, templateItems, taxRate, currency, dueDays } = req.body;

    if (!clientId || !frequency || !nextRunDate || !templateItems) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const schedule = await prisma.recurringSchedule.create({
      data: {
        client: { connect: { id: clientId } },
        frequency: frequency as Frequency,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : null,
        nextRunDate: new Date(nextRunDate),
        templateItems,
        taxRate: taxRate ? parseFloat(taxRate) : 0,
        currency: currency || 'INR',
        dueDays: dueDays ? parseInt(dueDays) : 30,
        isActive: true,
      },
    });

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create recurring schedule' });
  }
});

/**
 * PATCH /api/recurring/:id
 * Update an existing schedule (status, items, etc.)
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    if (data.nextRunDate) {
      data.nextRunDate = new Date(data.nextRunDate);
    }

    if (data.taxRate !== undefined) {
      data.taxRate = parseFloat(data.taxRate);
    }

    if (data.dueDays !== undefined) {
      data.dueDays = parseInt(data.dueDays);
    }

    // Fix for Prisma validation error: Use 'client' connect instead of 'clientId'
    if (data.clientId) {
      data.client = { connect: { id: data.clientId } };
      delete data.clientId;
    }

    // Ensure data follows RecurringScheduleUpdateInput
    const updateData: any = {
      ...data,
    };

    const schedule = await prisma.recurringSchedule.update({
      where: { id },
      data: updateData,
    });

    res.json(schedule);
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update recurring schedule', details: error.message });
  }
});

/**
 * DELETE /api/recurring/:id
 * Remove a recurring schedule
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.recurringSchedule.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete recurring schedule' });
  }
});

/**
 * POST /api/recurring/check-recurring
 * THE AUTOMATION TRIGGER: Called by Cloud Scheduler (Cron)
 * Scans for due schedules, generates invoices, and sends emails.
 */
router.post('/check-recurring', async (req, res) => {
  // 1. Security check
  const cronSecret = req.headers['x-cron-key'];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: Invalid cron secret' });
  }

  try {
    const now = new Date();

    // 2. Find active schedules where nextRunDate is today or in the past
    const dueSchedules = await prisma.recurringSchedule.findMany({
      where: {
        isActive: true,
        nextRunDate: {
          lte: now,
        },
      },
      include: {
        client: true,
      },
    });

    if (dueSchedules.length === 0) {
      return res.json({ message: 'No due schedules found' });
    }

    // 3. Fetch Company Profile for snapshots and settings
    const company = await prisma.companyProfile.findFirst();
    if (!company) {
      throw new Error('Company profile must be configured before running automation');
    }

    const processingResults = [];

    for (const schedule of dueSchedules) {
      try {
        // A. Generate Unique Invoice Number using company prefix
        // Logic: Use previous year value until the third month (inclusive) of the current year.
        // JS getMonth() is 0-indexed: 0=Jan, 1=Feb, 2=Mar.
        let displayYear = now.getFullYear();
        if (now.getMonth() <= 2) {
          displayYear = displayYear - 1;
        }

        const count = await prisma.invoice.count();
        const prefix = company.invoicePrefix || 'INV';
        const invoiceNumber = `${prefix}-${displayYear}-${(count + 1).toString().padStart(4, '0')}`;

        // B. Calculate Totals from template items
        const items = schedule.templateItems as any[];
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxRate = schedule.taxRate || 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const totalAmount = subtotal + taxAmount;

        // C. Calculate Due Date based on schedule.dueDays
        const dueDays = schedule.dueDays || 30;
        const dueDate = new Date(now.getTime() + dueDays * 24 * 60 * 60 * 1000);

        // D. Create the Invoice Record (with snapshots)
        const newInvoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            clientId: schedule.clientId,
            issueDate: now,
            dueDate: dueDate,
            status: 'DRAFT' as InvoiceStatus,
            currency: schedule.currency || company.currency || 'INR',
            clientSnapshot: {
              name: schedule.client.name,
              email: schedule.client.email,
              address: schedule.client.address,
              taxId: schedule.client.taxId,
              ccEmails: schedule.client.ccEmails,
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
            subtotal,
            taxRate,
            taxAmount,
            totalAmount,
            items: {
              create: items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
              })),
            },
          },
        });

        // E. Trigger the Engine: Generate PDF -> Upload -> Send Email
        await invoiceService.processAndSend(newInvoice.id);

        // F. Calculate Next Run Date
        const nextDate = new Date(schedule.nextRunDate);
        switch (schedule.frequency) {
          case 'WEEKLY':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'MONTHLY':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'QUARTERLY':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'YEARLY':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        // G. Update Schedule
        await prisma.recurringSchedule.update({
          where: { id: schedule.id },
          data: { nextRunDate: nextDate },
        });

        processingResults.push({ id: schedule.id, status: 'success', invoice: invoiceNumber });
      } catch (err: any) {
        console.error(`Error processing schedule ${schedule.id}:`, err);
        processingResults.push({ id: schedule.id, status: 'failed', error: err.message });
      }
    }

    res.json({
      processedCount: dueSchedules.length,
      results: processingResults,
    });
  } catch (error: any) {
    console.error('Automation error:', error);
    res.status(500).json({ error: 'Automation process failed', details: error.message });
  }
});

export default router;
