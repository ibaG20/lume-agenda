import type { Metadata } from "next";
import { SummaryScreen } from "@/features/public-booking";

export const metadata: Metadata = {
  title: "Agendamento confirmado · Agendinha",
};

export default function SummaryPage() {
  return <SummaryScreen />;
}
