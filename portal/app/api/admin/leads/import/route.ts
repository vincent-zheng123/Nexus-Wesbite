import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/leads/import
 *
 * Accepts a CSV file upload of past leads/clients.
 * Required columns: contactName, contactPhone
 * Optional columns: businessName, contactEmail, location, industry, source, notes
 *
 * The clientId query param scopes the import to a specific client.
 * Admin-only.
 */

interface CsvRow {
  contactName?: string;
  contactPhone?: string;
  businessName?: string;
  contactEmail?: string;
  location?: string;
  industry?: string;
  source?: string;
  notes?: string;
}

// Normalise a phone number to E.164 (+1XXXXXXXXXX) as best-effort.
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

// Parse a raw CSV string into an array of objects keyed by header row.
function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  // Parse a single CSV line respecting quoted fields
  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const headers = parseLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, "")
  );

  // Map common header aliases to canonical field names
  const alias: Record<string, keyof CsvRow> = {
    name: "contactName",
    contactname: "contactName",
    fullname: "contactName",
    firstname: "contactName",
    phone: "contactPhone",
    contactphone: "contactPhone",
    phonenumber: "contactPhone",
    mobile: "contactPhone",
    business: "businessName",
    businessname: "businessName",
    company: "businessName",
    email: "contactEmail",
    contactemail: "contactEmail",
    location: "location",
    city: "location",
    industry: "industry",
    source: "source",
    notes: "notes",
  };

  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: CsvRow = {};
    headers.forEach((header, idx) => {
      const field = alias[header];
      if (field) (row[field] as string) = values[idx] ?? "";
    });
    return row;
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId query param required" }, { status: 400 });
  }

  // Verify the client exists
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Parse multipart form data — expect a single file field named "file"
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
  }

  const text = await (file as File).text();
  const rows = parseCsv(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV is empty or missing header row" }, { status: 422 });
  }

  // Validate: every row must have at least a name or a phone
  const validRows = rows.filter((r) => r.contactName?.trim() || r.contactPhone?.trim());
  const skippedCount = rows.length - validRows.length;

  const results = { inserted: 0, skipped: skippedCount, errors: [] as string[] };

  for (const row of validRows) {
    const phone = row.contactPhone?.trim()
      ? normalizePhone(row.contactPhone.trim())
      : null;

    // Skip rows where phone is present but malformed
    if (row.contactPhone?.trim() && !phone) {
      results.errors.push(
        `Skipped row (invalid phone): ${row.contactName ?? "unnamed"} — "${row.contactPhone}"`
      );
      results.skipped++;
      continue;
    }

    // Deduplicate by phone within this client (if phone provided)
    if (phone) {
      const existing = await prisma.lead.findFirst({
        where: { clientId, contactPhone: phone },
        select: { id: true },
      });
      if (existing) {
        results.skipped++;
        continue;
      }
    }

    try {
      await prisma.lead.create({
        data: {
          clientId,
          contactName: row.contactName?.trim() || null,
          contactPhone: phone,
          contactEmail: row.contactEmail?.trim() || null,
          businessName: row.businessName?.trim() || null,
          location: row.location?.trim() || null,
          industry: row.industry?.trim() || null,
          source: row.source?.trim() || "csv_import",
          status: "NEW",
          dateScraped: new Date(),
        },
      });
      results.inserted++;
    } catch (err) {
      results.errors.push(
        `Failed to insert ${row.contactName ?? "unnamed"}: ${err instanceof Error ? err.message : String(err)}`
      );
      results.skipped++;
    }
  }

  return NextResponse.json({
    success: true,
    totalRows: rows.length,
    inserted: results.inserted,
    skipped: results.skipped,
    errors: results.errors,
  });
}
