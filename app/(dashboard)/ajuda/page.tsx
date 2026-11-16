import type { Metadata } from "next";
import { HelpScreen } from "@/features/dashboard/components/help-screen";

export const metadata: Metadata = {
  title: "Ajuda · Agendinha",
};

export default function AjudaPage() {
  return <HelpScreen />;
}
