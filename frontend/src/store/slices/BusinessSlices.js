import { createSlice } from '@reduxjs/toolkit';
import { logout } from '../actions'

const businessSlice = createSlice({
    name: 'business',
    initialState: {},
    reducers: {
        addBusiness(state, action) {
            return { ...state, ...action.payload };
        }
    },
    extraReducers(builder) {
        builder.addCase(logout, (state, action) => {
            return {}
        })
    }
})

export const { addBusiness } = businessSlice.actions
export const businessReducer = businessSlice.reducer
