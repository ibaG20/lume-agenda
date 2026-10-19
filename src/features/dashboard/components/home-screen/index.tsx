"use client";

import Image from "next/image";
import { AppIcon } from "@/components/atoms/app-icon";
import { AppLink } from "@/components/atoms/app-link";
import { PageHeader } from "@/components/molecules/page-header";
import { ResourceFeedback } from "@/components/molecules/resource-feedback";
import { useDailyAgenda } from "@/features/agenda";
import { NoticesSection } from "@/features/notices";
import { useProfile } from "@/features/profile";
import { formatTime, todayInTimezone } from "@/lib/date-time/dashboard";
import styles from "./index.module.css";

export function HomeScreen() {
  const profile = useProfile();
  const today = profile.data ? todayInTimezone(profile.data.timezone) : "";
  const agenda = useDailyAgenda(today);
  const displayTimezone =
    agenda.data?.timezone ?? profile.data?.timezone ?? "America/Sao_Paulo";
  const booked =
    agenda.data?.slots.filter((slot) => slot.state === "booked") ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader size="medium" title="Painel do dia" />

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Ações rápidas">
        <AppLink className={styles.primaryAction} href="/inicio/agendamentos">
          <span className={styles.actionIcon}>
            <AppIcon name="calendar" />
          </span>
          <span>
            <strong>Gerenciar agendamentos</strong>
            <small>Consulte dias livres e ocupados</small>
          </span>
          <AppIcon name="chevron-right" />
        </AppLink>
        <AppLink className={styles.secondaryAction} href="/inicio/horarios">
          <span className={styles.actionIcon}>
            <AppIcon name="clock" />
          </span>
          <span>
            <strong>Configurar horários</strong>
            <small>Defina quando você atende</small>
          </span>
          <AppIcon name="chevron-right" />
        </AppLink>
      </section>

      <section aria-labelledby="today-title">
        <h2 className={`${styles.sectionEyebrow} mb-4`} id="today-title">
          Hoje
        </h2>

        {(profile.status === "pending" && !profile.data) ||
        (agenda.status === "pending" && !agenda.data) ? (
          <ResourceFeedback kind="loading" title="Carregando sua agenda…" />
        ) : null}
        {profile.status === "error" ? (
          <ResourceFeedback
            kind="error"
            title="Não foi possível carregar seu perfil"
            description={profile.error.message}
            onRetry={profile.refetch}
          />
        ) : null}
        {agenda.status === "error" ? (
          <ResourceFeedback
            kind="error"
            title="Não foi possível carregar os agendamentos"
            description={agenda.error.message}
            onRetry={agenda.refetch}
          />
        ) : null}
        {(agenda.status === "empty" || agenda.status === "success") &&
        booked.length === 0 ? (
          <div className={styles.empty}>
            <Image
              alt="Nenhum agendamento hoje."
              className={styles.emptyIllustration}
              height={268}
              src="/illustrations/empty-agenda.png"
              width={640}
            />
          </div>
        ) : null}
        {booked.length > 0 && agenda.data ? (
          <ol className="flex flex-col gap-3">
            {booked.map((slot) => (
              <li
                className={styles.appointment}
                key={slot.appointmentId ?? slot.start}
              >
                <time className={styles.appointmentTime} dateTime={slot.start}>
                  {formatTime(slot.start, displayTimezone)}
                </time>
                <span className={styles.appointmentDivider} aria-hidden />
                <span>
                  <strong className={styles.clientName}>
                    {slot.clientName ?? "Cliente"}
                  </strong>
                  <small className={styles.appointmentEnd}>
                    até {formatTime(slot.end, displayTimezone)}
                  </small>
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      <NoticesSection />
    </div>
  );
}
