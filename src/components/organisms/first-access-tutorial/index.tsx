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
    target: "home-actions",
    description: [
      "Acompanhe os atendimentos e avisos do dia.",
      "Use os atalhos para gerenciar agendamentos e horários.",
    ],
  },
  {
    title: "Configure seus horários",
    icon: "clock" as const,
    path: "/inicio/horarios",
    target: "schedule-create",
    description: [
      "Crie grupos para definir os dias e períodos em que atende.",
      "Use Novo grupo para adicionar uma rotina.",
    ],
  },
  {
    title: "Crie um grupo de horários",
    icon: "plus" as const,
    path: "/inicio/horarios/criar",
    target: "schedule-routine",
    description: [
      "Dê um nome à rotina e selecione os dias da semana.",
      "Informe início, duração e quantidade de atendimentos.",
    ],
  },
  {
    title: "Perfil e link de agendamento",
    icon: "profile" as const,
    path: "/perfil",
    target: "profile-link",
    description: [
      "Defina o endereço público usado pelos seus clientes.",
      "Copie e compartilhe o link de agendamento.",
    ],
  },
  {
    title: "Gerencie seus agendamentos",
    icon: "calendar" as const,
    path: "/inicio/agendamentos",
    target: "agenda-calendar",
    description: [
      "Selecione uma data para consultar os horários do dia.",
      "Veja quais estão livres, ocupados ou inativos.",
    ],
  },
];

type Spotlight = {
  top: number;
  left: number;
  width: number;
  height: number;
};

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
  const [placement, setPlacement] = useState<"left" | "right">("right");
  const [spotlight, setSpotlight] = useState<Spotlight>();
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

  useEffect(() => {
    if (!open) return;

    let frameId = 0;
    let settleTimeoutId = 0;
    let targetWasPositioned = false;

    function measureTarget() {
      const target = document.querySelector<HTMLElement>(
        `[data-tutorial-target="${step.target}"]`,
      );

      if (!target) {
        setSpotlight(undefined);
        return;
      }

      if (!targetWasPositioned) {
        targetWasPositioned = true;
        if (typeof target.scrollIntoView === "function") {
          target.scrollIntoView({ block: "center" });
        }
        settleTimeoutId = window.setTimeout(scheduleMeasurement, 100);
      }

      const rect = target.getBoundingClientRect();
      const padding = 8;
      const viewportPadding = 8;
      const top = Math.max(viewportPadding, rect.top - padding);
      const left = Math.max(viewportPadding, rect.left - padding);
      const right = Math.min(
        window.innerWidth - viewportPadding,
        rect.right + padding,
      );
      const bottom = Math.min(
        window.innerHeight - viewportPadding,
        rect.bottom + padding,
      );

      setSpotlight({
        top,
        left,
        width: Math.max(0, right - left),
        height: Math.max(0, bottom - top),
      });
      setPlacement(left > window.innerWidth - right ? "left" : "right");
    }

    function scheduleMeasurement() {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(measureTarget);
    }

    scheduleMeasurement();
    const observer = new MutationObserver(scheduleMeasurement);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", scheduleMeasurement);
    window.addEventListener("scroll", scheduleMeasurement, true);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(settleTimeoutId);
      window.removeEventListener("resize", scheduleMeasurement);
      window.removeEventListener("scroll", scheduleMeasurement, true);
    };
  }, [open, pathname, step.target]);

  function finishTutorial() {
    saveTutorialCompletion(userId);
    setOpen(false);
  }

  function goToStep(index: number) {
    setSpotlight(undefined);
    setStepIndex(index);
    router.replace(steps[index].path, { scroll: false });
  }

  return (
    <Modal
      dismissible={false}
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
      placement={placement}
      spotlight={spotlight}
      title={step.title}
    >
      <section aria-live="polite">
        <div className={styles.intro}>
          <span className={styles.icon}>
            <AppIcon name={step.icon} size={26} />
          </span>
          <div className={styles.description}>
            <span className={styles.stepLabel}>
              Passo {stepIndex + 1} de {steps.length}
            </span>
            <ul>
              {step.description.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
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
