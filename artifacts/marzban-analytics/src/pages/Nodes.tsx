import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Node, NodeUsage, formatBytes, getStatusColor, getStatusLabel } from "@/lib/marzban";
import { Server, RefreshCw, AlertTriangle, Wifi, WifiOff, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function NodesPage() {
  const { auth } = useAuth();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [usages, setUsages] = useState<NodeUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    setError(null);
    try {
      const [nodesResp, usagesResp] = await Promise.all([
        auth.client.getNodes(),
        auth.client.getNodesUsage().catch(() => ({ usages: [] })),
      ]);
      setNodes(nodesResp);
      setUsages(usagesResp.usages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Node bilgileri alinamadi");
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const usageMap: Record<number | string, NodeUsage> = {};
  usages.forEach(u => {
    if (u.node_id !== null) usageMap[u.node_id] = u;
    else usageMap["master"] = u;
  });

  const chartData = usages.map(u => ({
    name: u.node_name.length > 14 ? u.node_name.slice(0, 14) + "…" : u.node_name,
    Gelen: Math.round(u.uplink / 1024 / 1024 / 1024 * 100) / 100,
    Giden: Math.round(u.downlink / 1024 / 1024 / 1024 * 100) / 100,
  }));

  const statusIcon = (status: string) => {
    if (status === "connected") return <Wifi className="w-4 h-4" />;
    if (status === "error") return <WifiOff className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nodelar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{nodes.length} node kayitli</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-card-border hover:bg-muted/50 text-sm font-medium transition-all">
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-2xl p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-2/3 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {nodes.map((node, i) => {
              const usage = usageMap[node.id];
              const color = getStatusColor(node.status);

              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card border border-card-border rounded-2xl p-5"
                  style={{ borderLeft: `3px solid ${color}` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{node.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {node.address}:{node.port}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${color}15`,
                        color: color,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      {statusIcon(node.status)}
                      {getStatusLabel(node.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-1">Xray Versiyonu</p>
                      <p className="text-sm font-semibold text-foreground">{node.xray_version ?? "-"}</p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-1">API Port</p>
                      <p className="text-sm font-semibold text-foreground">{node.api_port}</p>
                    </div>
                  </div>

                  {usage ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-chart-2/5 border border-chart-2/10 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Gelen</p>
                        <p className="text-sm font-semibold text-chart-2">{formatBytes(usage.uplink)}</p>
                      </div>
                      <div className="bg-destructive/5 border border-destructive/10 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Giden</p>
                        <p className="text-sm font-semibold text-destructive">{formatBytes(usage.downlink)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground text-center">
                      Kullanim verisi mevcut degil
                    </div>
                  )}

                  {node.message && (
                    <div className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                      {node.message}
                    </div>
                  )}
                </motion.div>
              );
            })}

            {nodes.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <Server className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
                <p className="text-muted-foreground">Kayıtlı node bulunamadi</p>
                <p className="text-sm text-muted-foreground mt-1">Sadece master node kullaniliyor olabilir</p>
              </div>
            )}
          </div>

          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-card-border rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-5">
                <Server className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Node Bant Genisligi Karsilastirmasi</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}GB`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(222 47% 14%)", border: "1px solid hsl(217 33% 22%)", borderRadius: "12px" }}
                    formatter={(v: number) => [`${v} GB`]}
                  />
                  <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                  <Bar dataKey="Gelen" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Giden" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
