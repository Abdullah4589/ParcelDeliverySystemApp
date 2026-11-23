import { publicRequest } from "../requestMethods";
import { loginFailure, loginStart, loginSuccess } from "./userRedux";

export const login = async (dispatch, credentials) => {
  dispatch(loginStart());
  try {
    const res = await publicRequest.post("/auth/login", credentials);
    dispatch(loginSuccess(res.data));
    return { ok: true, data: res.data };
  } catch (error) {
    const msg =
      error.response?.data?.message ||
      (typeof error.response?.data === "string" ? error.response.data : null) ||
      "Unable to sign in. Please verify your email and password.";
    dispatch(loginFailure(msg));
    return { ok: false, message: msg };
  }
};

export const register = async (dispatch, payload) => {
  dispatch(loginStart());
  try {
    const res = await publicRequest.post("/auth/register", payload);
    dispatch(loginSuccess(res.data));
    return { ok: true, data: res.data };
  } catch (error) {
    const msg =
      error.response?.data?.message ||
      "Registration failed. Please check your details and try again.";
    dispatch(loginFailure(msg));
    return { ok: false, message: msg };
  }
};
