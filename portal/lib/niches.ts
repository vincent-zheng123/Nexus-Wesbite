/**
 * Niche configuration — single source of truth for Dental, Roofing, HVAC.
 *
 * Drives:
 *   - Vapi assistant system prompt (what to ask during the call)
 *   - Vapi analysisPlan.structuredDataSchema (what to extract post-call)
 *   - CRM UI (how to label and render qualificationData JSONB per business type)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldType = "boolean" | "string" | "number" | "enum";

export interface NicheField {
  key: string;
  label: string;
  type: FieldType;
  description: string;           // passed to Vapi structuredDataSchema as description
  enumValues?: string[];         // only set when type === "enum"
  askPrompt: string;             // natural-language question for the assistant to ask
}

export interface NicheDisplayField {
  key: string;
  label: string;
  type: FieldType;
  enumValues?: string[];
  format?: (val: unknown) => string; // optional custom formatter
}

// ─── Dental ──────────────────────────────────────────────────────────────────

export const DENTAL_FIELDS: NicheField[] = [
  {
    key: "isNewPatient",
    label: "New Patient?",
    type: "boolean",
    description: "Whether the caller is a new patient or existing patient",
    askPrompt: "Are you a new patient with us or have you visited before?",
  },
  {
    key: "insuranceProvider",
    label: "Insurance Provider",
    type: "string",
    description: "Name of the caller's dental insurance provider, or 'none' / 'self-pay'",
    askPrompt: "What dental insurance do you have, or will you be paying out of pocket?",
  },
  {
    key: "procedureType",
    label: "Procedure Type",
    type: "enum",
    description: "Type of dental procedure the caller is inquiring about",
    enumValues: ["cleaning", "checkup", "emergency", "cosmetic", "orthodontic", "other"],
    askPrompt: "What brings you in today — is this for a cleaning, checkup, something more urgent, or something else?",
  },
  {
    key: "urgency",
    label: "Urgency",
    type: "enum",
    description: "How urgent the caller's need is",
    enumValues: ["routine", "urgent", "emergency"],
    askPrompt: "Is this something you'd like to schedule at your convenience, or is it more urgent?",
  },
];

// ─── Roofing ─────────────────────────────────────────────────────────────────

export const ROOFING_FIELDS: NicheField[] = [
  {
    key: "city",
    label: "City",
    type: "string",
    description: "City of the property that needs roofing work",
    askPrompt: "What city is the property in?",
  },
  {
    key: "state",
    label: "State",
    type: "string",
    description: "State abbreviation of the property (e.g. MA, CA)",
    askPrompt: "And what state?",
  },
  {
    key: "zip",
    label: "ZIP Code",
    type: "string",
    description: "ZIP code of the property",
    askPrompt: "What's the ZIP code?",
  },
  {
    key: "propertyType",
    label: "Property Type",
    type: "enum",
    description: "Whether the property is residential or commercial",
    enumValues: ["residential", "commercial"],
    askPrompt: "Is this a residential home or a commercial property?",
  },
  {
    key: "serviceType",
    label: "Service Type",
    type: "enum",
    description: "Type of roofing service needed",
    enumValues: ["repair", "replacement", "inspection", "new_install"],
    askPrompt: "Are you looking for a repair, a full replacement, an inspection, or a new installation?",
  },
  {
    key: "stormDamage",
    label: "Storm/Hail Damage?",
    type: "boolean",
    description: "Whether the roofing issue is related to storm or hail damage",
    askPrompt: "Is this damage related to a recent storm or hail event?",
  },
  {
    key: "roofAge",
    label: "Roof Age (years)",
    type: "number",
    description: "Approximate age of the current roof in years",
    askPrompt: "Do you have any idea how old the current roof is, roughly?",
  },
  {
    key: "urgency",
    label: "Urgency",
    type: "enum",
    description: "How urgent the roofing work is needed",
    enumValues: ["routine", "urgent", "emergency_leak"],
    askPrompt: "Is this something that can wait a few weeks, or is it more urgent — like an active leak?",
  },
];

// ─── HVAC ────────────────────────────────────────────────────────────────────

export const HVAC_FIELDS: NicheField[] = [
  {
    key: "city",
    label: "City",
    type: "string",
    description: "City where HVAC service is needed",
    askPrompt: "What city is the service location in?",
  },
  {
    key: "state",
    label: "State",
    type: "string",
    description: "State abbreviation (e.g. MA, CA)",
    askPrompt: "And what state?",
  },
  {
    key: "zip",
    label: "ZIP Code",
    type: "string",
    description: "ZIP code of the service location",
    askPrompt: "What's the ZIP code?",
  },
  {
    key: "serviceType",
    label: "Service Type",
    type: "enum",
    description: "Type of HVAC service needed",
    enumValues: ["repair", "installation", "maintenance", "emergency"],
    askPrompt: "Are you looking for a repair, a new installation, routine maintenance, or is this an emergency?",
  },
  {
    key: "unitType",
    label: "Unit Type",
    type: "string",
    description: "Type of HVAC system (e.g. central air, mini-split, heat pump, furnace)",
    askPrompt: "What type of system is it — central air, a mini-split, heat pump, furnace?",
  },
  {
    key: "unitAge",
    label: "Unit Age (years)",
    type: "number",
    description: "Approximate age of the HVAC unit in years",
    askPrompt: "Roughly how old is the unit?",
  },
  {
    key: "urgency",
    label: "Urgency",
    type: "enum",
    description: "How urgent the HVAC service is",
    enumValues: ["routine", "urgent", "no_heat", "no_cool"],
    askPrompt: "Is this routine, or is it more urgent — like no heat or no cooling right now?",
  },
];

// ─── Medical ─────────────────────────────────────────────────────────────────

export const MEDICAL_FIELDS: NicheField[] = [
  {
    key: "isNewPatient",
    label: "New Patient?",
    type: "boolean",
    description: "Whether the caller is a new or existing patient",
    askPrompt: "Are you a new patient with us or have you visited before?",
  },
  {
    key: "insuranceProvider",
    label: "Insurance Provider",
    type: "string",
    description: "Name of the caller's medical insurance provider, or 'none' / 'self-pay'",
    askPrompt: "What insurance do you have, or will you be paying out of pocket?",
  },
  {
    key: "reasonForVisit",
    label: "Reason for Visit",
    type: "string",
    description: "Brief description of why the caller wants to be seen",
    askPrompt: "Can you tell me briefly what brings you in — what you'd like to be seen for?",
  },
  {
    key: "urgency",
    label: "Urgency",
    type: "enum",
    description: "How urgent the medical need is",
    enumValues: ["routine", "urgent", "emergency"],
    askPrompt: "Is this something you'd like to schedule at your convenience, or is it more urgent?",
  },
];

// ─── Legal ───────────────────────────────────────────────────────────────────

export const LEGAL_FIELDS: NicheField[] = [
  {
    key: "caseType",
    label: "Case Type",
    type: "enum",
    description: "Type of legal matter the caller is inquiring about",
    enumValues: ["personal_injury", "family_law", "criminal", "business", "estate", "immigration", "other"],
    askPrompt: "To make sure we connect you with the right attorney — can you give me a brief idea of what type of legal matter this is?",
  },
  {
    key: "isNewClient",
    label: "New Client?",
    type: "boolean",
    description: "Whether the caller is a new or existing client of the firm",
    askPrompt: "Have you worked with our firm before, or is this your first time reaching out?",
  },
  {
    key: "urgency",
    label: "Urgency",
    type: "enum",
    description: "How time-sensitive the legal matter is",
    enumValues: ["routine", "time_sensitive", "emergency"],
    askPrompt: "Is this something that needs to be addressed urgently, or can it be scheduled at a normal pace?",
  },
  {
    key: "referredBy",
    label: "Referred By",
    type: "string",
    description: "How the caller found or was referred to the firm",
    askPrompt: "How did you hear about us?",
  },
];

// ─── Plumbing ─────────────────────────────────────────────────────────────────

export const PLUMBING_FIELDS: NicheField[] = [
  {
    key: "city",
    label: "City",
    type: "string",
    description: "City where plumbing service is needed",
    askPrompt: "What city is the service location in?",
  },
  {
    key: "state",
    label: "State",
    type: "string",
    description: "State abbreviation (e.g. MA, CA)",
    askPrompt: "And what state?",
  },
  {
    key: "zip",
    label: "ZIP Code",
    type: "string",
    description: "ZIP code of the service location",
    askPrompt: "What's the ZIP code?",
  },
  {
    key: "serviceType",
    label: "Service Type",
    type: "enum",
    description: "Type of plumbing service needed",
    enumValues: ["repair", "installation", "inspection", "drain_cleaning", "emergency"],
    askPrompt: "Are you looking for a repair, a new installation, drain cleaning, an inspection, or is this an emergency?",
  },
  {
    key: "issueDescription",
    label: "Issue Description",
    type: "string",
    description: "Brief description of the plumbing issue",
    askPrompt: "Can you give me a quick description of what's going on?",
  },
  {
    key: "urgency",
    label: "Urgency",
    type: "enum",
    description: "How urgent the plumbing issue is",
    enumValues: ["routine", "urgent", "no_water", "flooding"],
    askPrompt: "Is this something that can wait, or is it more urgent — like no water or active flooding?",
  },
];

// ─── Salon / Spa ──────────────────────────────────────────────────────────────

export const SALON_SPA_FIELDS: NicheField[] = [
  {
    key: "serviceType",
    label: "Service Type",
    type: "enum",
    description: "Type of salon or spa service the caller is requesting",
    enumValues: ["haircut", "color", "highlights", "blowout", "facial", "massage", "nails", "waxing", "other"],
    askPrompt: "What service are you looking to book?",
  },
  {
    key: "isNewClient",
    label: "New Client?",
    type: "boolean",
    description: "Whether the caller is a new or returning client",
    askPrompt: "Have you been in to see us before, or is this your first visit?",
  },
  {
    key: "stylistPreference",
    label: "Stylist / Staff Preference",
    type: "string",
    description: "Whether the caller has a preferred stylist or staff member",
    askPrompt: "Do you have a preference for a specific stylist, or are you open to whoever's available?",
  },
];

// ─── Auto Repair ──────────────────────────────────────────────────────────────

export const AUTO_REPAIR_FIELDS: NicheField[] = [
  {
    key: "vehicleMake",
    label: "Vehicle Make",
    type: "string",
    description: "Make of the vehicle needing service (e.g. Toyota, Ford, BMW)",
    askPrompt: "What's the make of the vehicle — like Toyota, Ford, BMW?",
  },
  {
    key: "vehicleModel",
    label: "Vehicle Model",
    type: "string",
    description: "Model of the vehicle (e.g. Camry, F-150, X5)",
    askPrompt: "And the model?",
  },
  {
    key: "vehicleYear",
    label: "Vehicle Year",
    type: "string",
    description: "Year of the vehicle",
    askPrompt: "What year is it?",
  },
  {
    key: "serviceType",
    label: "Service Type",
    type: "enum",
    description: "Type of auto repair or maintenance needed",
    enumValues: ["oil_change", "brake_service", "tire_service", "transmission", "engine", "diagnostic", "ac_heat", "other"],
    askPrompt: "What brings the car in — oil change, brakes, tires, something else?",
  },
  {
    key: "urgency",
    label: "Urgency",
    type: "enum",
    description: "How urgent the vehicle issue is",
    enumValues: ["routine", "urgent", "breakdown"],
    askPrompt: "Is this routine maintenance, or is the car having trouble right now?",
  },
];

// ─── Veterinary ───────────────────────────────────────────────────────────────

export const VETERINARY_FIELDS: NicheField[] = [
  {
    key: "petType",
    label: "Pet Type",
    type: "enum",
    description: "Type of pet being brought in",
    enumValues: ["dog", "cat", "bird", "reptile", "small_animal", "other"],
    askPrompt: "What type of pet are you bringing in?",
  },
  {
    key: "petName",
    label: "Pet Name",
    type: "string",
    description: "Name of the pet",
    askPrompt: "What's your pet's name?",
  },
  {
    key: "isNewPatient",
    label: "New Patient?",
    type: "boolean",
    description: "Whether this pet has been seen at the clinic before",
    askPrompt: "Has your pet been seen with us before, or is this their first visit?",
  },
  {
    key: "reasonForVisit",
    label: "Reason for Visit",
    type: "string",
    description: "Why the pet is being brought in",
    askPrompt: "What's bringing them in today?",
  },
  {
    key: "urgency",
    label: "Urgency",
    type: "enum",
    description: "How urgent the pet's condition is",
    enumValues: ["routine", "urgent", "emergency"],
    askPrompt: "Is this a routine visit or is your pet showing signs that need attention sooner?",
  },
];

// ─── Master registry ─────────────────────────────────────────────────────────

export const NICHE_INTEL_FIELDS: Record<string, NicheField[]> = {
  DENTAL: DENTAL_FIELDS,
  ROOFING: ROOFING_FIELDS,
  HVAC: HVAC_FIELDS,
  MEDICAL: MEDICAL_FIELDS,
  LEGAL: LEGAL_FIELDS,
  PLUMBING: PLUMBING_FIELDS,
  SALON_SPA: SALON_SPA_FIELDS,
  AUTO_REPAIR: AUTO_REPAIR_FIELDS,
  VETERINARY: VETERINARY_FIELDS,
};

// ─── Vapi structuredDataSchema ────────────────────────────────────────────────

export function buildVapiSchema(fields: NicheField[]): object {
  const properties: Record<string, object> = {};

  for (const field of fields) {
    if (field.type === "boolean") {
      properties[field.key] = {
        type: "boolean",
        description: field.description,
      };
    } else if (field.type === "number") {
      properties[field.key] = {
        type: "number",
        description: field.description,
      };
    } else if (field.type === "enum" && field.enumValues) {
      properties[field.key] = {
        type: "string",
        enum: field.enumValues,
        description: field.description,
      };
    } else {
      properties[field.key] = {
        type: "string",
        description: field.description,
      };
    }
  }

  // Always include outcome and callerName — these are core, not niche-specific
  properties["outcome"] = {
    type: "string",
    enum: [
      "appointment_booked",
      "appointment_changed",
      "appointment_cancelled",
      "callback_requested",
      "faq_only",
      "not_interested",
      "no_answer",
      "wrong_number",
    ],
    description: "The result of this call",
  };
  properties["callerName"] = {
    type: "string",
    description: "The caller's full name if they provided it",
  };
  properties["appointmentTime"] = {
    type: "string",
    description: "ISO 8601 datetime string if an appointment was booked or changed, otherwise omit",
  };

  return {
    type: "object",
    properties,
  };
}

export const NICHE_VAPI_STRUCTURED_SCHEMA: Record<string, object> = {
  DENTAL: buildVapiSchema(DENTAL_FIELDS),
  ROOFING: buildVapiSchema(ROOFING_FIELDS),
  HVAC: buildVapiSchema(HVAC_FIELDS),
  MEDICAL: buildVapiSchema(MEDICAL_FIELDS),
  LEGAL: buildVapiSchema(LEGAL_FIELDS),
  PLUMBING: buildVapiSchema(PLUMBING_FIELDS),
  SALON_SPA: buildVapiSchema(SALON_SPA_FIELDS),
  AUTO_REPAIR: buildVapiSchema(AUTO_REPAIR_FIELDS),
  VETERINARY: buildVapiSchema(VETERINARY_FIELDS),
};

// ─── Vapi system prompt addon ─────────────────────────────────────────────────

export const NICHE_SYSTEM_PROMPT_ADDON: Record<string, string> = {
  MEDICAL: `
INTEL GATHERING — MEDICAL:
During the conversation, naturally collect the following information before offering to book:
- Whether they are a new or existing patient
- Their medical insurance provider (or if self-pay)
- The reason for their visit (brief description is fine)
- How urgent it is (routine, urgent, or emergency)

Ask these questions conversationally, not as a checklist. If a caller volunteers the info, do not re-ask.
After gathering this intel, proceed to offer available appointment times.
`,

  LEGAL: `
INTEL GATHERING — LEGAL:
During the conversation, naturally collect the following information before scheduling a consultation:
- What type of legal matter they are calling about (personal injury, family law, criminal, business, estate, immigration, or other)
- Whether they are a new or existing client
- How time-sensitive the matter is
- How they heard about the firm

Ask these questions conversationally, not as a checklist. Be sensitive — callers may be in difficult situations.
After gathering this intel, proceed to schedule a consultation with the appropriate attorney.
`,

  PLUMBING: `
INTEL GATHERING — PLUMBING:
During the conversation, naturally collect the following information before scheduling service:
- The service address
- What type of service they need (repair, installation, drain cleaning, inspection, or emergency)
- A brief description of the issue
- How urgent it is — especially if there is active flooding or no water

Ask these questions conversationally, not as a checklist. If flooding or no water, treat as emergency priority.
After gathering this intel, proceed to schedule a service appointment.
`,

  SALON_SPA: `
INTEL GATHERING — SALON/SPA:
During the conversation, naturally collect the following information before booking:
- What service they are looking for
- Whether they are a new or returning client
- Whether they have a preferred stylist or staff member

Ask these questions conversationally, not as a checklist. Keep the tone warm and inviting.
After gathering this intel, proceed to find available appointment times.
`,

  AUTO_REPAIR: `
INTEL GATHERING — AUTO REPAIR:
During the conversation, naturally collect the following information before scheduling:
- Vehicle make, model, and year
- What service or issue they need addressed
- How urgent it is — especially if the vehicle is not driveable

Ask these questions conversationally, not as a checklist. If the vehicle broke down, treat as high priority.
After gathering this intel, proceed to schedule a service appointment.
`,

  VETERINARY: `
INTEL GATHERING — VETERINARY:
During the conversation, naturally collect the following information before booking:
- Type of pet and their name
- Whether this pet has been seen at the clinic before
- The reason for the visit
- How urgent it is — especially if the pet is showing signs of distress

Ask these questions conversationally, not as a checklist. If the pet sounds like they are in distress, treat as urgent and escalate.
After gathering this intel, proceed to schedule an appointment.
`,

  DENTAL: `
INTEL GATHERING — DENTAL:
During the conversation, naturally collect the following information before offering to book:
- Whether they are a new or existing patient
- Their dental insurance provider (or if self-pay)
- What they're coming in for (cleaning, checkup, emergency, cosmetic, orthodontic, other)
- How urgent it is (routine, urgent, or emergency)

Ask these questions conversationally, not as a checklist. If a caller volunteers the info, do not re-ask.
After gathering this intel, proceed to offer available appointment times.
`,

  ROOFING: `
INTEL GATHERING — ROOFING:
During the conversation, naturally collect the following information before offering to schedule an estimate:
- The property address
- Whether it's residential or commercial
- What service they need (repair, replacement, inspection, new installation)
- Whether the damage is storm or hail related
- Roughly how old the roof is
- How urgent it is (routine, urgent, or active leak/emergency)

Ask these questions conversationally, not as a checklist. Getting the address is important for routing the right crew.
After gathering this intel, proceed to schedule a free estimate appointment.
`,

  HVAC: `
INTEL GATHERING — HVAC:
During the conversation, naturally collect the following information before offering to schedule service:
- The service address
- Whether this is a repair, new installation, maintenance, or emergency
- What type of system they have (central air, mini-split, heat pump, furnace, etc.)
- Roughly how old the unit is
- How urgent it is (routine, urgent, no heat, or no cooling)

Ask these questions conversationally, not as a checklist. If no heat or no cool, treat as priority.
After gathering this intel, proceed to schedule a service appointment.
`,
};

// ─── CRM display config ───────────────────────────────────────────────────────

function formatBoolean(val: unknown): string {
  if (val === true || val === "true") return "Yes";
  if (val === false || val === "false") return "No";
  return "—";
}

function formatEnum(val: unknown): string {
  if (!val) return "—";
  return String(val).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface NicheDisplayField {
  key: string;
  label: string;
  type: FieldType;
  render: (val: unknown) => string;
}

export const NICHE_DISPLAY_CONFIG: Record<string, NicheDisplayField[]> = {
  DENTAL: DENTAL_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    render: (val: unknown) => {
      if (val === null || val === undefined) return "—";
      if (f.type === "boolean") return formatBoolean(val);
      if (f.type === "enum") return formatEnum(val);
      return String(val);
    },
  })),

  ROOFING: ROOFING_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    render: (val: unknown) => {
      if (val === null || val === undefined) return "—";
      if (f.type === "boolean") return formatBoolean(val);
      if (f.type === "enum") return formatEnum(val);
      if (f.type === "number") return `${val} yrs`;
      return String(val);
    },
  })),

  HVAC: HVAC_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    render: (val: unknown) => {
      if (val === null || val === undefined) return "—";
      if (f.type === "boolean") return formatBoolean(val);
      if (f.type === "enum") return formatEnum(val);
      if (f.type === "number") return `${val} yrs`;
      return String(val);
    },
  })),

  MEDICAL: MEDICAL_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    render: (val: unknown) => {
      if (val === null || val === undefined) return "—";
      if (f.type === "boolean") return formatBoolean(val);
      if (f.type === "enum") return formatEnum(val);
      return String(val);
    },
  })),

  LEGAL: LEGAL_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    render: (val: unknown) => {
      if (val === null || val === undefined) return "—";
      if (f.type === "boolean") return formatBoolean(val);
      if (f.type === "enum") return formatEnum(val);
      return String(val);
    },
  })),

  PLUMBING: PLUMBING_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    render: (val: unknown) => {
      if (val === null || val === undefined) return "—";
      if (f.type === "boolean") return formatBoolean(val);
      if (f.type === "enum") return formatEnum(val);
      return String(val);
    },
  })),

  SALON_SPA: SALON_SPA_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    render: (val: unknown) => {
      if (val === null || val === undefined) return "—";
      if (f.type === "boolean") return formatBoolean(val);
      if (f.type === "enum") return formatEnum(val);
      return String(val);
    },
  })),

  AUTO_REPAIR: AUTO_REPAIR_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    render: (val: unknown) => {
      if (val === null || val === undefined) return "—";
      if (f.type === "boolean") return formatBoolean(val);
      if (f.type === "enum") return formatEnum(val);
      return String(val);
    },
  })),

  VETERINARY: VETERINARY_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    render: (val: unknown) => {
      if (val === null || val === undefined) return "—";
      if (f.type === "boolean") return formatBoolean(val);
      if (f.type === "enum") return formatEnum(val);
      return String(val);
    },
  })),
};

// ─── Async DB-backed functions (runtime layer) ────────────────────────────────

import { prisma } from "@/lib/prisma";

/**
 * Fetch a single active template from the database by slug.
 * Returns null if not found or inactive.
 */
export async function getNicheTemplate(slug: string): Promise<{
  slug: string;
  displayName: string;
  fieldDefinitions: NicheField[];
  systemPromptAddon: string;
  structuredDataSchema: object;
} | null> {
  const template = await prisma.businessTypeTemplate.findUnique({
    where: { slug, isActive: true },
  });
  if (!template) return null;
  return {
    slug: template.slug,
    displayName: template.displayName,
    fieldDefinitions: template.fieldDefinitions as unknown as NicheField[],
    systemPromptAddon: template.systemPromptAddon,
    structuredDataSchema: template.structuredDataSchema as unknown as object,
  };
}

/**
 * Fetch all active templates — used by admin onboarding form dropdown.
 */
export async function getAllNicheTemplates(): Promise<
  { slug: string; displayName: string }[]
> {
  return prisma.businessTypeTemplate.findMany({
    where: { isActive: true },
    select: { slug: true, displayName: true },
    orderBy: { displayName: "asc" },
  });
}

/**
 * Get display fields from DB for rendering qualificationData in the CRM UI.
 */
export async function getNicheDisplayFields(
  slug: string
): Promise<NicheDisplayField[]> {
  const template = await getNicheTemplate(slug);
  if (!template) return [];
  return template.fieldDefinitions.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    render: (val: unknown): string => {
      if (val === null || val === undefined) return "—";
      if (f.type === "boolean") return formatBoolean(val);
      if (f.type === "enum") return formatEnum(val);
      if (f.type === "number") return `${val} yrs`;
      return String(val);
    },
  }));
}

// ─── Owner booking notification SMS ──────────────────────────────────────────

function buildServiceDetail(
  industry: string | null,
  data: Record<string, unknown>
): string | null {
  const fmt = (v: unknown): string | null =>
    v != null ? String(v).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;
  const parts = (...vals: (string | null | undefined)[]) =>
    vals.filter(Boolean).join(" · ") || null;

  switch ((industry ?? "").toUpperCase()) {
    case "DENTAL":
      return parts(fmt(data.procedureType), data.isNewPatient === true ? "New patient" : null);
    case "ROOFING":
      return parts(fmt(data.serviceType), fmt(data.propertyType), data.stormDamage === true ? "Storm damage" : null);
    case "HVAC":
      return parts(fmt(data.serviceType), fmt(data.unitType));
    case "MEDICAL":
      return data.reasonForVisit ? String(data.reasonForVisit) : null;
    case "LEGAL":
      return parts(fmt(data.caseType), data.isNewClient === true ? "New client" : null);
    case "PLUMBING": {
      const desc = data.issueDescription ? String(data.issueDescription) : null;
      return parts(fmt(data.serviceType), desc);
    }
    case "SALON_SPA":
      return fmt(data.serviceType);
    case "AUTO_REPAIR": {
      const vehicle = [data.vehicleYear, data.vehicleMake, data.vehicleModel].filter(Boolean).join(" ") || null;
      return parts(vehicle, fmt(data.serviceType));
    }
    case "VETERINARY": {
      const pet = [data.petName, data.petType ? `the ${fmt(data.petType)}` : null].filter(Boolean).join(" ") || null;
      return parts(pet, data.reasonForVisit ? String(data.reasonForVisit) : null);
    }
    default:
      return null;
  }
}

export type BookingEventType = "booked" | "rescheduled" | "cancelled";

const EVENT_HEADER: Record<BookingEventType, string> = {
  booked: "New booking at",
  rescheduled: "Appointment rescheduled at",
  cancelled: "Appointment cancelled at",
};

/**
 * Builds the SMS body sent to the business owner for booking events.
 */
export function buildOwnerNotificationSms(params: {
  eventType: BookingEventType;
  businessName: string;
  callerName: string | null;
  callerPhone: string;
  appointmentTime: string | null;
  timezone: string | null;
  industry: string | null;
  structured: Record<string, unknown>;
}): string {
  const { eventType, businessName, callerName, callerPhone, appointmentTime, timezone, industry, structured } = params;

  const caller = callerName ? `${callerName} (${callerPhone})` : callerPhone;

  let whenLine = "";
  if (appointmentTime) {
    try {
      whenLine = new Date(appointmentTime).toLocaleString("en-US", {
        timeZone: timezone ?? "America/New_York",
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      whenLine = appointmentTime;
    }
  }

  const serviceDetail = eventType !== "cancelled" ? buildServiceDetail(industry, structured) : null;

  return [
    `${EVENT_HEADER[eventType]} ${businessName}`,
    `Caller: ${caller}`,
    ...(serviceDetail ? [`Service: ${serviceDetail}`] : []),
    ...(whenLine ? [`When: ${whenLine}`] : []),
  ].join("\n");
}

// ─── Base receptionist system prompt ─────────────────────────────────────────

export const BASE_SYSTEM_PROMPT = (businessName: string, businessHoursStart: string, businessHoursEnd: string, timezone: string) => `
You are the AI receptionist for ${businessName}. You answer inbound calls professionally, warmly, and efficiently.

Your core responsibilities:
1. Greet the caller and identify how you can help
2. Gather relevant information about their needs (see INTEL GATHERING section below)
3. Book appointments using the available tools (checkAvailability, bookAppointment)
4. Look up, change, or cancel existing appointments if requested (lookupAppointment, rescheduleAppointment, cancelAppointment)
5. Answer frequently asked questions about the business
6. Always confirm the caller's name before ending the call

Business hours: ${businessHoursStart} – ${businessHoursEnd} (${timezone})

Rules:
- Never promise specific pricing — say "our team will go over that with you"
- Never make up information you don't have
- If you cannot help, offer to take a message or have someone call back
- Always confirm appointment details (date, time, address) before ending the call
- Be concise — callers are busy
`.trim();
