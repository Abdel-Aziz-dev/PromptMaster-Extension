
import { useState, useCallback, useRef } from 'react';

// Simple deep equality check for JSON-serializable objects
// This is sufficient for the app's state complexity (shallow objects or strings)
function isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

interface UndoRedoConfig {
  debounceTime?: number;
  historyLimit?: number;
}

export default function useUndoRedo<T>(initialState: T, config: UndoRedoConfig = {}) {
  const { debounceTime = 700, historyLimit = 50 } = config;

  // State for rendering
  const [present, setPresent] = useState<T>(initialState);
  
  // History Stacks
  // We keep these in state to trigger re-renders when history depth changes (updating UI buttons)
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);

  // Refs for synchronous access logic to avoid stale closures
  const presentRef = useRef<T>(initialState);
  const lastSavedRef = useRef<T>(initialState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to safely update past with a limit
  const pushToPast = (newItem: T) => {
    setPast(prev => {
      const newPast = [...prev, newItem];
      if (newPast.length > historyLimit) {
        newPast.shift(); // Remove oldest
      }
      return newPast;
    });
  };

  const undo = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Case 1: Unsaved changes (Dirty State)
    // If the user has typed but debounce hasn't fired, 'present' is different from 'lastSaved'.
    // Undo should simply revert to the 'lastSaved' checkpoint (undoing the typing).
    if (!isEqual(presentRef.current, lastSavedRef.current)) {
      const dirtyState = presentRef.current;
      setFuture(prev => [dirtyState, ...prev]);
      
      const stableState = lastSavedRef.current;
      setPresent(stableState);
      presentRef.current = stableState;
      return;
    }

    // Case 2: Standard Undo
    setPast(prevPast => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, prevPast.length - 1);

      setFuture(prevFuture => [presentRef.current, ...prevFuture]);
      
      setPresent(previous);
      presentRef.current = previous;
      lastSavedRef.current = previous; // The reverted state becomes the new stable baseline
      
      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setFuture(prevFuture => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      pushToPast(presentRef.current);

      setPresent(next);
      presentRef.current = next;
      lastSavedRef.current = next;
      
      return newFuture;
    });
  }, [historyLimit]);

  const update = useCallback((newState: T, immediate = false) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const currentPresent = presentRef.current;

    // Optimization: Ignore identical updates
    if (isEqual(newState, currentPresent)) return;

    if (immediate) {
      // Immediate Action (e.g., Clear All, Apply Template)
      
      // 1. If there is a pending "dirty" state (typing in progress), commit it first.
      // This ensures we don't lose the text typed right before clicking 'Clear'.
      if (!isEqual(currentPresent, lastSavedRef.current)) {
        pushToPast(lastSavedRef.current);
        lastSavedRef.current = currentPresent;
      }

      // 2. Commit the transition to the New State
      pushToPast(lastSavedRef.current); // Save the state we are leaving
      
      setPresent(newState);
      presentRef.current = newState;
      lastSavedRef.current = newState;
      setFuture([]); // New branch, clear redo history
      
    } else {
      // Debounced Update (e.g., Typing)
      
      // 1. Update the visual state immediately
      setPresent(newState);
      presentRef.current = newState;
      // Note: We do NOT update lastSavedRef yet. It points to the state before typing started.

      // 2. Schedule the commit
      timeoutRef.current = setTimeout(() => {
        pushToPast(lastSavedRef.current);
        lastSavedRef.current = newState;
        setFuture([]); // New branch
        timeoutRef.current = null;
      }, debounceTime);
    }
  }, [debounceTime, historyLimit]);

  const init = useCallback((state: T) => {
    setPresent(state);
    presentRef.current = state;
    lastSavedRef.current = state;
    setPast([]);
    setFuture([]);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  // Calculate flags based on Ref/State mismatch (dirty) or history length
  const isDirty = !isEqual(present, lastSavedRef.current);
  const canUndo = past.length > 0 || isDirty;
  const canRedo = future.length > 0;

  return { 
    state: present, 
    update, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    init 
  };
}
