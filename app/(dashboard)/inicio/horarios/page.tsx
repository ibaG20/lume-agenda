import type { Metadata } from "next";
import { ScheduleListScreen } from "@/features/dashboard/components/schedule-list-screen";

export const metadata: Metadata = {
  title: "Horários · Agendinha",
};

export default function HorariosPage() {
  return <ScheduleListScreen />;
}
