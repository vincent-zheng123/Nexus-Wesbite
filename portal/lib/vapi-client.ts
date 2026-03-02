/**
 * Vapi REST API client.
 *
 * Used for programmatic assistant creation during client onboarding.
 * Reads VAPI_API_KEY and VAPI_BASE_URL from env.
 */

import {
  BASE_SYSTEM_PROMPT,
  NICHE_SYSTEM_PROMPT_ADDON,
  NICHE_VAPI_STRUCTURED_SCHEMA,
} from "@/lib/niches";

const VAPI_BASE_URL = process.env.VAPI_BASE_URL ?? "https://api.vapi.ai";

function vapiHeaders() {
  const key = process.env.VAPI_API_KEY;
  if (!key) throw new Error("VAPI_API_KEY is not set");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VapiAssistantInput {
  businessName: string;
  industryType: string;          // "DENTAL" | "ROOFING" | "HVAC"
  businessHoursStart: string;    // "09:00"
  businessHoursEnd: string;      // "17:00"
  timezone: string;              // "America/New_York"
  toolsWebhookUrl: string;       // n8n vapi-tools endpoint
}

export interface VapiAssistantResult {
  id: string;
  name: string;
}

// ─── Create assistant ─────────────────────────────────────────────────────────

export async function createVapiAssistant(
  input: VapiAssistantInput
): Promise<VapiAssistantResult> {
  const {
    businessName,
    industryType,
    businessHoursStart,
    businessHoursEnd,
    timezone,
    toolsWebhookUrl,
  } = input;

  const systemPrompt =
    BASE_SYSTEM_PROMPT(businessName, businessHoursStart, businessHoursEnd, timezone) +
    "\n\n" +
    (NICHE_SYSTEM_PROMPT_ADDON[industryType] ?? "");

  const structuredDataSchema =
    NICHE_VAPI_STRUCTURED_SCHEMA[industryType] ?? NICHE_VAPI_STRUCTURED_SCHEMA["DENTAL"];

  const body = {
    name: `${businessName} AI Receptionist`,
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
    },
    voice: {
      provider: "11labs",
      voiceId: "bIHbv24MWmeRgasZH58o", // Will — professional, warm
    },
    firstMessage: `Thank you for calling ${businessName}! My name is Alex, I'm the AI assistant here. How can I help you today?`,
    firstMessageMode: "assistant-speaks-first",
    endCallMessage: "Thank you for calling, we look forward to seeing you. Have a great day!",
    analysisPlan: {
      structuredDataSchema,
      structuredDataPrompt:
        "Extract the structured data from this call transcript. Fill every field you can determine from the conversation. If a value was not mentioned, omit that field.",
    },
    tools: [
      {
        type: "function",
        function: {
          name: "checkAvailability",
          description: "Check available appointment slots",
          parameters: {
            type: "object",
            properties: {
              requestedDate: {
                type: "string",
                description: "Preferred date in YYYY-MM-DD format, or 'next available'",
              },
            },
          },
        },
        server: { url: toolsWebhookUrl },
      },
      {
        type: "function",
        function: {
          name: "bookAppointment",
          description: "Book an appointment for the caller",
          parameters: {
            type: "object",
            properties: {
              datetime: {
                type: "string",
                description: "ISO 8601 datetime string for the appointment",
              },
              callerName: {
                type: "string",
                description: "Full name of the caller",
              },
              callerPhone: {
                type: "string",
                description: "Caller's phone number in E.164 format",
              },
            },
            required: ["datetime", "callerName", "callerPhone"],
          },
        },
        server: { url: toolsWebhookUrl },
      },
      {
        type: "function",
        function: {
          name: "lookupAppointment",
          description: "Look up an existing appointment by caller phone number",
          parameters: {
            type: "object",
            properties: {
              callerPhone: {
                type: "string",
                description: "Caller's phone number in E.164 format",
              },
            },
            required: ["callerPhone"],
          },
        },
        server: { url: toolsWebhookUrl },
      },
      {
        type: "function",
        function: {
          name: "cancelAppointment",
          description: "Cancel an existing appointment",
          parameters: {
            type: "object",
            properties: {
              appointmentId: {
                type: "string",
                description: "The appointment ID to cancel",
              },
            },
            required: ["appointmentId"],
          },
        },
        server: { url: toolsWebhookUrl },
      },
      {
        type: "function",
        function: {
          name: "rescheduleAppointment",
          description: "Reschedule an existing appointment to a new time",
          parameters: {
            type: "object",
            properties: {
              appointmentId: {
                type: "string",
                description: "The appointment ID to reschedule",
              },
              newDatetime: {
                type: "string",
                description: "New ISO 8601 datetime string",
              },
            },
            required: ["appointmentId", "newDatetime"],
          },
        },
        server: { url: toolsWebhookUrl },
      },
    ],
    maxDurationSeconds: 600,
    backgroundDenoisingEnabled: true,
    endCallPhrases: ["goodbye", "have a good day", "take care"],
  };

  const res = await fetch(`${VAPI_BASE_URL}/assistant`, {
    method: "POST",
    headers: vapiHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Vapi createAssistant failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { id: data.id, name: data.name };
}

// ─── Delete assistant ─────────────────────────────────────────────────────────

export async function deleteVapiAssistant(assistantId: string): Promise<void> {
  const res = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
    method: "DELETE",
    headers: vapiHeaders(),
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Vapi deleteAssistant failed (${res.status}): ${err}`);
  }
}
