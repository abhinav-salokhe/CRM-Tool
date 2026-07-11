import prisma from "../lib/prisma.js";
import geminiService from "./gemini.service.js";

// Helper to normalize date strings to ISO-8601 or empty string
function normalizeDate(dateStr) {
  if (!dateStr) return "";
  let s = dateStr.trim();

  // Check if it matches DD-MM-YYYY or DD/MM/YYYY
  const dmyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?)?$/i;
  const match = s.match(dmyRegex);
  if (match) {
    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10) - 1; // 0-indexed
    let year = parseInt(match[3], 10);
    let hours = match[4] ? parseInt(match[4], 10) : 0;
    let minutes = match[5] ? parseInt(match[5], 10) : 0;
    let seconds = match[6] ? parseInt(match[6], 10) : 0;
    const ampm = match[7];

    if (ampm) {
      if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
    }

    const d = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }

  // Fallback to standard date parsing
  let temp = s;
  if (/^\d{4}\/\d{1,2}\/\d{1,2}/.test(s)) {
    temp = s.replace(/\//g, "-");
  }

  const d = new Date(temp);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }

  return "";
}

// Helper to normalize crm status
function normalizeStatus(statusStr) {
  if (!statusStr) return "";
  const s = statusStr.trim().toUpperCase().replace(/[\s\-_/]+/g, "_");

  // Specific mapping rules
  // GOOD_LEAD_FOLLOW_UP
  if (
    s.includes("GOOD_LEAD") ||
    s.includes("FOLLOW") ||
    s.includes("INTEREST")
  ) {
    return "GOOD_LEAD_FOLLOW_UP";
  }

  // SALE_DONE
  if (
    s.includes("SALE") ||
    s.includes("SOLD") ||
    s.includes("CONVERT") ||
    s.includes("CLOSE") ||
    s.includes("WON")
  ) {
    return "SALE_DONE";
  }

  // DID_NOT_CONNECT
  if (
    s.includes("DID_NOT_CONNECT") ||
    s.includes("NO_RESPONSE") ||
    s.includes("BUSY") ||
    s.includes("DIDNT_PICK") ||
    s.includes("NOT_PICK") ||
    s.includes("UNREACHABLE")
  ) {
    return "DID_NOT_CONNECT";
  }

  // BAD_LEAD
  if (
    s.includes("REJECT") ||
    s.includes("BAD_LEAD") ||
    s.includes("SPAM") ||
    s.includes("NOT_INTEREST")
  ) {
    return "BAD_LEAD";
  }

  return "";
}

// Helper to normalize data source
function normalizeDataSource(sourceStr) {
  if (!sourceStr) return "";
  const s = sourceStr.trim().toLowerCase().replace(/[\s\-_]+/g, "");
  const allowed = ["leadsondemand", "meridiantower", "edenpark", "varahswamy", "sarjapurplots"];
  const mapping = {
    "leadsondemand": "leads_on_demand",
    "meridiantower": "meridian_tower",
    "edenpark": "eden_park",
    "varahswamy": "varah_swamy",
    "sarjapurplots": "sarjapur_plots"
  };

  if (mapping[s]) return mapping[s];

  for (const key of allowed) {
    if (s.includes(key) || key.includes(s)) {
      return mapping[key];
    }
  }
  return "";
}

// Email processor: returns { email, updatedNote, isValid, hasEmail }
function processEmails(rawEmail, currentNote) {
  let email = "";
  let updatedNote = currentNote || "";
  let isValid = false;
  let hasEmail = false;

  if (!rawEmail || !rawEmail.trim()) {
    return { email: "", updatedNote, isValid: false, hasEmail: false };
  }

  // Split by common separators
  const emailParts = rawEmail.split(/[\s,;]+/).map(p => p.trim()).filter(Boolean);

  if (emailParts.length === 0) {
    return { email: "", updatedNote, isValid: false, hasEmail: false };
  }

  hasEmail = true;

  const validateSingleEmail = (em) => {
    if (em.startsWith("+")) return false;
    if (em.includes("@@")) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return regex.test(em);
  };

  const validEmails = emailParts.filter(validateSingleEmail);

  if (validEmails.length > 0) {
    email = validEmails[0];
    isValid = true;

    const remaining = emailParts.filter(em => em !== email);
    if (remaining.length > 0) {
      const appendStr = `[Remaining Emails: ${remaining.join(", ")}]`;
      updatedNote = updatedNote ? `${updatedNote} ${appendStr}` : appendStr;
    }
  } else {
    email = "";
    isValid = false;
    const appendStr = `[Invalid Email: ${rawEmail} (Invalid email format)]`;
    updatedNote = updatedNote ? `${updatedNote} ${appendStr}` : appendStr;
  }

  return { email, updatedNote, isValid, hasEmail };
}

// Phone processor: returns { country_code, mobile_without_country_code, updatedNote, isValid, hasPhone }
function processPhones(rawPhone, currentNote) {
  let country_code = "";
  let mobile_without_country_code = "";
  let updatedNote = currentNote || "";
  let isValid = false;
  let hasPhone = false;

  if (!rawPhone || !rawPhone.trim()) {
    return { country_code: "", mobile_without_country_code: "", updatedNote, isValid: false, hasPhone: false };
  }

  hasPhone = true;

  // Split multiple phone numbers
  const phoneParts = rawPhone.split(/[,;&]|\band\b|\/\/+/).map(p => p.trim()).filter(Boolean);

  if (phoneParts.length === 0) {
    return { country_code: "", mobile_without_country_code: "", updatedNote, isValid: false, hasPhone: false };
  }

  const firstPhoneRaw = phoneParts[0];

  // Check for letters
  if (/[a-zA-Z]/.test(firstPhoneRaw)) {
    const appendStr = `[Invalid Phone: ${firstPhoneRaw} (Contains letters)]`;
    updatedNote = updatedNote ? `${updatedNote} ${appendStr}` : appendStr;

    if (phoneParts.length > 1) {
      const remaining = phoneParts.slice(1);
      const remainingStr = `[Remaining Phones: ${remaining.join(", ")}]`;
      updatedNote = `${updatedNote} ${remainingStr}`;
    }
    return { country_code: "", mobile_without_country_code: "", updatedNote, isValid: false, hasPhone };
  }

  const cleanNum = firstPhoneRaw.replace(/[\s\-\(\)\.]/g, '');

  if (cleanNum.length === 0) {
    return { country_code: "", mobile_without_country_code: "", updatedNote, isValid: false, hasPhone };
  }

  if (cleanNum.startsWith("+")) {
    const digitsOnly = cleanNum.slice(1);

    if (digitsOnly.length === 10) {
      country_code = "";
      mobile_without_country_code = digitsOnly;
      isValid = true;
    } else if (digitsOnly.length === 11) {
      if (digitsOnly.startsWith("1")) {
        country_code = "+1";
        mobile_without_country_code = digitsOnly.slice(1);
      } else {
        country_code = "+" + digitsOnly.slice(0, 2);
        mobile_without_country_code = digitsOnly.slice(2);
      }
      isValid = true;
    } else if (digitsOnly.length === 12) {
      country_code = "+" + digitsOnly.slice(0, 2);
      mobile_without_country_code = digitsOnly.slice(2);
      isValid = true;
    } else if (digitsOnly.length === 13) {
      country_code = "+" + digitsOnly.slice(0, 3);
      mobile_without_country_code = digitsOnly.slice(3);
      isValid = true;
    } else {
      if (digitsOnly.length > 10) {
        const ccLen = digitsOnly.length - 10;
        country_code = "+" + digitsOnly.slice(0, ccLen);
        mobile_without_country_code = digitsOnly.slice(ccLen);
      } else {
        country_code = "";
        mobile_without_country_code = digitsOnly;
      }
      isValid = true;
    }
  } else {
    country_code = "";
    mobile_without_country_code = cleanNum;
    isValid = true;
  }

  if (phoneParts.length > 1) {
    const remaining = phoneParts.slice(1);
    const appendStr = `[Remaining Phones: ${remaining.join(", ")}]`;
    updatedNote = updatedNote ? `${updatedNote} ${appendStr}` : appendStr;
  }

  return { country_code, mobile_without_country_code, updatedNote, isValid, hasPhone };
}

class ImportProcessor {
  /**
   * Processes the import job in the background.
   * Splits rows into batches of 50, calls Gemini API with a retry mechanism,
   * writes results (processed leads / skipped records) to the database,
   * and updates job status and progress parameters.
   * 
   * @param {string} importId - The database ID of the ImportJob
   * @param {Array<object>} rawJsonRows - The list of raw rows from the parsed CSV
   */
  async processImportInBackground(importId, rawJsonRows) {
    try {
      // 1. Set status to PROCESSING
      await prisma.importJob.update({
        where: { id: importId },
        data: { status: "PROCESSING" }
      });

      const batchSize = 50; // Required: 50 rows per batch
      const totalRows = rawJsonRows.length;

      // Stats counters to save in DB
      let totalImported = 0;
      let totalSkipped = 0;
      let duplicatesCount = 0;
      let validEmailsCount = 0;
      let invalidEmailsCount = 0;
      let validPhonesCount = 0;
      let invalidPhonesCount = 0;

      // Keep track of seen emails/phones in this import run (intra-file duplicates)
      const seenEmails = new Set();
      const seenPhones = new Set();

      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = rawJsonRows.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const startTime = Date.now();

        let attempts = 0;
        const maxAttempts = 3;
        let aiResults = null;
        let batchStatus = "SUCCESS";
        let errorMessage = null;

        while (attempts < maxAttempts) {
          try {
            attempts++;
            aiResults = await geminiService.extractCRM(batch);

            // Validate schema format - it should be an array matching batch length
            if (!Array.isArray(aiResults) || aiResults.length !== batch.length) {
              throw new Error(`AI returned invalid results. Expected array of length ${batch.length}, got ${aiResults ? (Array.isArray(aiResults) ? aiResults.length : typeof aiResults) : 'null'}`);
            }
            break; // Success!
          } catch (err) {
            console.error(`Attempt ${attempts} failed for batch ${batchNumber}:`, err);
            if (attempts >= maxAttempts) {
              batchStatus = "FAILED";
              errorMessage = err.message || "Failed after maximum retries";
            } else {
              // Exponential backoff before retry (e.g. 2s, 4s)
              await new Promise(res => setTimeout(res, Math.pow(2, attempts) * 1000));
            }
          }
        }

        const processingTimeMs = Date.now() - startTime;

        // Log AI batch attempt inside AIBatch database table
        await prisma.aIBatch.create({
          data: {
            importJobId: importId,
            batchNumber,
            prompt: { batchSize: batch.length, firstRowIndex: i },
            response: aiResults ? aiResults : { error: errorMessage },
            totalRows: batch.length,
            processingTimeMs,
            status: batchStatus
          }
        });

        let numProcessed = 0;
        let numSkipped = 0;

        if (batchStatus === "SUCCESS" && aiResults) {
          const parsedBatch = [];

          for (let j = 0; j < batch.length; j++) {
            const item = aiResults[j];
            const originalRow = batch[j];
            const rowNumber = i + j + 2; // Data row starts at row 2

            // 1. Normalize Date
            const normalizedCreatedAtStr = normalizeDate(item.created_at);
            const parsedDate = normalizedCreatedAtStr ? new Date(normalizedCreatedAtStr) : null;

            // 2. Email Validation
            const emailResult = processEmails(item.email, item.crm_note);
            
            // 3. Phone Validation
            const phoneResult = processPhones(item.mobile_without_country_code, emailResult.updatedNote);

            // 4. CRM Status Normalization
            const crmStatus = normalizeStatus(item.crm_status);

            // 5. Data Source Normalization
            const dataSource = normalizeDataSource(item.data_source);

            // 6. Check Skip Condition (both email and phone empty after normalization/validation)
            const hasNoEmail = !emailResult.email;
            const hasNoPhone = !phoneResult.mobile_without_country_code;

            if (hasNoEmail && hasNoPhone) {
              let skipReason = "Missing both email and phone";
              if (emailResult.hasEmail && !emailResult.isValid && phoneResult.hasPhone && !phoneResult.isValid) {
                skipReason = "Invalid email and phone (Email: Invalid format, Phone: Contains letters)";
              } else if (emailResult.hasEmail && !emailResult.isValid) {
                skipReason = "Invalid email format and missing phone";
              } else if (phoneResult.hasPhone && !phoneResult.isValid) {
                skipReason = "Invalid phone (contains letters) and missing email";
              }

              await prisma.skippedRecord.create({
                data: {
                  importJobId: importId,
                  rowNumber,
                  reason: skipReason,
                  rawData: originalRow
                }
              });
              numSkipped++;
              totalSkipped++;

              // Record emails and phones counts even for skipped rows
              if (emailResult.hasEmail) {
                if (emailResult.isValid) validEmailsCount++; else invalidEmailsCount++;
              }
              if (phoneResult.hasPhone) {
                if (phoneResult.isValid) validPhonesCount++; else invalidPhonesCount++;
              }
              continue;
            }

            // Update email metrics
            if (emailResult.hasEmail) {
              if (emailResult.isValid) validEmailsCount++; else invalidEmailsCount++;
            }
            // Update phone metrics
            if (phoneResult.hasPhone) {
              if (phoneResult.isValid) validPhonesCount++; else invalidPhonesCount++;
            }

            // Create lead candidate object
            const leadCandidate = {
              rowNumber,
              originalRow,
              created_at: parsedDate,
              name: item.name || "",
              email: emailResult.email,
              country_code: phoneResult.country_code,
              mobile_without_country_code: phoneResult.mobile_without_country_code,
              company: item.company || "",
              city: item.city || "",
              state: item.state || "",
              country: item.country || "",
              lead_owner: item.lead_owner || "",
              crm_status: crmStatus,
              crm_note: phoneResult.updatedNote,
              data_source: dataSource,
              possession_time: item.possession_time || "",
              description: item.description || "",
              duplicate: false,
              duplicate_reason: ""
            };

            parsedBatch.push(leadCandidate);
          }

          // Check duplicates for leads in this batch
          const batchEmails = parsedBatch.map(l => l.email).filter(Boolean);
          const batchMobiles = parsedBatch.map(l => l.mobile_without_country_code).filter(Boolean);

          // Find matches in the DB
          const dbMatches = await prisma.processedLead.findMany({
            where: {
              OR: [
                { email: { in: batchEmails, not: "" } },
                { mobile_without_country_code: { in: batchMobiles, not: "" } }
              ]
            },
            select: {
              email: true,
              country_code: true,
              mobile_without_country_code: true
            }
          });

          for (const lead of parsedBatch) {
            let isDuplicate = false;
            let reason = "";

            const emailKey = lead.email;
            const phoneKey = lead.country_code + lead.mobile_without_country_code;

            // Check A: Intra-file duplicates
            if (emailKey && seenEmails.has(emailKey)) {
              isDuplicate = true;
              reason = `Duplicate email "${emailKey}" in current file`;
            } else if (phoneKey && seenPhones.has(phoneKey)) {
              isDuplicate = true;
              reason = `Duplicate phone "${phoneKey}" in current file`;
            }

            // Check B: Database duplicates
            if (!isDuplicate) {
              const dbMatchEmail = dbMatches.find(m => m.email && m.email === lead.email);
              const dbMatchPhone = dbMatches.find(m => 
                m.mobile_without_country_code && 
                m.mobile_without_country_code === lead.mobile_without_country_code && 
                (m.country_code || "") === (lead.country_code || "")
              );

              if (dbMatchEmail) {
                isDuplicate = true;
                reason = `Duplicate email "${lead.email}" already exists in CRM`;
              } else if (dbMatchPhone) {
                isDuplicate = true;
                reason = `Duplicate phone "${lead.country_code}${lead.mobile_without_country_code}" already exists in CRM`;
              }
            }

            if (isDuplicate) {
              lead.duplicate = true;
              lead.duplicate_reason = reason;
              duplicatesCount++;
            }

            // Add to sets
            if (lead.email) seenEmails.add(lead.email);
            if (lead.country_code || lead.mobile_without_country_code) {
              seenPhones.add(lead.country_code + lead.mobile_without_country_code);
            }

            // Write to database
            await prisma.processedLead.create({
              data: {
                importJobId: importId,
                created_at: lead.created_at,
                name: lead.name,
                email: lead.email,
                country_code: lead.country_code,
                mobile_without_country_code: lead.mobile_without_country_code,
                company: lead.company,
                city: lead.city,
                state: lead.state,
                country: lead.country,
                lead_owner: lead.lead_owner,
                crm_status: lead.crm_status,
                crm_note: lead.crm_note,
                data_source: lead.data_source,
                possession_time: lead.possession_time,
                description: lead.description,
                duplicate: lead.duplicate,
                duplicate_reason: lead.duplicate_reason
              }
            });

            numProcessed++;
            totalImported++;
          }
        } else {
          // If batch failed, mark all batch rows as skipped with failure reason
          for (let j = 0; j < batch.length; j++) {
            const originalRow = batch[j];
            const rowNumber = i + j + 2;

            await prisma.skippedRecord.create({
              data: {
                importJobId: importId,
                rowNumber,
                reason: `AI execution failed: ${errorMessage}`,
                rawData: originalRow
              }
            });
            numSkipped++;
            totalSkipped++;
          }
        }

        // Live status increments for progress tracking
        await prisma.importJob.update({
          where: { id: importId },
          data: {
            processedRows: { increment: numProcessed },
            skippedRows: { increment: numSkipped }
          }
        });
      }

      // Mark the job as COMPLETED and store all calculated stats
      await prisma.importJob.update({
        where: { id: importId },
        data: {
          status: "COMPLETED",
          duplicates: duplicatesCount,
          validEmails: validEmailsCount,
          invalidEmails: invalidEmailsCount,
          validPhones: validPhonesCount,
          invalidPhones: invalidPhonesCount
        }
      });

    } catch (err) {
      console.error("Critical error in import processing loop:", err);
      await prisma.importJob.update({
        where: { id: importId },
        data: { status: "FAILED" }
      }).catch(dbErr => console.error("Failed to mark job as FAILED:", dbErr));
    }
  }
}

export default new ImportProcessor();
