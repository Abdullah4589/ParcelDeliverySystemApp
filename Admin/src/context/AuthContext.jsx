import { createContext, useContext, useState } from "react";
import { publicRequest } from "../requestMethods";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem("sendit_admin_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    const res = await publicRequest.post("/auth/login", { email, password });
    const user = res.data;
    if (user.role !== "admin") {
      throw new Error(
        "Admin role required. Please sign in with an administrator account."
      );
    }
    localStorage.setItem("sendit_admin_user", JSON.stringify(user));
    setAdminUser(user);
    return user;
  };

  const updateAdmin = (patch) => {
    setAdminUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem("sendit_admin_user", JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem("sendit_admin_user");
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider value={{ adminUser, login, logout, updateAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
