"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppIcon } from "@/components/atoms/app-icon";
import { Modal } from "@/components/molecules/modal";
import { hasCompletedTutorial, saveTutorialCompletion } from "./index.function";
import styles from "./index.module.css";

const steps = [
  {
    title: "Painel do dia",
    icon: "home" as const,
    path: "/inicio",
    description:
      "Esta é a visão geral da sua agenda. Aqui você acompanha os atendimentos de hoje, avisos e atalhos para as tarefas principais.",
    tips: [
      "Consulte os próximos atendimentos logo ao entrar.",
      "Use os atalhos para gerenciar agendamentos e horários.",
    ],
  },
  {
    title: "Configure seus horários",
    icon: "clock" as const,
    path: "/inicio/horarios",
    description:
      "Nesta tela você administra os grupos que definem os dias e períodos em que atende.",
    tips: [
      "Ative, edite ou exclua grupos quando sua rotina mudar.",
      "Grupos ativos não podem ter horários conflitantes.",
    ],
  },
  {
    title: "Crie um grupo de horários",
    icon: "plus" as const,
    path: "/inicio/horarios/criar",
    description:
      "Cadastre uma rotina informando os dias da semana, o início, a duração e a quantidade de atendimentos.",
    tips: [
      "Use um nome que ajude a identificar a rotina depois.",
      "O término do período é calculado automaticamente.",
    ],
  },
  {
    title: "Perfil e link de agendamento",
    icon: "profile" as const,
    path: "/perfil",
    description:
      "Mantenha seus dados atualizados e copie o link público que seus clientes usarão para agendar.",
    tips: [
      "Confira o fuso horário usado na agenda e nos lembretes.",
      "Compartilhe o link por mensagem ou nas redes sociais.",
    ],
  },
  {
    title: "Gerencie seus agendamentos",
    icon: "calendar" as const,
    path: "/inicio/agendamentos",
    description:
      "Consulte sua agenda por dia para saber quais horários estão livres, ocupados ou bloqueados.",
    tips: [
      "Selecione uma data para conferir os horários daquele dia.",
      "Abra um horário para inativar, reativar ou cancelar um atendimento.",
    ],
  },
];

type FirstAccessTutorialProps = {
  enabled: boolean;
  pathname: string;
  userId: string;
};

export function FirstAccessTutorial({
  enabled,
  pathname,
  userId,
}: FirstAccessTutorialProps) {
  const router = useRouter();
  const startedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    const replayRequested =
      pathname === "/inicio" &&
      new URLSearchParams(window.location.search).get("guia") === "1";

    if (!replayRequested && (!enabled || startedRef.current)) return;
    if (!replayRequested && hasCompletedTutorial(userId)) {
      startedRef.current = true;
      return;
    }

    startedRef.current = true;
    const timeoutId = window.setTimeout(() => {
      setStepIndex(0);
      setOpen(true);
      if (replayRequested || pathname !== steps[0].path) {
        router.replace(steps[0].path, { scroll: false });
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, pathname, router, userId]);

  function finishTutorial() {
    saveTutorialCompletion(userId);
    setOpen(false);
  }

  function goToStep(index: number) {
    setStepIndex(index);
    router.replace(steps[index].path, { scroll: false });
  }

  return (
    <Modal
      description="Conheça as principais telas enquanto navega pelo seu painel."
      footer={
        <>
          <button
            className={`btn btn-ghost ${styles.skipButton}`}
            onClick={finishTutorial}
            type="button"
          >
            Pular guia
          </button>
          {stepIndex > 0 ? (
            <button
              className="btn btn-ghost"
              onClick={() => goToStep(stepIndex - 1)}
              type="button"
            >
              Voltar
            </button>
          ) : null}
          <button
            className="btn btn-primary"
            onClick={() => {
              if (isLastStep) {
                finishTutorial();
                return;
              }
              goToStep(stepIndex + 1);
            }}
            type="button"
          >
            {isLastStep ? "Concluir guia" : "Próximo"}
          </button>
        </>
      }
      onClose={finishTutorial}
      open={open}
      title={step.title}
    >
      <section aria-live="polite">
        <div className={styles.intro}>
          <span className={styles.icon}>
            <AppIcon name={step.icon} size={26} />
          </span>
          <p className={styles.description}>
            <span className={styles.stepLabel}>
              Passo {stepIndex + 1} de {steps.length}
            </span>
            {step.description}
          </p>
        </div>
        <ul className={styles.tips}>
          {step.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <ol className={styles.progress} aria-label="Progresso do tutorial">
          {steps.map((item, index) => (
            <li
              aria-current={index === stepIndex ? "step" : undefined}
              data-active={index === stepIndex}
              key={item.title}
            >
              <span className="sr-only">
                Passo {index + 1}: {item.title}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </Modal>
  );
}
