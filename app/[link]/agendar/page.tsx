import type { Metadata } from "next";
import { ScheduleScreen } from "@/features/public-booking";

export const metadata: Metadata = {
  title: "Escolha um horário · Agendinha",
};

export default function SchedulePage() {
  return <ScheduleScreen />;
}
