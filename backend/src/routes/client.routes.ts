import { Router } from "express";
import { prisma } from "../db";

const router = Router();

/**
 * GET /api/clients
 * Returns a list of all clients, sorted by name.
 */
router.get("/", async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    });
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

/**
 * POST /api/clients
 * Creates a new client in the database.
 */
router.post("/", async (req, res) => {
  const { name, email, address, taxId, notes, ccEmails } = req.body;

  if (!name || !email || !address) {
    return res
      .status(400)
      .json({ error: "Name, email, and billing address are required" });
  }

  try {
    const client = await prisma.client.create({
      data: {
        name,
        email,
        address,
        taxId,
        notes,
        ccEmails,
      },
    });
    res.status(201).json(client);
  } catch (error: any) {
    console.error("Error creating client:", error);
    // Handle unique constraint violation for email
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "A client with this email address already exists" });
    }
    res.status(500).json({ error: "Failed to create client" });
  }
});

/**
 * GET /api/clients/:id
 * Returns detailed information for a single client, including recent invoices.
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { issueDate: "desc" },
          take: 10,
        },
        recurringSchedules: {
          where: { isActive: true },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    console.error("Error fetching client details:", error);
    res.status(500).json({ error: "Failed to fetch client details" });
  }
});

/**
 * PATCH /api/clients/:id
 * Updates specific fields of a client.
 */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, address, taxId, notes, ccEmails } = req.body;

  try {
    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        email,
        address,
        taxId,
        notes,
        ccEmails,
      },
    });
    res.json(client);
  } catch (error: any) {
    console.error("Error updating client:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Client not found" });
    }
    res.status(500).json({ error: "Failed to update client" });
  }
});

/**
 * DELETE /api/clients/:id
 * Removes a client from the database.
 * Note: Database constraints may prevent deletion if client has invoices.
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.client.delete({
      where: { id },
    });
    res.json({ message: "Client deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting client:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Client not found" });
    }
    // Generic foreign key constraint error check
    if (error.code === "P2003") {
      return res.status(400).json({
        error:
          "Cannot delete client because they have associated invoices or schedules. Try archiving them instead.",
      });
    }
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;
