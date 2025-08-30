import { createSlice } from '@reduxjs/toolkit';
import { logout } from '../actions';

const userSlice = createSlice({
  name: 'user',
  initialState: {},
  reducers: {
    addUser(state, action) {
      return { ...state, ...action.payload };
    },
  },
  extraReducers(builder) {
    builder.addCase(logout, (state, action) => {
      return {};
    });
  },
});

export const { addUser } = userSlice.actions;
export const userReducer = userSlice.reducer;
