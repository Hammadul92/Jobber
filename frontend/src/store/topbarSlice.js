// store/topbarSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  title: "",
  description: "",
  action: null,
};

const topbarSlice = createSlice({
  name: "topbar",
  initialState,
  reducers: {
    setTopbar: (state, action) => {
      state.title = action.payload.title || "";
      state.description = action.payload.description || "";
      state.action = action.payload.action || null;
    },
    resetTopbar: () => initialState,
  },
});

export const { setTopbar, resetTopbar } = topbarSlice.actions;
export const topbarReducer = topbarSlice.reducer;