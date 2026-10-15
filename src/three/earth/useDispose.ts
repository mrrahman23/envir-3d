import { useEffect } from "react";

type Disposable = { dispose: () => void } | null | undefined;

const pending = new WeakMap<object, number>();

/**
 * Disposes GPU resources on unmount, one tick late. A StrictMode/remount cycle (cleanup → setup
 * with the same objects) cancels the dispose, so a program being compiled in parallel
 * (compileAsync) is never deleted under the driver's feet.
 */
export function useDispose(...objects: Disposable[]) {
  useEffect(() => {
    for (const o of objects) {
      if (!o) continue;
      window.clearTimeout(pending.get(o));
      pending.delete(o);
    }
    return () => {
      for (const o of objects) {
        if (!o) continue;
        pending.set(
          o,
          window.setTimeout(() => {
            pending.delete(o);
            o.dispose();
          }, 0),
        );
      }
    };
    // The objects themselves are the dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, objects);
}
