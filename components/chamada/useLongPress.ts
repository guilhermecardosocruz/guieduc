import { useCallback, useEffect, useRef } from "react";

type Options = {
  ms?: number;
  onLongPress: () => void;
  onClick?: () => void;
};

export function useLongPress({ ms = 500, onLongPress, onClick }: Options) {
  const timerRef = useRef<number | null>(null);
  const longPressedRef = useRef(false);

  const start = useCallback(() => {
    longPressedRef.current = false;
    timerRef.current = window.setTimeout(() => {
      longPressedRef.current = true;
      onLongPress();
    }, ms);
  }, [ms, onLongPress]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onMouseDown = useCallback(() => start(), [start]);
  const onMouseUp = useCallback(() => {
    if (!longPressedRef.current && onClick) onClick();
    clear();
  }, [clear, onClick]);

  const onTouchStart = useCallback(() => start(), [start]);
  const onTouchEnd = useCallback(() => {
    if (!longPressedRef.current && onClick) onClick();
    clear();
  }, [clear, onClick]);

  useEffect(() => () => clear(), [clear]);

  return { onMouseDown, onMouseUp, onTouchStart, onTouchEnd };
}
