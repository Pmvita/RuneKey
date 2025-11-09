import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ViewStyle } from 'react-native';

import SelectionHighlight from './SelectionHighlight';

type SelectionHighlightContextValue = {
  activeKey: string | null;
  trigger: number;
  setHighlight: (key: string | null) => void;
};

const SelectionHighlightContext = createContext<SelectionHighlightContextValue | null>(null);

export const SelectionHighlightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const setHighlight = useCallback((key: string | null) => {
    setActiveKey(key);
    setTrigger((current) => current + 1);
  }, []);

  const value = useMemo<SelectionHighlightContextValue>(() => ({ activeKey, trigger, setHighlight }), [activeKey, trigger, setHighlight]);

  return <SelectionHighlightContext.Provider value={value}>{children}</SelectionHighlightContext.Provider>;
};

export const useSelectionHighlight = () => {
  const context = useContext(SelectionHighlightContext);
  if (!context) {
    throw new Error('useSelectionHighlight must be used within a SelectionHighlightProvider');
  }
  return context;
};

type SelectionHighlightOverlayProps = {
  highlightKey: string;
  color?: string;
  borderRadius?: number;
  style?: ViewStyle;
};

export const SelectionHighlightOverlay: React.FC<SelectionHighlightOverlayProps> = ({ highlightKey, color, borderRadius, style }) => {
  const { activeKey, trigger } = useSelectionHighlight();
  const isActive = activeKey === highlightKey;
  const triggerKey = isActive ? `${highlightKey}:${trigger}` : undefined;

  return (
    <SelectionHighlight
      active={isActive}
      triggerKey={triggerKey}
      color={color}
      borderRadius={borderRadius}
      style={style}
    />
  );
};
