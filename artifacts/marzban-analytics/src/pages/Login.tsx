import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MarzbanClient } from "@/lib/marzban";
import { Shield, Server, Key, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { login } = useAuth();
  const [baseUrl, setBaseUrl] = useState("https://");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const client = new MarzbanClient({ baseUrl: baseUrl.trim(), token: token.trim() });
      await client.getSystemStats();
      login(baseUrl.trim(), token.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bağlantı başarısız";
      if (msg.includes("401")) {
        setError("Geçersiz token. Lütfen admin token'ınızı kontrol edin.");
      } else if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("Sunucuya ulaşılamıyor. URL'yi ve CORS ayarlarını kontrol edin.");
      } else {
        setError(`Bağlantı hatası: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-chart-2/5 blur-3xl" />
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.3
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="bg-card border border-card-border rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Marzban Analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gelismis istatistik ve analitik paneli
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <span className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" />
                  Marzban URL
                </span>
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://panel.example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Marzban panelinin tam URL'si (port dahil)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <span className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  Admin Token
                </span>
              </label>
              <input
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Bearer token'ınızı girin"
                required
                className="w-full px-4 py-3 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-sm"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Marzban admin token'ı (sudo admin)
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !baseUrl || !token}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Bağlanıyor...
                </>
              ) : (
                "Panele Bağlan"
              )}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Token nasıl alınır?</strong>
              <br />
              Marzban CLI: <code className="text-primary font-mono">marzban cli admin token -u admin</code>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
