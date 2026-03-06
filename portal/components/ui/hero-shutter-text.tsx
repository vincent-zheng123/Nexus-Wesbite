"use client";

import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw } from "lucide-react";

interface HeroShutterTextProps {
  text?: string;
  className?: string;
}

export default function HeroShutterText({
  text = "NEXUS",
  className = "",
}: HeroShutterTextProps) {
  const [count, setCount] = useState(0);
  const characters = text.split("");

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center h-full w-full overflow-hidden",
        className
      )}
      style={{ background: "#06040f" }}
    >
      {/* Ambient orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "-10%",
          width: "60%",
          height: "60%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-10%",
          right: "-10%",
          width: "50%",
          height: "50%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,121,249,0.25) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #a855f7 1px, transparent 1px), linear-gradient(to bottom, #a855f7 1px, transparent 1px)`,
          backgroundSize: "clamp(24px, 5vw, 56px) clamp(24px, 5vw, 56px)",
        }}
      />

      {/* Main text */}
      <div className="relative z-10 w-full px-4 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            className="flex flex-wrap justify-center items-center w-full"
          >
            {characters.map((char, i) => (
              <div key={i} className="relative px-[0.5vw] overflow-hidden">
                {/* Base character */}
                <motion.span
                  initial={{ opacity: 0, filter: "blur(12px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ delay: i * 0.05 + 0.3, duration: 0.9 }}
                  style={{
                    fontFamily: "var(--font-orbitron)",
                    fontSize: "clamp(3.5rem, 12vw, 10rem)",
                    lineHeight: 1,
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    background: "linear-gradient(135deg, #f3f0ff 0%, #a78bfa 60%, #e879f9 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    display: "block",
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>

                {/* Top slice — primary purple */}
                <motion.span
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: "100%", opacity: [0, 1, 0] }}
                  transition={{ duration: 0.65, delay: i * 0.05, ease: "easeInOut" }}
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{
                    fontFamily: "var(--font-orbitron)",
                    fontSize: "clamp(3.5rem, 12vw, 10rem)",
                    lineHeight: 1,
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    color: "#7c3aed",
                    clipPath: "polygon(0 0, 100% 0, 100% 35%, 0 35%)",
                    display: "block",
                  }}
                >
                  {char}
                </motion.span>

                {/* Middle slice — muted */}
                <motion.span
                  initial={{ x: "100%", opacity: 0 }}
                  animate={{ x: "-100%", opacity: [0, 1, 0] }}
                  transition={{ duration: 0.65, delay: i * 0.05 + 0.1, ease: "easeInOut" }}
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{
                    fontFamily: "var(--font-orbitron)",
                    fontSize: "clamp(3.5rem, 12vw, 10rem)",
                    lineHeight: 1,
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    color: "#a78bfa",
                    clipPath: "polygon(0 35%, 100% 35%, 100% 65%, 0 65%)",
                    display: "block",
                  }}
                >
                  {char}
                </motion.span>

                {/* Bottom slice — accent */}
                <motion.span
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: "100%", opacity: [0, 1, 0] }}
                  transition={{ duration: 0.65, delay: i * 0.05 + 0.2, ease: "easeInOut" }}
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{
                    fontFamily: "var(--font-orbitron)",
                    fontSize: "clamp(3.5rem, 12vw, 10rem)",
                    lineHeight: 1,
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    color: "#e879f9",
                    clipPath: "polygon(0 65%, 100% 65%, 100% 100%, 0 100%)",
                    display: "block",
                  }}
                >
                  {char}
                </motion.span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: characters.length * 0.05 + 0.8, duration: 0.6 }}
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontSize: "0.75rem",
            letterSpacing: "0.22em",
            fontWeight: 600,
            color: "#6b6b80",
            textTransform: "uppercase",
            marginTop: "1.5rem",
          }}
        >
          AI Receptionist Platform
        </motion.p>
      </div>

      {/* Replay button */}
      <div className="absolute bottom-10 flex flex-col items-center gap-3 z-20">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCount((c) => c + 1)}
          className="p-3 rounded-full"
          style={{
            background: "rgba(124,58,237,0.15)",
            border: "1px solid rgba(168,85,247,0.3)",
            color: "#a855f7",
            transition: "box-shadow 0.2s",
            boxShadow: "0 0 0 rgba(168,85,247,0)",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(168,85,247,0.4)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 rgba(168,85,247,0)")}
        >
          <RefreshCw size={18} />
        </motion.button>
        <p style={{ fontSize: "0.6rem", letterSpacing: "0.3em", color: "#6b6b80", textTransform: "uppercase", fontWeight: 700 }}>
          Replay
        </p>
      </div>

      {/* Corner accents */}
      <div className="absolute top-8 left-8 w-10 h-10 pointer-events-none" style={{ borderLeft: "1px solid rgba(168,85,247,0.3)", borderTop: "1px solid rgba(168,85,247,0.3)" }} />
      <div className="absolute bottom-8 right-8 w-10 h-10 pointer-events-none" style={{ borderRight: "1px solid rgba(168,85,247,0.3)", borderBottom: "1px solid rgba(168,85,247,0.3)" }} />
    </div>
  );
}
