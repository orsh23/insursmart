import React, { createContext, useContext, useReducer } from 'react';

const BoMContext = createContext(null);
const BoMDispatchContext = createContext(null);

const initialState = {
  procedure_code_type: "CPT",
  procedure_code_number: "",
  material_id: "",
  variant_id: "",
  supplier_id: "",
  price: 0,
  amount_type: "fixed",
  quantity: 1,
  min_quantity: 0,
  max_quantity: 0,
  average_quantity: 0,
  is_optional: false,
  notes: "",
  // UI state
  availableVariants: [],
  availableSuppliers: [],
  loading: {
    variants: false,
    suppliers: false,
    pricing: false
  }
};

function bomReducer(state, action) {
  switch (action.type) {
    case 'SET_MATERIAL':
      return {
        ...state,
        material_id: action.payload,
        variant_id: "", // Reset dependent fields
        supplier_id: "",
        price: 0
      };
    case 'SET_VARIANTS':
      return {
        ...state,
        availableVariants: action.payload
      };
    case 'SET_SUPPLIERS':
      return {
        ...state,
        availableSuppliers: action.payload
      };
    case 'SET_VARIANT':
      return {
        ...state,
        variant_id: action.payload
      };
    case 'SET_SUPPLIER':
      return {
        ...state,
        supplier_id: action.payload,
        price: action.price || state.price
      };
    case 'SET_AMOUNT_TYPE':
      return {
        ...state,
        amount_type: action.payload,
        // Reset quantities based on type
        quantity: action.payload === 'fixed' ? state.quantity : 0,
        min_quantity: action.payload === 'range' ? state.min_quantity : 0,
        max_quantity: action.payload === 'range' ? state.max_quantity : 0,
        average_quantity: action.payload === 'average' ? state.average_quantity : 0
      };
    case 'UPDATE_QUANTITIES':
      return {
        ...state,
        ...action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.key]: action.value
        }
      };
    case 'RESET_FORM':
      return initialState;
    default:
      return state;
  }
}

export function BoMProvider({ children }) {
  const [state, dispatch] = useReducer(bomReducer, initialState);

  return (
    <BoMContext.Provider value={state}>
      <BoMDispatchContext.Provider value={dispatch}>
        {children}
      </BoMDispatchContext.Provider>
    </BoMContext.Provider>
  );
}

export function useBoM() {
  const context = useContext(BoMContext);
  const dispatch = useContext(BoMDispatchContext);
  if (!context || !dispatch) {
    throw new Error('useBoM must be used within a BoMProvider');
  }
  return [context, dispatch];
}