import type { Metadata } from "next";
import { CancelAppointmentScreen } from "@/features/cancellation/components/cancel-appointment-screen";

export const metadata: Metadata = {
  title: "Cancelar agendamento · Agendinha",
  description: "Confira o horário e cancele somente se quiser liberá-lo.",
};

type CancelPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

function firstToken(token: string | string[] | undefined): string {
  const value = Array.isArray(token) ? token[0] : token;
  return value?.trim() ?? "";
}

export default async function CancelPage({ searchParams }: CancelPageProps) {
  const query = await searchParams;

  return <CancelAppointmentScreen token={firstToken(query.token)} />;
}
