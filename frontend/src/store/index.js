import { configureStore } from '@reduxjs/toolkit';
import { userReducer, addUser } from './slices/UserSlices';
import { businessReducer, addBusiness } from './slices/BusinessSlices';
import { logout } from './actions'


const store = configureStore({
    reducer: {
        user: userReducer,
        business: businessReducer
    }
})


export { store, logout, addUser, addBusiness }
