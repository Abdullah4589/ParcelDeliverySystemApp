import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    currentUser: null,
    isFetching: false,
    error: false,
    errorMessage: "",
  },
  reducers: {
    loginStart: (state) => {
      state.isFetching = true;
      state.error = false;
      state.errorMessage = "";
    },
    loginSuccess: (state, action) => {
      state.isFetching = false;
      state.currentUser = action.payload;
      state.error = false;
      state.errorMessage = "";
    },
    loginFailure: (state, action) => {
      state.isFetching = false;
      state.error = true;
      state.errorMessage =
        action.payload || "Invalid credentials. Please try again.";
    },
    updateUserSuccess: (state, action) => {
      if (state.currentUser) {
        state.currentUser = {
          ...state.currentUser,
          ...action.payload,
        };
      }
    },
    clearError: (state) => {
      state.error = false;
      state.errorMessage = "";
    },
    logOut: (state) => {
      state.isFetching = false;
      state.currentUser = null;
      state.error = false;
      state.errorMessage = "";
    },
  },
});

export const {
  loginFailure,
  loginStart,
  loginSuccess,
  updateUserSuccess,
  clearError,
  logOut,
} = userSlice.actions;

export default userSlice.reducer;
