"use client";

import { useState } from "react";

export function TranscriptToggle({
  transcript,
  transcriptUrl,
}: {
  transcript: string | null;
  transcriptUrl: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (!transcript && !transcriptUrl) return null;

  return (
    <div>
      {transcript && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs underline"
          style={{ color: "#a855f7" }}
        >
          {open ? "Hide transcript" : "View transcript"}
        </button>
      )}
      {transcriptUrl && !transcript && (
        <a
          href={transcriptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline"
          style={{ color: "#a855f7" }}
        >
          Recording
        </a>
      )}
      {transcriptUrl && transcript && (
        <>
          {" · "}
          <a
            href={transcriptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
            style={{ color: "#6b6b80" }}
          >
            Recording
          </a>
        </>
      )}
      {open && transcript && (
        <div
          className="mt-3 rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono"
          style={{
            background: "#100d20",
            border: "1px solid rgba(168,85,247,0.15)",
            color: "#c4b5fd",
            maxHeight: "320px",
            overflowY: "auto",
          }}
        >
          {transcript}
        </div>
      )}
    </div>
  );
}
