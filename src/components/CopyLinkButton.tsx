"use client";

import { useState } from "react";

interface CopyLinkButtonProps {
  slug: string;
}

export default function CopyLinkButton({ slug }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/agent/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        backgroundColor: copied ? "#1a2e1e" : "#1e2235",
        border: `1px solid ${copied ? "#5dca7a40" : "#2e3250"}`,
        borderRadius: 20,
        padding: "6px 14px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      <span style={{ fontSize: 12, color: copied ? "#5dca7a" : "#8a8698" }}>
        /agent/{slug}
      </span>
      <span style={{ fontSize: 11, color: copied ? "#5dca7a" : "#c8a96e" }}>
        {copied ? "✓ Copied" : "Copy link"}
      </span>
    </button>
  );
}
