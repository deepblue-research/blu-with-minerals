import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { prisma } from "./db";
import clientRoutes from "./routes/client.routes";
import invoiceRoutes from "./routes/invoice.routes";
import recurringRoutes from "./routes/recurring.routes";
import profileRoutes from "./routes/profile.routes";

// Load environment variables
dotenv.config();

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
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Invoice Generator Service is running" });
});

/**
 * Port Handling & Frontend Integration
 * In Cloud Run, the backend and frontend work in tandem on a single port.
 * The backend serves the frontend's static assets (HTML/JS/CSS).
 */
const frontendPath = path.join(__dirname, "../../frontend/dist");

// Debug log to verify frontend path in the container logs
console.log(`Checking frontend assets at: ${frontendPath}`);
if (fs.existsSync(frontendPath)) {
  console.log("Frontend assets found. Serving static files.");
  app.use(express.static(frontendPath));
} else {
  console.warn("WARNING: Frontend dist directory not found. Frontend will not be served.");
}

// SPA catch-all: route all non-API requests to index.html
// Note: Express 5 / path-to-regexp v8 requires the wildcard to be (.*)
app.get("/(.*)", (req: Request, res: Response) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  const indexPath = path.join(frontendPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Frontend application not found. Please ensure the build step completed successfully.");
  }
});

// Basic error handling middleware
app.use(
  (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    console.error("Server Error:", err.stack);
    const status = err.status || 500;
    const message = err.message || "Something went wrong!";
    res.status(status).json({ error: message });
  },
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export { app, prisma };
