import * as React from "react"

// Define a limit for toasts if desired, e.g., 5
const TOAST_LIMIT = 5; 
const TOAST_REMOVE_DELAY = 5000; // Auto-remove delay in ms (e.g., 5 seconds)

// In-memory store for toasts
let memoryState = { toasts: [] };

// Array of listener functions
const listeners = new Set();

// Counter for generating unique IDs
let toastCount = 0;

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return toastCount.toString();
}

// Map to store timeouts for toast removal
const toastTimeouts = new Map();

// Function to dispatch actions to update the toast state
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

// Reducer function to manage toast state
const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      // Add new toast and ensure we don't exceed the limit
      const newToasts = [action.toast, ...state.toasts].slice(0, TOAST_LIMIT);
      return { ...state, toasts: newToasts };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST":
      const { toastId } = action;
      // If a toastId is provided, mark that toast as closed
      // Otherwise, mark all toasts as closed
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false } // Mark as not open
            : t
        ),
      };

    case "REMOVE_TOAST":
      // If toastId is undefined, remove all toasts
      if (action.toastId === undefined) {
        // Clear all timeouts before removing all toasts
        toastTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        toastTimeouts.clear();
        return { ...state, toasts: [] };
      }
      // Otherwise, filter out the toast with the specified ID
      // Clear the timeout for the removed toast
      if (toastTimeouts.has(action.toastId)) {
        clearTimeout(toastTimeouts.get(action.toastId));
        toastTimeouts.delete(action.toastId);
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

// Function to add a toast to the removal queue
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId)); // Clear existing timeout
  }

  const timeout = setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", toastId }); // Changed from DISMISS_TOAST to REMOVE_TOAST
    // No need to delete from toastTimeouts here, it's done in REMOVE_TOAST reducer or when a new timeout is set
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};


// Public function to create a toast
function toast(props) {
  const id = genId();

  const update = (newProps) => {
    dispatch({ type: "UPDATE_TOAST", toast: { ...newProps, id } });
  };

  const dismiss = () => {
    // This action now just marks the toast as 'open: false'
    dispatch({ type: "DISMISS_TOAST", toastId: id }); 
    // The actual removal is handled by addToRemoveQueue timeout or if a toast is dismissed manually before timeout
    // If you want immediate removal on dismiss, then dispatch REMOVE_TOAST here and clear its timeout
  };
  
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => { 
        if (!open) {
          // When Radix (or our Toast component) calls onOpenChange(false),
          // we want to initiate the removal process if it's not already timed out.
          // This typically happens if user manually clicks the close button.
          addToRemoveQueue(id); // Restart or start the removal timeout
        }
      },
    },
  });

  // Start removal timeout when toast is added
  addToRemoveQueue(id);

  return { id, dismiss, update };
}

// Hook to use toasts
function useToast() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
      // Cleanup all timeouts when the hook unmounts (e.g. app closes)
      // This might be too aggressive if multiple useToast instances exist and one unmounts.
      // Better to manage timeouts individually.
    };
  }, []); 

  return {
    ...state,
    toast,
    dismiss: (toastId) => { // Allow dismissing a specific toast by ID or all if ID is undefined
      dispatch({ type: "DISMISS_TOAST", toastId });
      if (toastId) { // If a specific toast is dismissed, ensure its removal timer is active
        addToRemoveQueue(toastId);
      } else { // If dismissing all, clear all existing timeouts and remove immediately or let them fade
         state.toasts.forEach(t => addToRemoveQueue(t.id)); // Re-trigger timeout for all
      }
    },
  };
}

export { useToast, toast };