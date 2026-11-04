/**
 * Polyfill for React Native 0.88+ compatibility.
 * This MUST be loaded before any other React Native modules.
 * React Native 0.88+ removed InteractionManager from core.
 * React Navigation 7.x expects it.
 *
 * This file is imported at the top of App.tsx, so it must be a valid ES module.
 */

// Define InteractionManager BEFORE any other React Native modules are loaded
if (typeof globalThis !== 'undefined' && !globalThis.InteractionManager) {
  globalThis.InteractionManager = {
    createInteractionHandle: (function () {
      let counter = 0;
      return function () { return counter++; };
    })(),
    clearInteractionHandle: function (handle) {
      // No-op: handle is just a number in this shim
    },
    // Common methods used by navigation
    addEventListener: function (eventType, listener) {
      // No-op
      return function () {};
    },
    removeEventListener: function (eventType, listener) {
      // No-op
    },
    setIdleCallback: function (callback) {
      // Not used in this context
      return function () {};
    },
    runOnJS: function (fn) {
      return fn;
    },
    measure: function () {
      return null;
    },
    shouldSetIdleCallback: false,
  };
}

// Also check if global exists (Node.js environment)
if (typeof global !== 'undefined' && !global.InteractionManager) {
  global.InteractionManager = globalThis.InteractionManager;
}

// Polyfill for react-native: StyleSheet
// This must be loaded before any React Native modules that use StyleSheet
if (typeof global !== 'undefined') {
  if (typeof global.StyleSheet !== 'function' && typeof global.StyleSheet !== 'object') {
    global.StyleSheet = {
      create: function (styles) {
        return styles;
      },
      flatten: function (styles) {
        return styles;
      },
      compose: function (styles) {
        return styles;
      },
      absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
      absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
      direction: { rtl: false },
      hairlineWidth: 1,
      selectable: 'inherit',
      etag: '1',
    };
  }
}
if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.StyleSheet !== 'function' && typeof globalThis.StyleSheet !== 'object') {
    globalThis.StyleSheet = {
      create: function (styles) {
        return styles;
      },
      flatten: function (styles) {
        return styles;
      },
      compose: function (styles) {
        return styles;
      },
      absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
      absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
      direction: { rtl: false },
      hairlineWidth: 1,
      selectable: 'inherit',
      etag: '1',
    };
  }
}
