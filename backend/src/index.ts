import dotenv from "dotenv";
// Load environment variables as the very first step
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma } from "./db";
import clientRoutes from "./routes/client.routes";
import invoiceRoutes from "./routes/invoice.routes";
import recurringRoutes from "./routes/recurring.routes";
import profileRoutes from "./routes/profile.routes";
import path from "path";

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/profile", profileRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Invoice Generator Service is running" });
});

// Serve frontend static files
const frontendPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendPath));

// SPA catch-all: route all non-API requests to index.html
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Basic error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack);
    const status = err.status || 500;
    const message = err.message || "Something went wrong!";
    res.status(status).json({ error: message });
  },
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export { app, prisma };
