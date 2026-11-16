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
  onOpenChange?: (open: boolean) => void;
  pathname: string;
  userId: string;
};

export function FirstAccessTutorial({
  enabled,
  onOpenChange,
  pathname,
  userId,
}: FirstAccessTutorialProps) {
  const router = useRouter();
  const startedRef = useRef(false);
  const pendingStepRef = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
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
      onOpenChange?.(true);
      if (replayRequested || pathname !== steps[0].path) {
        router.replace(steps[0].path, { scroll: false });
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, onOpenChange, pathname, router, userId]);

  useEffect(() => {
    const pendingStep = pendingStepRef.current;
    if (pendingStep === undefined || steps[pendingStep].path !== pathname) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      pendingStepRef.current = undefined;
      setStepIndex(pendingStep);
      setNavigating(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    let frameId = 0;
    let settleTimeoutId = 0;
    let targetWasPositioned = false;
    let observedTarget: HTMLElement | undefined;
    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(scheduleMeasurement)
        : undefined;

    function measureTarget() {
      const targets = document.querySelectorAll<HTMLElement>(
        `[data-tutorial-target="${step.target}"]`,
      );
      const target = Array.from(targets).find((candidate) => {
        const rect = candidate.getBoundingClientRect();
        const style = window.getComputedStyle(candidate);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      });

      if (!target) {
        setSpotlight(undefined);
        return;
      }

      if (target !== observedTarget) {
        resizeObserver?.disconnect();
        resizeObserver?.observe(target);
        observedTarget = target;
      }

      const padding = 8;
      const viewportPadding = 8;
      const panel = document.querySelector<HTMLElement>(
        "[data-tutorial-panel]",
      );
      const panelRect = panel?.getBoundingClientRect();
      const isMobile = window.innerWidth <= 640;
      const availableBottom =
        isMobile &&
        panelRect &&
        panelRect.top > viewportPadding &&
        panelRect.top < window.innerHeight
          ? panelRect.top - 12
          : window.innerHeight - viewportPadding;

      const rect = target.getBoundingClientRect();
      if (!targetWasPositioned) {
        targetWasPositioned = true;
        const availableHeight = availableBottom - viewportPadding;
        const desiredTop =
          rect.height <= availableHeight
            ? viewportPadding + (availableHeight - rect.height) / 2
            : viewportPadding;
        const scrollOffset = rect.top - desiredTop;

        if (Math.abs(scrollOffset) > 1) {
          window.scrollBy({ top: scrollOffset, behavior: "auto" });
          settleTimeoutId = window.setTimeout(scheduleMeasurement, 100);
          return;
        }
        settleTimeoutId = window.setTimeout(scheduleMeasurement, 100);
      }

      const top = Math.max(viewportPadding, rect.top - padding);
      const left = Math.max(viewportPadding, rect.left - padding);
      const right = Math.min(
        window.innerWidth - viewportPadding,
        rect.right + padding,
      );
      const bottom = Math.min(availableBottom, rect.bottom + padding);

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
    window.visualViewport?.addEventListener("resize", scheduleMeasurement);
    window.visualViewport?.addEventListener("scroll", scheduleMeasurement);

    return () => {
      observer.disconnect();
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(settleTimeoutId);
      window.removeEventListener("resize", scheduleMeasurement);
      window.removeEventListener("scroll", scheduleMeasurement, true);
      window.visualViewport?.removeEventListener("resize", scheduleMeasurement);
      window.visualViewport?.removeEventListener("scroll", scheduleMeasurement);
    };
  }, [open, pathname, step.target]);

  function finishTutorial() {
    pendingStepRef.current = undefined;
    saveTutorialCompletion(userId);
    setNavigating(false);
    setSpotlight(undefined);
    setOpen(false);
    onOpenChange?.(false);
  }

  function goToStep(index: number) {
    setSpotlight(undefined);
    if (steps[index].path === pathname) {
      setStepIndex(index);
      return;
    }
    pendingStepRef.current = index;
    setNavigating(true);
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
              disabled={navigating}
              onClick={() => goToStep(stepIndex - 1)}
              type="button"
            >
              Voltar
            </button>
          ) : null}
          <button
            className="btn btn-primary"
            disabled={navigating}
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
