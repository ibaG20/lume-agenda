import type { Metadata } from "next";
import { HomeScreen } from "@/features/dashboard/components/home-screen";

export const metadata: Metadata = {
  title: "Início · Agendinha",
};

export default function InicioPage() {
  return <HomeScreen />;
}
