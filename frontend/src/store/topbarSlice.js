// store/topbarSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  title: "",
  description: "",
  action: null,
  // Extra buttons shown before the main action, same shape as `action`.
  secondaryActions: [],
};

const topbarSlice = createSlice({
  name: "topbar",
  initialState,
  reducers: {
    setTopbar: (state, action) => {
      state.title = action.payload.title || "";
      state.description = action.payload.description || "";
      state.action = action.payload.action || null;
      state.secondaryActions = action.payload.secondaryActions || [];
    },
    resetTopbar: () => initialState,
  },
});

export const { setTopbar, resetTopbar } = topbarSlice.actions;
export const topbarReducer = topbarSlice.reducer;
