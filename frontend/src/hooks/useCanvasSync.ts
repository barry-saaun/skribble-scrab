import { useCallback, useEffect, useRef } from "react";
import { CanvasHandle, DrawStrokePayload } from "~/types/events";

interface TUseCanvasSync {
  sendStroke: (payload: DrawStrokePayload) => void;
  sendClear: () => void;
  registerDrawCallbacks: (
    onStroke: (payload: DrawStrokePayload) => void,
    onClear: () => void,
  ) => void;
}

export default function usePlayerPresence({
  sendClear,
  sendStroke,
  registerDrawCallbacks,
}: TUseCanvasSync) {
  const canvasRef = useRef<CanvasHandle>(null);

  useEffect(() => {
    registerDrawCallbacks(
      (payload) => canvasRef.current?.applyStroke(payload),
      () => canvasRef.current?.clearCanvas(),
    );
  }, [registerDrawCallbacks]);

  const handleStroke = useCallback(
    (payload: DrawStrokePayload) => sendStroke(payload),
    [sendStroke],
  );

  const handleClear = useCallback(() => {
    canvasRef.current?.clearCanvas();
    sendClear();
  }, [sendClear]);

  return { handleStroke, handleClear, canvasRef };
}
