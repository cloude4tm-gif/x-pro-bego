import { createHashRouter, redirect } from "react-router-dom";
import { fetch, getServerUrl } from "../service/http";
import { getAuthToken } from "../utils/authStorage";
import { Dashboard } from "./Dashboard";
import { Login } from "./Login";
import { Settings } from "./Settings";
import { AdminLimits } from "./AdminLimits";
import { ConnectionLogs } from "./ConnectionLogs";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { SubscriptionPlans } from "./SubscriptionPlans";
import { ResellerManager } from "./ResellerManager";
import { ApiKeyManager } from "./ApiKeyManager";
import { IpManager } from "./IpManager";
import { AuditLog } from "./AuditLog";
import { WebhookManager } from "./WebhookManager";
import { BackupManager } from "./BackupManager";
import { TelegramBot } from "./TelegramBot";
import { AutomationSettings } from "./AutomationSettings";

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

const protectedRoute = (element: JSX.Element) => ({
    element,
    errorElement: <Login />,
    loader: fetchAdminLoader,
});

export const router = createHashRouter([
    { path: "/", ...protectedRoute(<Dashboard />) },
    { path: "/login", element: <Login /> },
    { path: "/login/", element: <Login /> },
    { path: "/settings", ...protectedRoute(<Settings />) },
    { path: "/admin-limits", ...protectedRoute(<AdminLimits />) },
    { path: "/connection-logs", ...protectedRoute(<ConnectionLogs />) },
    { path: "/analytics", ...protectedRoute(<AnalyticsDashboard />) },
    { path: "/subscription-plans", ...protectedRoute(<SubscriptionPlans />) },
    { path: "/reseller-manager", ...protectedRoute(<ResellerManager />) },
    { path: "/api-keys", ...protectedRoute(<ApiKeyManager />) },
    { path: "/ip-manager", ...protectedRoute(<IpManager />) },
    { path: "/audit-log", ...protectedRoute(<AuditLog />) },
    { path: "/webhooks", ...protectedRoute(<WebhookManager />) },
    { path: "/backup", ...protectedRoute(<BackupManager />) },
    { path: "/telegram-bot", ...protectedRoute(<TelegramBot />) },
    { path: "/automation", ...protectedRoute(<AutomationSettings />) },
]);
