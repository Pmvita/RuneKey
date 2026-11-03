/**
 * Pre-import polyfill for React Native 0.88+ compatibility.
 * This MUST be imported before any other React Native modules.
 * React Native 0.88+ removed InteractionManager from core;
 * React Navigation 7.x expects it.
 */

// InteractionManager shim for React Navigation 7.x compatibility
// React Navigation 7.x expects createInteractionHandle() and clearInteractionHandle(handle)
// React Native 0.88+ removed InteractionManager from core; it's now a separate package

let interactionHandleCounter = 0;

if (typeof globalThis !== 'undefined') {
  (globalThis as any).InteractionManager = {
    createInteractionHandle: () => ++interactionHandleCounter,
    clearInteractionHandle: (handle: number) => {
      // No-op: handle is just a number in this shim
    },
    // Common methods used by navigation
    addEventListener: () => () => {},
    removeEventListener: () => {},
    setIdleCallback: (callback: () => void) => {
      // Not used in this context
      return () => {};
    },
    runOnJS: (fn: (...args: any[]) => void) => fn,
    measure: () => null,
    shouldSetIdleCallback: false,
  };
}

// Also check if global exists (Node.js environment)
if (typeof global !== 'undefined') {
  (global as any).InteractionManager = (globalThis as any).InteractionManager;
}
