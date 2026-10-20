import type { Metadata } from "next";
import { Admin } from "@/components/Admin";

export const metadata: Metadata = { title: "The Committee · Tittyboyz Golf Outing 2026", robots: { index: false } };

export default function AdminPage() {
  return <Admin />;
}
