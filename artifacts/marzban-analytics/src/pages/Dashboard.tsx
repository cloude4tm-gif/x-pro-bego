import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  SystemStats,
  User,
  NodeUsage,
  formatBytes,
  formatSpeed,
  getStatusColor,
  getStatusLabel,
} from "@/lib/marzban";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Users,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  ArrowUp,
  ArrowDown,
  Wifi,
  RefreshCw,
  Server,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban,
} from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  colorClass?: string;
  delay?: number;
}

function StatCard({ title, value, subtitle, icon, colorClass = "", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`bg-card border border-card-border rounded-2xl p-5 ${colorClass}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-muted/50 border border-border">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

const PIE_COLORS = {
  active: "#22c55e",
  disabled: "#64748b",
  expired: "#ef4444",
  limited: "#f59e0b",
  on_hold: "#a855f7",
};

export default function Dashboard() {
  const { auth } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [nodeUsages, setNodeUsages] = useState<NodeUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [bandwidthHistory, setBandwidthHistory] = useState<Array<{ time: string; in: number; out: number }>>([]);

  const fetchData = useCallback(async () => {
    if (!auth) return;
    try {
      setError(null);
      const [sysStats, usersResp, nodesUsageResp] = await Promise.all([
        auth.client.getSystemStats(),
        auth.client.getUsers({ limit: 10, status: "active" }),
        auth.client.getNodesUsage().catch(() => ({ usages: [] })),
      ]);

      setStats(sysStats);
      const sorted = [...usersResp.users].sort((a, b) => b.used_traffic - a.used_traffic).slice(0, 8);
      setTopUsers(sorted);
      setNodeUsages(nodesUsageResp.usages);

      setBandwidthHistory(prev => {
        const now = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const newEntry = {
          time: now,
          in: Math.round((sysStats.incoming_bandwidth_speed / 1024 / 1024) * 100) / 100,
          out: Math.round((sysStats.outgoing_bandwidth_speed / 1024 / 1024) * 100) / 100,
        };
        const updated = [...prev, newEntry];
        return updated.slice(-20);
      });

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Veri alinamadi");
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Veriler yukleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center p-6 max-w-md">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-lg font-semibold text-foreground mb-1">Veri alinamadi</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const userStatusData = [
    { name: getStatusLabel("active"), value: stats.users_active, color: PIE_COLORS.active },
    { name: getStatusLabel("disabled"), value: stats.users_disabled, color: PIE_COLORS.disabled },
    { name: getStatusLabel("expired"), value: stats.users_expired, color: PIE_COLORS.expired },
    { name: getStatusLabel("limited"), value: stats.users_limited, color: PIE_COLORS.limited },
    { name: getStatusLabel("on_hold"), value: stats.users_on_hold, color: PIE_COLORS.on_hold },
  ].filter(d => d.value > 0);

  const memPercent = Math.round((stats.mem_used / stats.mem_total) * 100);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Genel Bakis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Marzban v{stats.version} · {lastUpdated && `Son guncelleme: ${lastUpdated.toLocaleTimeString("tr-TR")}`}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-card-border hover:bg-muted/50 text-sm font-medium transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Kullanici"
          value={stats.total_user.toLocaleString()}
          subtitle={`${stats.online_users} son 24 saat`}
          icon={<Users className="w-5 h-5 text-primary" />}
          delay={0}
        />
        <StatCard
          title="Aktif Kullanici"
          value={stats.users_active.toLocaleString()}
          subtitle={`${Math.round((stats.users_active / stats.total_user) * 100)}% toplam`}
          icon={<CheckCircle className="w-5 h-5 text-chart-2" />}
          colorClass="stat-card-active"
          delay={0.05}
        />
        <StatCard
          title="Suresi Dolmus"
          value={stats.users_expired.toLocaleString()}
          subtitle={`${stats.users_limited} limitli`}
          icon={<Clock className="w-5 h-5 text-destructive" />}
          colorClass="stat-card-expired"
          delay={0.1}
        />
        <StatCard
          title="Devre Disi"
          value={stats.users_disabled.toLocaleString()}
          subtitle={`${stats.users_on_hold} beklemede`}
          icon={<Ban className="w-5 h-5 text-muted-foreground" />}
          colorClass="stat-card-disabled"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card border border-card-border rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">CPU</h3>
          </div>
          <div className="text-3xl font-bold text-foreground mb-2">{stats.cpu_usage.toFixed(1)}%</div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.cpu_usage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-primary"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{stats.cpu_cores} cekirdek</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-card border border-card-border rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <MemoryStick className="w-5 h-5 text-chart-2" />
            <h3 className="font-semibold text-foreground">Bellek</h3>
          </div>
          <div className="text-3xl font-bold text-foreground mb-2">{memPercent}%</div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${memPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="h-full rounded-full bg-chart-2"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatBytes(stats.mem_used)} / {formatBytes(stats.mem_total)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card border border-card-border rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-5 h-5 text-chart-3" />
            <h3 className="font-semibold text-foreground">Toplam Bant Genisligi</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowDown className="w-4 h-4 text-chart-2" />
                <span>Gelen</span>
              </div>
              <span className="font-semibold text-foreground">{formatBytes(stats.incoming_bandwidth)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowUp className="w-4 h-4 text-destructive" />
                <span>Giden</span>
              </div>
              <span className="font-semibold text-foreground">{formatBytes(stats.outgoing_bandwidth)}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="lg:col-span-3 bg-card border border-card-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Gercek Zamanli Bant Genisligi</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full bg-chart-2" />
                <ArrowDown className="w-3 h-3" />
                Gelen
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full bg-destructive" />
                <ArrowUp className="w-3 h-3" />
                Giden
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowDown className="w-3 h-3 text-chart-2" />
                {formatSpeed(stats.incoming_bandwidth_speed)}
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowUp className="w-3 h-3 text-destructive" />
                {formatSpeed(stats.outgoing_bandwidth_speed)}
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={bandwidthHistory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" />
              <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}MB/s`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(222 47% 14%)", border: "1px solid hsl(217 33% 22%)", borderRadius: "12px" }}
                labelStyle={{ color: "#e2e8f0" }}
                formatter={(value: number) => [`${value} MB/s`]}
              />
              <Area type="monotone" dataKey="in" stroke="#22c55e" strokeWidth={2} fill="url(#colorIn)" name="Gelen" />
              <Area type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={2} fill="url(#colorOut)" name="Giden" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-card border border-card-border rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Kullanici Durumu</h3>
          </div>
          {userStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={userStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {userStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(222 47% 14%)", border: "1px solid hsl(217 33% 22%)", borderRadius: "12px" }}
                    formatter={(value: number) => [value.toLocaleString(), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {userStatusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-8">Kullanici yok</div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="bg-card border border-card-border rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">En Cok Kullananlar (Aktif)</h3>
          </div>
          {topUsers.length > 0 ? (
            <div className="space-y-3">
              {topUsers.slice(0, 6).map((user, i) => (
                <div key={user.username} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate">{user.username}</span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">{formatBytes(user.used_traffic)}</span>
                    </div>
                    {user.data_limit && user.data_limit > 0 ? (
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (user.used_traffic / user.data_limit) * 100)}%`,
                            backgroundColor: user.used_traffic / user.data_limit > 0.9 ? "#ef4444" : user.used_traffic / user.data_limit > 0.7 ? "#f59e0b" : "#22c55e",
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-1.5 rounded-full bg-primary/30 overflow-hidden">
                        <div className="h-full w-8 rounded-full bg-primary animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-8">Aktif kullanici yok</div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-card border border-card-border rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <Server className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Node Kullanimi</h3>
          </div>
          {nodeUsages.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={nodeUsages.map(n => ({
                name: n.node_name.length > 12 ? n.node_name.slice(0, 12) + "…" : n.node_name,
                Gelen: Math.round(n.uplink / 1024 / 1024 / 1024 * 100) / 100,
                Giden: Math.round(n.downlink / 1024 / 1024 / 1024 * 100) / 100,
              }))} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}GB`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(222 47% 14%)", border: "1px solid hsl(217 33% 22%)", borderRadius: "12px" }}
                  formatter={(value: number) => [`${value} GB`]}
                />
                <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                <Bar dataKey="Gelen" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Giden" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Wifi className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">Node kullanim verisi mevcut degil</p>
              <p className="text-xs text-muted-foreground mt-1">Sadece master node kullanilıyor olabilir</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
