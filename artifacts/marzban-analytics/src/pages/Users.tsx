import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, formatBytes, formatExpiry, formatDate, getStatusColor, getStatusLabel } from "@/lib/marzban";
import { Search, Users as UsersIcon, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_OPTIONS = ["", "active", "disabled", "expired", "limited", "on_hold"];

export default function UsersPage() {
  const { auth } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const PER_PAGE = 15;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(0); }, [debouncedSearch, status]);

  const fetchUsers = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await auth.client.getUsers({
        offset: page * PER_PAGE,
        limit: PER_PAGE,
        status: status || undefined,
        search: debouncedSearch || undefined,
      });
      setUsers(resp.users);
      setTotal(resp.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kullanicilar alinamadi");
    } finally {
      setLoading(false);
    }
  }, [auth, page, debouncedSearch, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kullanicilar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Toplam {total.toLocaleString()} kullanici</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-card-border hover:bg-muted/50 text-sm font-medium transition-all">
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Kullanici adi ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-card-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl bg-card border border-card-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none min-w-[160px]"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s ? getStatusLabel(s) : "Tum Durumlar"}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border bg-muted/30">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kullanici</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Durum</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Veri Kullanimi</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Bitis Tarihi</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Son Cevrimici</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Olusturuldu</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">{error}</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <UsersIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground text-sm">Kullanici bulunamadi</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="wait">
                  {users.map((user, i) => {
                    const usedPercent = user.data_limit && user.data_limit > 0
                      ? Math.min(100, (user.used_traffic / user.data_limit) * 100)
                      : null;

                    return (
                      <motion.tr
                        key={user.username}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-foreground text-sm">{user.username}</div>
                          {user.note && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{user.note}</div>}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${getStatusColor(user.status)}15`,
                              color: getStatusColor(user.status),
                              border: `1px solid ${getStatusColor(user.status)}30`,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(user.status) }} />
                            {getStatusLabel(user.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-foreground">
                            {formatBytes(user.used_traffic)}
                            {user.data_limit && user.data_limit > 0 && (
                              <span className="text-muted-foreground"> / {formatBytes(user.data_limit)}</span>
                            )}
                          </div>
                          {usedPercent !== null && (
                            <div className="mt-1.5 w-28 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${usedPercent}%`,
                                  backgroundColor: usedPercent > 90 ? "#ef4444" : usedPercent > 70 ? "#f59e0b" : "#22c55e",
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground hidden md:table-cell">
                          <div>{formatExpiry(user.expire)}</div>
                          {user.expire && (
                            <div className="text-xs opacity-70">
                              {new Date(user.expire * 1000).toLocaleDateString("tr-TR")}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground hidden lg:table-cell">
                          {user.online_at ? formatDate(user.online_at) : "-"}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground hidden lg:table-cell">
                          {formatDate(user.created_at)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-card-border bg-muted/10">
            <span className="text-sm text-muted-foreground">
              {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} / {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-foreground px-2">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
