import { create } from 'zustand';
import { CommandOutput } from '../types';

interface TerminalStore {
    history: string[];
    outputs: CommandOutput[];
    currentCommand: string;
    isExecuting: boolean;

    // Actions
    addToHistory: (command: string) => void;
    addOutput: (output: CommandOutput) => void;
    setCurrentCommand: (command: string) => void;
    setIsExecuting: (executing: boolean) => void;
    clearHistory: () => void;
    clearOutputs: () => void;
}

export const useTerminalStore = create<TerminalStore>((set) => ({
    history: [],
    outputs: [],
    currentCommand: '',
    isExecuting: false,

    addToHistory: (command) =>
        set((state) => ({
            history: [...state.history, command],
        })),

    addOutput: (output) =>
        set((state) => ({
            outputs: [...state.outputs, output],
        })),

    setCurrentCommand: (command) =>
        set({ currentCommand: command }),

    setIsExecuting: (executing) =>
        set({ isExecuting: executing }),

    clearHistory: () =>
        set({ history: [] }),

    clearOutputs: () =>
        set({ outputs: [] }),
}));
