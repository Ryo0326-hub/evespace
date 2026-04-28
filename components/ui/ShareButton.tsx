"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ShareButton({ className, path }: { className?: string; path: string }) {
  const [label, setLabel] = useState("Share");

  async function handleShare() {
    const url = `${window.location.origin}${path}`;

    if (navigator.share) {
      await navigator.share({ title: "Evespace event", url });
      return;
    }

    await navigator.clipboard.writeText(url);
    setLabel("Copied");
    window.setTimeout(() => setLabel("Share"), 1800);
  }

  return (
    <Button className={className} type="button" variant="secondary" onClick={handleShare}>
      {label}
    </Button>
  );
}
