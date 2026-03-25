import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { prisma } from './db';
import clientRoutes from './routes/client.routes';
import invoiceRoutes from './routes/invoice.routes';
import recurringRoutes from './routes/recurring.routes';
import profileRoutes from './routes/profile.routes';
import dashboardRoutes from './routes/dashboard.routes';
import authRoutes from './routes/auth.routes';
import { authenticateToken } from './middleware/auth.middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/clients', authenticateToken, clientRoutes);
app.use('/api/invoices', authenticateToken, invoiceRoutes);
app.use('/api/profile', authenticateToken, profileRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// Recurring routes: All routes are protected except /check-recurring
app.use('/api/recurring', (req, res, next) => {
  if (req.path === '/check-recurring') {
    return next();
  }
  return authenticateToken(req, res, next);
}, recurringRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Invoice Generator Service is running' });
});

const frontendPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
}

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  if (req.method === 'GET') {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }

  next();
});

app.use(
  (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    console.error('Server Error:', err.stack);
    const status = err.status || 500;
    const message = err.message || 'Something went wrong!';
    res.status(status).json({ error: message });
  },
);

app.listen(port, () => {
  console.log('Server is running on port ' + port);
});

export { app, prisma };
