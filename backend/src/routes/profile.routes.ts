import { Router } from 'express';
import { prisma } from '../db';
import { EmailService } from '../services/email.service';

const router = Router();
const emailService = new EmailService();

/**
 * GET /api/profile
 * Retrieves the company profile settings.
 * If no profile exists, returns an empty template.
 */
router.get('/', async (req, res) => {
  try {
    const profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      return res.json({
        name: '',
        email: '',
        address: '',
        taxId: '',
        bankDetails: '',
        logoUrl: '',
        currency: 'INR',
        invoicePrefix: 'INV',
        emailSubject: '',
        emailBody: '',
        emailFooterHtml: '',
        ccEmails: ''
      });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch company profile' });
  }
});

/**
 * PATCH /api/profile
 * Updates or initializes the company profile settings.
 */
router.patch('/', async (req, res) => {
  try {
    const { name, email, address, taxId, bankDetails, logoUrl, currency, invoicePrefix, emailSubject, emailBody, emailFooterHtml, ccEmails } = req.body;

    const existingProfile = await prisma.companyProfile.findFirst();

    let profile;
    if (existingProfile) {
      // Update existing record
      profile = await prisma.companyProfile.update({
        where: { id: existingProfile.id },
        data: {
          name: name ?? existingProfile.name,
          email: email ?? existingProfile.email,
          address: address ?? existingProfile.address,
          taxId: taxId !== undefined ? taxId : existingProfile.taxId,
          bankDetails: bankDetails !== undefined ? bankDetails : existingProfile.bankDetails,
          logoUrl: logoUrl !== undefined ? logoUrl : existingProfile.logoUrl,
          currency: currency !== undefined ? currency : existingProfile.currency,
          invoicePrefix: invoicePrefix !== undefined ? invoicePrefix : existingProfile.invoicePrefix,
          emailSubject: emailSubject !== undefined ? emailSubject : existingProfile.emailSubject,
          emailBody: emailBody !== undefined ? emailBody : existingProfile.emailBody,
          emailFooterHtml: emailFooterHtml !== undefined ? emailFooterHtml : existingProfile.emailFooterHtml,
          ccEmails: ccEmails !== undefined ? ccEmails : existingProfile.ccEmails,
        },
      });
    } else {
      // Create new profile if none exists
      profile = await prisma.companyProfile.create({
        data: {
          name: name || '',
          email: email || '',
          address: address || '',
          taxId: taxId || '',
          bankDetails: bankDetails || '',
          logoUrl: logoUrl || '',
          currency: currency || 'INR',
          invoicePrefix: invoicePrefix || 'INV',
          emailSubject: emailSubject || '',
          emailBody: emailBody || '',
          emailFooterHtml: emailFooterHtml || '',
          ccEmails: ccEmails || '',
        },
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update company profile' });
  }
});

/**
 * GET /api/profile/smtp-status
 * Checks if the SMTP environment variables are set and if the connection is valid.
 */
router.get('/smtp-status', async (req, res) => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;

  const isConfigured = !!(host && user && process.env.SMTP_PASS);

  if (!isConfigured) {
    return res.json({ configured: false, verified: false });
  }

  const isVerified = await emailService.verifyConnection();
  res.json({
    configured: true,
    verified: isVerified,
    host,
    user,
    from: process.env.SMTP_FROM
  });
});

/**
 * POST /api/profile/smtp-test
 * Sends a test email using the .env credentials.
 */
router.post('/smtp-test', async (req, res) => {
  const { testEmail } = req.body;
  if (!testEmail) return res.status(400).json({ error: 'Test email address is required' });

  try {
    await emailService.sendEmail({
      to: testEmail,
      subject: 'SMTP Connection Test',
      text: 'Congratulations! Your invoice generator SMTP settings are correctly configured.',
      html: '<h3>Success!</h3><p>Your SMTP settings are working perfectly.</p>'
    });
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send test email' });
  }
});

export default router;
