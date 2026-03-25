import { Router } from 'express';
import { prisma } from '../db';
import { InvoiceStatus } from '@prisma/client';

const router = Router();

/**
 * Helper to calculate percentage change
 */
const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

/**
 * GET /api/dashboard/stats
 * Returns aggregated statistics for the dashboard cards with period-over-period trends
 */
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // 1. Total Sent (Current Month vs Last Month)
    const [sentThisMonth, sentLastMonth] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.OVERDUE] },
          issueDate: { gte: firstDayOfMonth }
        },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where: {
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.OVERDUE] },
          issueDate: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth }
        },
        _sum: { totalAmount: true }
      })
    ]);

    // 2. Paid (This Month vs Last Month)
    const [paidThisMonth, paidLastMonth] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          status: InvoiceStatus.PAID,
          updatedAt: { gte: firstDayOfMonth }
        },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where: {
          status: InvoiceStatus.PAID,
          updatedAt: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth }
        },
        _sum: { totalAmount: true }
      })
    ]);

    // 3. Outstanding (Current vs End of Last Month)
    const [outstandingNow, outstandingLastMonth] = await Promise.all([
      prisma.invoice.aggregate({
        where: { status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] } },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where: {
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] },
          createdAt: { lte: lastDayOfLastMonth }
        },
        _sum: { totalAmount: true }
      })
    ]);

    // 4. Client Count & Upcoming Recurring
    const [activeClientsCount, lastMonthClientsCount, company, upcomingRecurringCount] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { createdAt: { lte: lastDayOfLastMonth } } }),
      prisma.companyProfile.findFirst(),
      prisma.recurringSchedule.count({
        where: {
          isActive: true,
          nextRunDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Aggregate lifetime totals for the cards
    const totalSentLifetime = await prisma.invoice.aggregate({
      where: { status: { in: [InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.OVERDUE] } },
      _sum: { totalAmount: true }
    });

    res.json({
      totalSent: totalSentLifetime._sum.totalAmount || 0,
      totalSentTrend: calculateTrend(sentThisMonth._sum.totalAmount || 0, sentLastMonth._sum.totalAmount || 0),

      paidThisMonth: paidThisMonth._sum.totalAmount || 0,
      paidTrend: calculateTrend(paidThisMonth._sum.totalAmount || 0, paidLastMonth._sum.totalAmount || 0),

      outstanding: outstandingNow._sum.totalAmount || 0,
      outstandingTrend: calculateTrend(outstandingNow._sum.totalAmount || 0, outstandingLastMonth._sum.totalAmount || 0),

      activeClients: activeClientsCount,
      clientsTrend: calculateTrend(activeClientsCount, lastMonthClientsCount),

      upcomingRecurring: upcomingRecurringCount,
      currency: company?.currency || 'INR'
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * GET /api/dashboard/recent-invoices
 * Returns the 5 most recent invoices for the dashboard table
 */
router.get('/recent-invoices', async (req, res) => {
  try {
    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true } }
      }
    });

    const formattedInvoices = recentInvoices.map(invoice => ({
      id: invoice.id,
      number: invoice.invoiceNumber,
      client: invoice.client.name,
      amount: invoice.totalAmount,
      date: invoice.issueDate,
      status: invoice.status,
      currency: invoice.currency
    }));

    res.json(formattedInvoices);
  } catch (error) {
    console.error('Error fetching recent invoices:', error);
    res.status(500).json({ error: 'Failed to fetch recent invoices' });
  }
});

export default router;
