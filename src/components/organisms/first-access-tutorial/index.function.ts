import {
  FIRST_ACCESS_GUIDE_COOKIE,
  FIRST_ACCESS_GUIDE_METADATA_KEY,
} from "@/lib/first-access-guide";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export const TUTORIAL_STORAGE_PREFIX = "agendinha:tutorial-concluido:v2:";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function tutorialStorageKey(userId: string) {
  return `${TUTORIAL_STORAGE_PREFIX}${userId}`;
}

function readCompletionCookie() {
  try {
    const prefix = `${FIRST_ACCESS_GUIDE_COOKIE}=`;
    const entry = document.cookie
      .split("; ")
      .find((item) => item.startsWith(prefix));
    return entry ? decodeURIComponent(entry.slice(prefix.length)) : undefined;
  } catch {
    return undefined;
  }
}

export function hasCompletionCookie(userId: string) {
  return readCompletionCookie() === userId;
}

export function hasCompletedTutorial(userId: string) {
  try {
    if (window.localStorage.getItem(tutorialStorageKey(userId)) === "1") {
      return true;
    }
  } catch {
    // Sem armazenamento local, o cookie ainda indica a conclusão.
  }
  return hasCompletionCookie(userId);
}

/**
 * Grava a conclusão no armazenamento local e no cookie lido pelo servidor,
 * que só passa a exigir o perfil completo depois que o guia termina.
 */
export function saveTutorialCompletion(userId: string) {
  try {
    window.localStorage.setItem(tutorialStorageKey(userId), "1");
  } catch {
    // O tutorial continua utilizável mesmo quando o armazenamento é bloqueado.
  }
  try {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${FIRST_ACCESS_GUIDE_COOKIE}=${encodeURIComponent(
      userId,
    )}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax${secure}`;
  } catch {
    // Cookies bloqueados: a conclusão ainda fica registrada na conta.
  }
  void saveCompletionOnAccount();
}

/** Registra a conclusão na conta, para que o guia não abra em outro aparelho. */
async function saveCompletionOnAccount() {
  try {
    await createBrowserSupabaseClient().auth.updateUser({
      data: { [FIRST_ACCESS_GUIDE_METADATA_KEY]: new Date().toISOString() },
    });
  } catch {
    // Sem rede: o cookie e o armazenamento local cobrem este navegador.
  }
}
