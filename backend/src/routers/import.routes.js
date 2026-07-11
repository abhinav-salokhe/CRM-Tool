import express from "express";
import prisma from "../lib/prisma.js";
import processor from "../services/importProcessor.service.js";

const router = express.Router();

router.post("/upload", async (req, res) => {
    const { fileName, rawJsonRows } = req.body; // Sent from frontend parse engine

    if (!Array.isArray(rawJsonRows)) {
        return res.status(400).json({ error: "Invalid layout array format provided." });
    }

    // Set expiration lifetime window to 1 hour
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000);

    const job = await prisma.importJob.create({
        data: {
            fileName: fileName || "unnamed_leads_manifest.csv",
            totalRows: rawJsonRows.length,
            expiresAt: expiryDate,
            status: "PENDING"
        }
    });

    // Clean out old files instantly to avoid memory bloat
    await prisma.importJob.deleteMany({
        where: { expiresAt: { lt: new Date() } }
    });

    return res.status(201).json({
        message: "File meta-registry initialized.",
        importId: job.id,
        preview: rawJsonRows.slice(0, 5) // Return first 5 rows for immediate frontend visual preview
    });
});

router.post("/:importId/process", async (req, res) => {
    const { importId } = req.params;
    const { rawJsonRows } = req.body;

    const job = await prisma.importJob.findUnique({ where: { id: importId } });
    if (!job) return res.status(404).json({ error: "Target import profile timeline not found." });

    processor.processImportInBackground(importId, rawJsonRows);

    return res.status(202).json({
        message: "AI background extraction pipeline started.",
        importId
    });
});

router.get("/:importId/status", async (req, res) => {
    const job = await prisma.importJob.findUnique({
        where: { id: req.params.importId },
        select: {
            id: true,
            status: true,
            totalRows: true,
            processedRows: true,
            skippedRows: true,
            duplicates: true,
            validEmails: true,
            invalidEmails: true,
            validPhones: true,
            invalidPhones: true
        }
    });

    if (!job) return res.status(404).json({ error: "Record not found." });

    const processedSoFar = job.processedRows + job.skippedRows;
    const percentage = job.totalRows > 0 ? Math.round((processedSoFar / job.totalRows) * 100) : 0;

    return res.status(200).json({
        status: job.status,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        skippedRows: job.skippedRows,
        progressPercent: percentage,
        duplicates: job.duplicates,
        validEmails: job.validEmails,
        invalidEmails: job.invalidEmails,
        validPhones: job.validPhones,
        invalidPhones: job.invalidPhones
    });
});


router.get("/:importId/leads", async (req, res) => {
    const leads = await prisma.processedLead.findMany({
        where: { importJobId: req.params.importId },
        orderBy: { createdAt: "asc" }
    });

    const formattedLeads = leads.map(lead => ({
        created_at: lead.created_at ? lead.created_at.toISOString() : "",
        name: lead.name || "",
        email: lead.email || "",
        country_code: lead.country_code || "",
        mobile_without_country_code: lead.mobile_without_country_code || "",
        company: lead.company || "",
        city: lead.city || "",
        state: lead.state || "",
        country: lead.country || "",
        lead_owner: lead.lead_owner || "",
        crm_status: lead.crm_status || "",
        crm_note: lead.crm_note || "",
        data_source: lead.data_source || "",
        possession_time: lead.possession_time || "",
        description: lead.description || "",
        id: lead.id,
        duplicate: lead.duplicate,
        duplicate_reason: lead.duplicate_reason || ""
    }));

    return res.status(200).json(formattedLeads);
});


router.get("/:importId/skipped", async (req, res) => {
    const skips = await prisma.skippedRecord.findMany({
        where: { importJobId: req.params.importId },
        orderBy: { rowNumber: "asc" }
    });
    return res.status(200).json(skips);
});

router.get("/:importId/summary", async (req, res) => {
    const job = await prisma.importJob.findUnique({
        where: { id: req.params.importId }
    });
    if (!job) return res.status(404).json({ error: "Record not found." });

    const leads = await prisma.processedLead.findMany({
        where: { importJobId: req.params.importId },
        orderBy: { createdAt: "asc" }
    });

    const formattedLeads = leads.map(lead => ({
        created_at: lead.created_at ? lead.created_at.toISOString() : "",
        name: lead.name || "",
        email: lead.email || "",
        country_code: lead.country_code || "",
        mobile_without_country_code: lead.mobile_without_country_code || "",
        company: lead.company || "",
        city: lead.city || "",
        state: lead.state || "",
        country: lead.country || "",
        lead_owner: lead.lead_owner || "",
        crm_status: lead.crm_status || "",
        crm_note: lead.crm_note || "",
        data_source: lead.data_source || "",
        possession_time: lead.possession_time || "",
        description: lead.description || "",
        id: lead.id,
        duplicate: lead.duplicate,
        duplicate_reason: lead.duplicate_reason || ""
    }));

    const skipped = await prisma.skippedRecord.findMany({
        where: { importJobId: req.params.importId },
        orderBy: { rowNumber: "asc" }
    });

    return res.status(200).json({
        summary: {
            uploaded: job.totalRows,
            imported: job.processedRows,
            skipped: job.skippedRows,
            duplicates: job.duplicates,
            validEmails: job.validEmails,
            invalidEmails: job.invalidEmails,
            validPhones: job.validPhones,
            invalidPhones: job.invalidPhones
        },
        parsedRecords: formattedLeads,
        skippedRecords: skipped
    });
});


router.get("/:importId", async (req, res) => {
    const job = await prisma.importJob.findUnique({
        where: { id: req.params.importId }
    });
    if (!job) return res.status(404).json({ error: "Record not found." });
    return res.status(200).json(job);
});

router.get("/", async (req, res) => {
    try {
        const jobs = await prisma.importJob.findMany({
            orderBy: { createdAt: "desc" }
        });
        return res.status(200).json(jobs);
    } catch (error) {
        console.error("Failed to list import jobs:", error);
        return res.status(500).json({ error: "Failed to list import jobs." });
    }
});

router.delete("/:importId", async (req, res) => {
    try {
        const { importId } = req.params;
        const job = await prisma.importJob.findUnique({
            where: { id: importId }
        });
        if (!job) {
            return res.status(404).json({ error: "Import job not found." });
        }
        await prisma.importJob.delete({
            where: { id: importId }
        });
        return res.status(200).json({ message: "Import job and all related data successfully deleted." });
    } catch (error) {
        console.error("Failed to delete import job:", error);
        return res.status(500).json({ error: "Failed to delete import job." });
    }
});

export default router;