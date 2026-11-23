import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TrackParcel from "./pages/TrackParcel";
import MyParcels from "./pages/MyParcels";
import BookParcel from "./pages/BookParcel";
import Parcels from "./pages/Parcels";
import Parcel from "./pages/Parcel";
import Statements from "./pages/Statements";
import Profile from "./pages/Profile";
import { useTheme } from "./context/ThemeContext";

function App() {
  const user = useSelector((state) => state.user);
  const { theme } = useTheme();
  const isAuthed = Boolean(user.currentUser);

  const router = createBrowserRouter([
    { path: "/", element: <Home /> },
    { path: "/track", element: <TrackParcel /> },
    { path: "/track/:code", element: <TrackParcel /> },
    {
      path: "/login",
      element: isAuthed ? <Navigate to="/myparcels" replace /> : <Login />,
    },
    {
      path: "/register",
      element: isAuthed ? <Navigate to="/myparcels" replace /> : <Register />,
    },
    {
      path: "/myparcels",
      element: isAuthed ? <MyParcels /> : <Navigate to="/login" replace />,
    },
    {
      path: "/book",
      element: isAuthed ? <BookParcel /> : <Navigate to="/login" replace />,
    },
    {
      path: "/allparcels",
      element: isAuthed ? <Parcels /> : <Navigate to="/login" replace />,
    },
    {
      path: "/parcel/:id",
      element: isAuthed ? <Parcel /> : <Navigate to="/login" replace />,
    },
    {
      path: "/statements",
      element: isAuthed ? <Statements /> : <Navigate to="/login" replace />,
    },
    {
      path: "/profile",
      element: isAuthed ? <Profile /> : <Navigate to="/login" replace />,
    },
    { path: "*", element: <Navigate to="/" replace /> },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <RouterProvider router={router} />
      <ToastContainer
        position="bottom-right"
        theme={theme === "dark" ? "dark" : "light"}
        autoClose={3500}
      />
    </div>
  );
}

export default App;
