import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vandelier Dashboard",
  description: "Vandelier AI Dashboard Integration",
};

export default function VandelierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="vandelier-root min-h-screen">
      {children}
    </div>
  );
}
