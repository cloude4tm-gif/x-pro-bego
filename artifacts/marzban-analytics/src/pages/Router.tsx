import { createHashRouter, redirect } from "react-router-dom";
import { fetch, getServerUrl } from "../service/http";
import { getAuthToken } from "../utils/authStorage";
import { Dashboard } from "./Dashboard";
import { Login } from "./Login";
import { Settings } from "./Settings";
import { AdminLimits } from "./AdminLimits";
import { ConnectionLogs } from "./ConnectionLogs";

const fetchAdminLoader = () => {
    const token = getAuthToken();
    const serverUrl = getServerUrl();
    if (!token || !serverUrl) {
        return redirect("/login");
    }
    return fetch("/admin", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).catch(() => {
        return redirect("/login");
    });
};

export const router = createHashRouter([
    {
        path: "/",
        element: <Dashboard />,
        errorElement: <Login />,
        loader: fetchAdminLoader,
    },
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/login/",
        element: <Login />,
    },
    {
        path: "/settings",
        element: <Settings />,
        errorElement: <Login />,
        loader: fetchAdminLoader,
    },
    {
        path: "/admin-limits",
        element: <AdminLimits />,
        errorElement: <Login />,
        loader: fetchAdminLoader,
    },
    {
        path: "/connection-logs",
        element: <ConnectionLogs />,
        errorElement: <Login />,
        loader: fetchAdminLoader,
    },
]);
