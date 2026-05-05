import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  clearPersistedProgressState,
  readPersistedProgressState,
  writePersistedProgressState,
} from "@/lib/storage";
import { getCurrentUtcDateTime } from "@/lib/datetime";
import { useSession } from "@/providers/session-provider";
import {
  type CompletedSessionRecord,
  type PersistedProgressState,
  type SessionProgress,
} from "@/types/domain";

type ProgressContextValue = {
  activeSession: SessionProgress | null;
  completedSessions: CompletedSessionRecord[];
  finishSession: (
    programId: string,
    completedDurationSec: number,
  ) => Promise<void>;
  pauseSession: (
    programId: string,
    currentStepIndex: number,
    elapsedStepSec: number,
  ) => Promise<void>;
  restartSession: (programId: string) => Promise<SessionProgress>;
  resumeSession: (programId: string) => Promise<void>;
  setCurrentStep: (
    programId: string,
    currentStepIndex: number,
    elapsedStepSec: number,
  ) => Promise<void>;
  startSession: (programId: string) => Promise<SessionProgress>;
  syncElapsed: (
    programId: string,
    currentStepIndex: number,
    elapsedStepSec: number,
  ) => Promise<void>;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

function buildProgressState(
  activeSession: SessionProgress | null,
  completedSessions: CompletedSessionRecord[],
) {
  return {
    activeSession,
    completedSessions,
  } satisfies PersistedProgressState;
}

function buildNewSession(programId: string, startedAt: string) {
  return {
    completedAt: null,
    currentStepIndex: 0,
    elapsedStepSec: 0,
    isPaused: false,
    programId,
    startedAt,
    updatedAt: startedAt,
  } satisfies SessionProgress;
}

export function ProgressProvider(props: PropsWithChildren) {
  const { currentUserId } = useSession();
  const [activeSession, setActiveSession] = useState<SessionProgress | null>(
    null,
  );
  const [completedSessions, setCompletedSessions] = useState<
    CompletedSessionRecord[]
  >([]);
  const activeSessionRef = useRef<SessionProgress | null>(null);
  const completedSessionsRef = useRef<CompletedSessionRecord[]>([]);

  const commitProgressState = useCallback(
    (
      nextActiveSession: SessionProgress | null,
      nextCompletedSessions: CompletedSessionRecord[],
    ) => {
      activeSessionRef.current = nextActiveSession;
      completedSessionsRef.current = nextCompletedSessions;
      setActiveSession(nextActiveSession);
      setCompletedSessions(nextCompletedSessions);
    },
    [],
  );

  useEffect(() => {
    const loadProgress = async () => {
      if (currentUserId === null) {
        commitProgressState(null, []);
        return;
      }

      const storedState = await readPersistedProgressState(currentUserId);

      if (storedState === null) {
        commitProgressState(null, []);
        return;
      }

      commitProgressState(
        storedState.activeSession,
        storedState.completedSessions,
      );
    };

    void loadProgress();
  }, [commitProgressState, currentUserId]);

  const persistState = useCallback(
    async (
      nextActiveSession: SessionProgress | null,
      nextCompletedSessions: CompletedSessionRecord[],
    ) => {
      if (currentUserId === null) {
        return;
      }

      await writePersistedProgressState(
        currentUserId,
        buildProgressState(nextActiveSession, nextCompletedSessions),
      );
    },
    [currentUserId],
  );

  const startSession = useCallback(async (programId: string) => {
    const currentSession = activeSessionRef.current;

    if (currentSession !== null && currentSession.programId === programId) {
      return currentSession;
    }

    const now = getCurrentUtcDateTime();
    const nextSession = buildNewSession(programId, now);
    const nextCompletedSessions = completedSessionsRef.current;

    commitProgressState(nextSession, nextCompletedSessions);
    await persistState(nextSession, nextCompletedSessions);

    return nextSession;
  }, [commitProgressState, persistState]);

  const restartSession = useCallback(async (programId: string) => {
    const now = getCurrentUtcDateTime();
    const nextSession = buildNewSession(programId, now);
    const nextCompletedSessions = completedSessionsRef.current;

    commitProgressState(nextSession, nextCompletedSessions);
    await persistState(nextSession, nextCompletedSessions);

    return nextSession;
  }, [commitProgressState, persistState]);

  const syncElapsed = useCallback(async (
    programId: string,
    currentStepIndex: number,
    elapsedStepSec: number,
  ) => {
    const currentSession = activeSessionRef.current;

    if (currentSession === null || currentSession.programId !== programId) {
      throw new Error(`No active session exists for program "${programId}".`);
    }

    if (
      currentSession.currentStepIndex === currentStepIndex &&
      currentSession.elapsedStepSec === elapsedStepSec
    ) {
      return;
    }

    const nextSession = {
      ...currentSession,
      currentStepIndex,
      elapsedStepSec,
      updatedAt: getCurrentUtcDateTime(),
    } satisfies SessionProgress;
    const nextCompletedSessions = completedSessionsRef.current;

    commitProgressState(nextSession, nextCompletedSessions);
    await persistState(nextSession, nextCompletedSessions);
  }, [commitProgressState, persistState]);

  const pauseSession = useCallback(async (
    programId: string,
    currentStepIndex: number,
    elapsedStepSec: number,
  ) => {
    const currentSession = activeSessionRef.current;

    if (currentSession === null || currentSession.programId !== programId) {
      throw new Error(
        `Cannot pause missing session for program "${programId}".`,
      );
    }

    const nextSession = {
      ...currentSession,
      currentStepIndex,
      elapsedStepSec,
      isPaused: true,
      updatedAt: getCurrentUtcDateTime(),
    } satisfies SessionProgress;
    const nextCompletedSessions = completedSessionsRef.current;

    commitProgressState(nextSession, nextCompletedSessions);
    await persistState(nextSession, nextCompletedSessions);
  }, [commitProgressState, persistState]);

  const resumeSession = useCallback(async (programId: string) => {
    const currentSession = activeSessionRef.current;

    if (currentSession === null || currentSession.programId !== programId) {
      throw new Error(
        `Cannot resume missing session for program "${programId}".`,
      );
    }

    const nextSession = {
      ...currentSession,
      isPaused: false,
      updatedAt: getCurrentUtcDateTime(),
    } satisfies SessionProgress;
    const nextCompletedSessions = completedSessionsRef.current;

    commitProgressState(nextSession, nextCompletedSessions);
    await persistState(nextSession, nextCompletedSessions);
  }, [commitProgressState, persistState]);

  const setCurrentStep = useCallback(async (
    programId: string,
    currentStepIndex: number,
    elapsedStepSec: number,
  ) => {
    const currentSession = activeSessionRef.current;

    if (currentSession === null || currentSession.programId !== programId) {
      throw new Error(`Cannot change step for missing session "${programId}".`);
    }

    const nextSession = {
      ...currentSession,
      currentStepIndex,
      elapsedStepSec,
      isPaused: false,
      updatedAt: getCurrentUtcDateTime(),
    } satisfies SessionProgress;
    const nextCompletedSessions = completedSessionsRef.current;

    commitProgressState(nextSession, nextCompletedSessions);
    await persistState(nextSession, nextCompletedSessions);
  }, [commitProgressState, persistState]);

  const finishSession = useCallback(async (
    programId: string,
    completedDurationSec: number,
  ) => {
    const currentSession = activeSessionRef.current;

    if (currentSession === null || currentSession.programId !== programId) {
      throw new Error(`Cannot finish missing session "${programId}".`);
    }

    const completedRecord = {
      completedAt: getCurrentUtcDateTime(),
      completedDurationSec,
      programId,
      startedAt: currentSession.startedAt,
    } satisfies CompletedSessionRecord;
    const nextCompletedSessions = [
      completedRecord,
      ...completedSessionsRef.current,
    ];

    commitProgressState(null, nextCompletedSessions);

    if (currentUserId === null) {
      return;
    }

    if (nextCompletedSessions.length === 0) {
      await clearPersistedProgressState(currentUserId);
      return;
    }

    await persistState(null, nextCompletedSessions);
  }, [commitProgressState, currentUserId, persistState]);

  return (
    <ProgressContext.Provider
      value={{
        activeSession,
        completedSessions,
        finishSession,
        pauseSession,
        restartSession,
        resumeSession,
        setCurrentStep,
        startSession,
        syncElapsed,
      }}
    >
      {props.children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);

  if (context === null) {
    throw new Error("useProgress must be used inside ProgressProvider.");
  }

  return context;
}
