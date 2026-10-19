import type { Metadata } from "next";
import { PageHeader } from "@/components/molecules/page-header";
import { ScheduleGroupForm } from "@/components/organisms/schedule-group-form";

export const metadata: Metadata = {
  title: "Criar horários · Lume Agendas",
};

export default function CriarHorariosPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Criar horários" size="medium" />
      <ScheduleGroupForm mode="create" />
    </div>
  );
}
