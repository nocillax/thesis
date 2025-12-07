import { useState, useEffect, useCallback } from "react";

interface UseSmartPollingOptions {
  enabled?: boolean;
  isTyping?: boolean;
  isModalOpen?: boolean;
  isMutating?: boolean;
}

/**
 * Hook to manage smart polling behavior
 * - Pauses when user is typing
 * - Pauses when modals are open
 * - Pauses during mutations
 * - Stops when tab is hidden
 * - Resumes immediately when tab becomes visible
 */
export function useSmartPolling({
  enabled = true,
  isTyping = false,
  isModalOpen = false,
  isMutating = false,
}: UseSmartPollingOptions = {}) {
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const shouldPoll =
    enabled && isTabVisible && !isTyping && !isModalOpen && !isMutating;

  return {
    shouldPoll,
    isTabVisible,
  };
}

/**
 * Hook for exponential backoff retry logic
 * Increases interval on errors, resets on success
 */
export function usePollingInterval(baseInterval: number) {
  const [interval, setInterval] = useState(baseInterval);
  const [errorCount, setErrorCount] = useState(0);

  const onError = useCallback(() => {
    setErrorCount((prev) => {
      const newCount = prev + 1;
      // Exponential backoff: 15s -> 30s -> 60s (max)
      const newInterval = Math.min(baseInterval * Math.pow(2, newCount), 60000);
      setInterval(newInterval);
      return newCount;
    });
  }, [baseInterval]);

  const onSuccess = useCallback(() => {
    if (errorCount > 0) {
      setErrorCount(0);
      setInterval(baseInterval);
    }
  }, [errorCount, baseInterval]);

  return {
    interval,
    onError,
    onSuccess,
  };
}
