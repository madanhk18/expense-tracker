"use client";

import { createContext, useContext } from "react";
import { DEFAULT_PREFERENCES, type Preferences } from "@/lib/preferences";

const PreferencesContext = createContext<Preferences>(DEFAULT_PREFERENCES);

/** Makes the signed-in user's preferences available to client components. */
export function PreferencesProvider({ value, children }: { value: Preferences; children: React.ReactNode }) {
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
