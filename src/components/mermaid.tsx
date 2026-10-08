"use client";

import React, { useEffect, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

let idCounter = 0;

export function Mermaid({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string>("");
  const [id] = useState(() => `mermaid-chart-${idCounter++}`);

  useEffect(() => {
    mermaid.render(id, chart).then(({ svg }) => {
      setSvg(svg);
    }).catch(console.error);
  }, [chart, id]);

  if (!svg) {
    return <div className="h-32 flex items-center justify-center text-text-3">Rendering diagram...</div>;
  }

  return (
    <div 
      className="flex justify-center my-4 overflow-x-auto rounded-md bg-stone-950 p-6 border border-stone-800" 
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
}
