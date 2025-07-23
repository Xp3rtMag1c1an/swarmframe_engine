// Note: Execution state is already in swarmStore. This file can be used for additional execution-specific logic if needed in the future.
import { create } from 'zustand';

export const useExecutionStore = create((set) => ({
  // Additional execution state can be added here if required
  debugMode: false,
  toggleDebug: () => set((state) => ({ debugMode: !state.debugMode })),
})); 