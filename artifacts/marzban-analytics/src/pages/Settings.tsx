import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Admin, CreateAdminPayload, User, formatBytes } from "@/lib/marzban";
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Trash2,
  Edit2,
  Save,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Search,
  Lock,
  Wifi,
  WifiOff,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import XProLogo from "@/components/XProLogo";

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium ${
        type === "success"
          ? "bg-chart-2/10 border-chart-2/30 text-chart-2"
          : "bg-destructive/10 border-destructive/30 text-destructive"
      }`}
    >
      {type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
      {msg}
    </motion.div>
  );
}

export default function Settings() {
  const { auth } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState<CreateAdminPayload>({ username: "", password: "", is_sudo: false });
  const [addingAdmin, setAddingAdmin] = useState(false);

  const [editingAdmin, setEditingAdmin] = useState<string | null>(null);
  const [editSudo, setEditSudo] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [savingAdmin, setSavingAdmin] = useState(false);

  const [deletingAdmin, setDeletingAdmin] = useState<string | null>(null);

  const [ipLimitUser, setIpLimitUser] = useState<User | null>(null);
  const [ipLimitValue, setIpLimitValue] = useState("");
  const [savingIpLimit, setSavingIpLimit] = useState(false);

  const showToast = (msg: string, type: "success" | "error") => setToast({ msg, type });

  const loadAdmins = useCallback(async () => {
    if (!auth) return;
    setLoadingAdmins(true);
    setAdminError(null);
    try {
      const list = await auth.client.getAdmins();
      setAdmins(list);
    } catch (e) {
      setAdminError(e instanceof Error ? e.message : "Admin listesi alinamadi");
    } finally {
      setLoadingAdmins(false);
    }
  }, [auth]);

  const loadUsers = useCallback(async () => {
    if (!auth) return;
    setLoadingUsers(true);
    try {
      const res = await auth.client.getUsers({ limit: 100, search: userSearch });
      setUsers(res.users);
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [auth, userSearch]);

  useEffect(() => { loadAdmins(); }, [loadAdmins]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!auth) return;
    setAddingAdmin(true);
    try {
      const created = await auth.client.createAdmin(newAdmin);
      setAdmins(prev => [...prev, created]);
      setNewAdmin({ username: "", password: "", is_sudo: false });
      setShowAddAdmin(false);
      showToast(`"${created.username}" eklendi`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Eklenemedi", "error");
    } finally {
      setAddingAdmin(false);
    }
  }

  async function handleSaveAdmin(username: string) {
    if (!auth) return;
    setSavingAdmin(true);
    try {
      const payload: Partial<Admin & { password?: string }> = { is_sudo: editSudo };
      if (editPassword) payload.password = editPassword;
      const updated = await auth.client.updateAdmin(username, payload);
      setAdmins(prev => prev.map(a => a.username === username ? updated : a));
      setEditingAdmin(null);
      setEditPassword("");
      showToast(`"${username}" guncellendi`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Guncellenemedi", "error");
    } finally {
      setSavingAdmin(false);
    }
  }

  async function handleDeleteAdmin(username: string) {
    if (!auth) return;
    setDeletingAdmin(username);
    try {
      await auth.client.deleteAdmin(username);
      setAdmins(prev => prev.filter(a => a.username !== username));
      showToast(`"${username}" silindi`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Silinemedi", "error");
    } finally {
      setDeletingAdmin(null);
    }
  }

  async function handleSaveIpLimit() {
    if (!auth || !ipLimitUser) return;
    setSavingIpLimit(true);
    try {
      const limitNum = parseInt(ipLimitValue.trim(), 10);
      const noteBase = (ipLimitUser.note ?? "").replace(/\[IP_LIMIT:\d+\]/g, "").trim();
      const newNote = limitNum > 0
        ? `${noteBase} [IP_LIMIT:${limitNum}]`.trim()
        : noteBase;
      await auth.client.setUserNote(ipLimitUser.username, newNote);
      showToast(`"${ipLimitUser.username}" icin IP limiti kaydedildi`, "success");
      setIpLimitUser(null);
      setIpLimitValue("");
      loadUsers();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Kaydedilemedi", "error");
    } finally {
      setSavingIpLimit(false);
    }
  }

  function getIpLimit(user: User): number | null {
    const match = user.note?.match(/\[IP_LIMIT:(\d+)\]/);
    return match ? parseInt(match[1], 10) : null;
  }

  return (
    <div className="p-6 space-y-8 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-4">
        <XProLogo size={40} animated />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ayarlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Admin yonetimi ve kullanici IP limitleri</p>
        </div>
      </div>

      {/* ── ADMIN MANAGER ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Admin Yoneticisi</h2>
            <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">{admins.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAdmins}
              className="p-2 rounded-lg bg-card border border-card-border hover:bg-muted/50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAdmins ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowAddAdmin(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Admin Ekle
            </button>
          </div>
        </div>

        {adminError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {adminError}
          </div>
        )}

        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          {loadingAdmins ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : admins.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Admin bulunamadi</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kullanici Adi</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Yetki</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Islemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {admins.map(admin => (
                  <tr key={admin.username} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-sm">{admin.username[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{admin.username}</div>
                          {admin.telegram_id && (
                            <div className="text-xs text-muted-foreground">TG: {admin.telegram_id}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {editingAdmin === admin.username ? (
                        <button
                          type="button"
                          onClick={() => setEditSudo(s => !s)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                            editSudo
                              ? "bg-chart-3/10 border-chart-3/30 text-chart-3"
                              : "bg-muted border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {editSudo ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          {editSudo ? "Sudo" : "Normal"}
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </button>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          admin.is_sudo
                            ? "bg-chart-3/10 border-chart-3/30 text-chart-3"
                            : "bg-muted border-border text-muted-foreground"
                        }`}>
                          {admin.is_sudo ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                          {admin.is_sudo ? "Sudo Admin" : "Normal Admin"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {editingAdmin === admin.username ? (
                          <>
                            <input
                              type="password"
                              value={editPassword}
                              onChange={e => setEditPassword(e.target.value)}
                              placeholder="Yeni sifre (opsiyonel)"
                              className="px-3 py-1.5 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-44"
                            />
                            <button
                              onClick={() => handleSaveAdmin(admin.username)}
                              disabled={savingAdmin}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                            >
                              {savingAdmin ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              Kaydet
                            </button>
                            <button
                              onClick={() => { setEditingAdmin(null); setEditPassword(""); }}
                              className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingAdmin(admin.username); setEditSudo(admin.is_sudo); setEditPassword(""); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium text-foreground transition-all border border-border"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Duzenle
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin.username)}
                              disabled={deletingAdmin === admin.username}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-medium transition-all border border-destructive/20 disabled:opacity-50"
                            >
                              {deletingAdmin === admin.username
                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />}
                              Sil
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Admin Modal */}
        <AnimatePresence>
          {showAddAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={e => { if (e.target === e.currentTarget) setShowAddAdmin(false); }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 16 }}
                className="bg-card border border-card-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Yeni Admin Ekle</h3>
                  </div>
                  <button onClick={() => setShowAddAdmin(false)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Kullanici Adi</label>
                    <input
                      type="text"
                      required
                      value={newAdmin.username}
                      onChange={e => setNewAdmin(p => ({ ...p, username: e.target.value }))}
                      placeholder="admin_adi"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Sifre</label>
                    <input
                      type="password"
                      required
                      value={newAdmin.password}
                      onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                    <div>
                      <div className="text-sm font-medium text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-chart-3" />
                        Sudo Admin
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Tam yonetici yetkisi verir</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewAdmin(p => ({ ...p, is_sudo: !p.is_sudo }))}
                      className={`relative w-11 h-6 rounded-full transition-all ${newAdmin.is_sudo ? "bg-primary" : "bg-muted"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${newAdmin.is_sudo ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAdmin(false)}
                      className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-all"
                    >
                      Vazgec
                    </button>
                    <button
                      type="submit"
                      disabled={addingAdmin}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {addingAdmin ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Ekle
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── IP LIMIT ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-chart-2" />
            <h2 className="text-lg font-semibold text-foreground">IP Limit Yonetimi</h2>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            placeholder="Kullanici ara..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-card-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">Kullanici bulunamadi</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kullanici</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Trafik</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">IP Limiti</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Islem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {users.slice(0, 20).map(user => {
                  const ipLimit = getIpLimit(user);
                  return (
                    <tr key={user.username} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground text-sm">{user.username}</div>
                        <div className={`text-xs mt-0.5 ${user.status === "active" ? "text-chart-2" : "text-muted-foreground"}`}>
                          {user.status === "active" ? "Aktif" : user.status === "disabled" ? "Devre Disi" : user.status === "expired" ? "Suresi Dolmus" : user.status === "limited" ? "Limitli" : "Beklemede"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="text-sm text-foreground">
                          {formatBytes(user.used_traffic)}
                          {user.data_limit ? <span className="text-muted-foreground"> / {formatBytes(user.data_limit)}</span> : <span className="text-muted-foreground"> / Sinirsiz</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {ipLimit ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                            <Wifi className="w-3.5 h-3.5" />
                            {ipLimit} IP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <WifiOff className="w-3.5 h-3.5" />
                            Limit yok
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setIpLimitUser(user);
                            setIpLimitValue(ipLimit ? String(ipLimit) : "");
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium text-foreground border border-border transition-all ml-auto"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Limit Ayarla
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* IP Limit Modal */}
        <AnimatePresence>
          {ipLimitUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={e => { if (e.target === e.currentTarget) setIpLimitUser(null); }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 16 }}
                className="bg-card border border-card-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">IP Limit Ayarla</h3>
                  </div>
                  <button onClick={() => setIpLimitUser(null)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  <span className="font-semibold text-foreground">{ipLimitUser.username}</span> kullanicisi icin maksimum eş zamanli IP sayisi
                </p>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Maksimum IP Sayisi</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={ipLimitValue}
                    onChange={e => setIpLimitValue(e.target.value)}
                    placeholder="0 = limit yok"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">0 veya bos birakirsaniz limit kaldirilir</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIpLimitUser(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-all"
                  >
                    Vazgec
                  </button>
                  <button
                    onClick={handleSaveIpLimit}
                    disabled={savingIpLimit}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {savingIpLimit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Kaydet
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
