"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/components/atoms/app-icon";
import { Modal } from "@/components/molecules/modal";
import { hasCompletedTutorial, saveTutorialCompletion } from "./index.function";
import styles from "./index.module.css";

const steps = [
  {
    title: "Bem-vinda à Agendinha",
    icon: "home" as const,
    description:
      "Aqui você acompanha seu dia e encontra atalhos para as tarefas mais importantes da sua agenda.",
    tips: [
      "Veja os próximos atendimentos logo ao entrar.",
      "Acesse rapidamente agendamentos e horários.",
    ],
  },
  {
    title: "Agendamentos",
    icon: "calendar" as const,
    description:
      "Consulte sua agenda por dia para saber quais horários estão livres, ocupados ou bloqueados.",
    tips: [
      "Toque em uma data para ver os horários daquele dia.",
      "Abra um horário ocupado para conferir ou cancelar o atendimento.",
    ],
  },
  {
    title: "Horários",
    icon: "clock" as const,
    description:
      "Defina os dias e períodos em que você atende. A Agendinha usa essas regras para oferecer horários aos clientes.",
    tips: [
      "Crie rotinas diferentes para cada dia da semana.",
      "Ative, edite ou remova uma regra quando sua rotina mudar.",
    ],
  },
  {
    title: "Criar novo horário",
    icon: "plus" as const,
    description:
      "Use o botão + no celular ou a área Horários no computador para cadastrar uma nova disponibilidade.",
    tips: [
      "Escolha os dias, o período de atendimento e a duração.",
      "Revise os dados antes de salvar para evitar conflitos.",
    ],
  },
  {
    title: "Perfil e link de agendamento",
    icon: "profile" as const,
    description:
      "Mantenha seus dados atualizados e copie seu link público para receber agendamentos dos clientes.",
    tips: [
      "Confira o fuso horário usado na agenda e nos lembretes.",
      "Compartilhe seu link por mensagem ou nas redes sociais.",
    ],
  },
];

type FirstAccessTutorialProps = {
  enabled: boolean;
  userId: string;
};

export function FirstAccessTutorial({
  enabled,
  userId,
}: FirstAccessTutorialProps) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    if (!enabled || hasCompletedTutorial(userId)) return;
    const timeoutId = window.setTimeout(() => {
      setStepIndex(0);
      setOpen(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, userId]);

  function finishTutorial() {
    saveTutorialCompletion(userId);
    setOpen(false);
  }

  return (
    <Modal
      description="Um guia rápido das atividades do seu painel."
      footer={
        <>
          <button
            className={`btn btn-ghost ${styles.skipButton}`}
            onClick={finishTutorial}
            type="button"
          >
            Pular tutorial
          </button>
          {stepIndex > 0 ? (
            <button
              className="btn btn-ghost"
              onClick={() => setStepIndex((current) => current - 1)}
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
              setStepIndex((current) => current + 1);
            }}
            type="button"
          >
            {isLastStep ? "Começar a usar" : "Próximo"}
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
