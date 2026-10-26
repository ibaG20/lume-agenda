export const TUTORIAL_STORAGE_PREFIX = "agendinha:tutorial-concluido:v1:";

export function tutorialStorageKey(userId: string) {
  return `${TUTORIAL_STORAGE_PREFIX}${userId}`;
}

export function hasCompletedTutorial(userId: string) {
  try {
    return window.localStorage.getItem(tutorialStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function saveTutorialCompletion(userId: string) {
  try {
    window.localStorage.setItem(tutorialStorageKey(userId), "1");
  } catch {
    // O tutorial continua utilizável mesmo quando o armazenamento é bloqueado.
  }
}
