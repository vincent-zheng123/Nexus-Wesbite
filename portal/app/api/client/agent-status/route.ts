import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AgentStatus = "busy" | "idle" | "not_configured" | "error";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.clientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.clientConfig.findUnique({
    where: { clientId: session.user.clientId },
    select: { vapiAssistantId: true },
  });

  if (!config?.vapiAssistantId) {
    return NextResponse.json({ status: "not_configured" as AgentStatus });
  }

  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ status: "error" as AgentStatus });
  }

  try {
    const vapiBase = process.env.VAPI_BASE_URL ?? "https://api.vapi.ai";
    const res = await fetch(
      `${vapiBase}/call?assistantId=${config.vapiAssistantId}&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ status: "error" as AgentStatus });
    }

    const data = await res.json();
    const calls: { status?: string }[] = Array.isArray(data) ? data : (data.results ?? []);
    const activeCalls = calls.filter((c) => c.status === "in-progress" || c.status === "ringing");
    const status: AgentStatus = activeCalls.length > 0 ? "busy" : "idle";
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json({ status: "error" as AgentStatus });
  }
}
