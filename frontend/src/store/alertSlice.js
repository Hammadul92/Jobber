// store/alertSlice.js
import { createSlice } from "@reduxjs/toolkit";

// Toasts shown in the top-right corner by <AlertHost />.
const MAX_ALERTS = 3;
let nextId = 1;

const sameAlert = (a, b) =>
  a.type === b.type && JSON.stringify(a.message) === JSON.stringify(b.message);

const alertSlice = createSlice({
  name: "alerts",
  initialState: [],
  reducers: {
    showAlert: {
      // Showing the same alert again replaces it instead of stacking a copy.
      reducer: (state, action) =>
        [...state.filter((alert) => !sameAlert(alert, action.payload)), action.payload].slice(
          -MAX_ALERTS,
        ),
      prepare: ({ type = "info", message, autoDismiss }) => ({
        payload: { id: nextId++, type, message, autoDismiss },
      }),
    },
    dismissAlert: (state, action) =>
      state.filter((alert) => alert.id !== action.payload),
  },
});

export const { showAlert, dismissAlert } = alertSlice.actions;
export const alertReducer = alertSlice.reducer;
