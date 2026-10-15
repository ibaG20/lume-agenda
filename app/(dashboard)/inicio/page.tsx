import type { Metadata } from "next";
import { HomeScreen } from "@/features/dashboard/components/home-screen";

export const metadata: Metadata = {
  title: "Início · Lume Agendas",
};

export default function InicioPage() {
  return <HomeScreen />;
}
