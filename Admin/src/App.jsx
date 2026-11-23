import { useState } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Menu from "./components/Menu";
import Home from "./pages/Home";
import Parcels from "./pages/Parcels";
import Users from "./pages/Users";
import NewParcel from "./pages/NewParcel";
import NewUsers from "./pages/NewUsers";
import Parcel from "./pages/Parcel";
import Login from "./pages/Login";
import Analytics from "./pages/Analytics";
import Calendar from "./pages/Calendar";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import Backups from "./pages/Backups";
import Profile from "./pages/Profile";

import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";

const ProtectedLayout = () => {
  const { adminUser } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);

  if (!adminUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Menu mobileOpen={mobileMenu} onClose={() => setMobileMenu(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setMobileMenu(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

function App() {
  const { adminUser } = useAuth();
  const { theme } = useTheme();

  const router = createBrowserRouter([
    {
      path: "/login",
      element: adminUser ? <Navigate to="/" replace /> : <Login />,
    },
    {
      path: "/",
      element: <ProtectedLayout />,
      children: [
        { path: "/", element: <Home /> },
        { path: "/parcels", element: <Parcels /> },
        { path: "/users", element: <Users /> },
        { path: "/newparcel", element: <NewParcel /> },
        { path: "/newuser", element: <NewUsers /> },
        { path: "/parcel/:id", element: <Parcel /> },
        { path: "/analytics", element: <Analytics /> },
        { path: "/calendar", element: <Calendar /> },
        { path: "/logs", element: <Logs /> },
        { path: "/settings", element: <Settings /> },
        { path: "/backups", element: <Backups /> },
        { path: "/profile", element: <Profile /> },
      ],
    },
    { path: "*", element: <Navigate to="/" replace /> },
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer
        position="bottom-right"
        theme={theme === "dark" ? "dark" : "light"}
        autoClose={3000}
      />
    </>
  );
}

export default App;
