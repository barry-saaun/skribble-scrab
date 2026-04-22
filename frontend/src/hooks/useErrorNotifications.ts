import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  isInlineErrorCode,
  isToastErrorCode,
  toastErrorMessages,
  toastErrorTitles,
} from "~/types/errors";
import type { ErrorPayload } from "~/types/errors";

/**
 * - Toast errors   -> fires a sonner toast
 * - Inline errors  -> returned as `inlineError` for the caller to display
 */
export default function useErrorNotifications(lastError: ErrorPayload | null) {
  const inlineError = useMemo(() => {
    if (!lastError || !isInlineErrorCode(lastError.code)) return undefined;
    return { code: lastError.code };
  }, [lastError]);

  useEffect(() => {
    if (!lastError || !isToastErrorCode(lastError.code)) return;
    toast.error(toastErrorTitles[lastError.code], {
      description: toastErrorMessages[lastError.code],
    });
  }, [lastError]);

  return { inlineError };
}
