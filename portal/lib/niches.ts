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

const DENTAL_FIELDS: NicheField[] = [
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

const ROOFING_FIELDS: NicheField[] = [
  {
    key: "address",
    label: "Property Address",
    type: "string",
    description: "Full address of the property that needs roofing work",
    askPrompt: "What's the address of the property we'd be looking at?",
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

const HVAC_FIELDS: NicheField[] = [
  {
    key: "address",
    label: "Service Address",
    type: "string",
    description: "Full address where HVAC service is needed",
    askPrompt: "What's the service address?",
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

// ─── Master registry ─────────────────────────────────────────────────────────

export const NICHE_INTEL_FIELDS: Record<string, NicheField[]> = {
  DENTAL: DENTAL_FIELDS,
  ROOFING: ROOFING_FIELDS,
  HVAC: HVAC_FIELDS,
};

// ─── Vapi structuredDataSchema ────────────────────────────────────────────────

function buildVapiSchema(fields: NicheField[]): object {
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
};

// ─── Vapi system prompt addon ─────────────────────────────────────────────────

export const NICHE_SYSTEM_PROMPT_ADDON: Record<string, string> = {
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
};

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
