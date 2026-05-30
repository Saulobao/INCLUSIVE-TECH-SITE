import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
  useGetActivityFeed,
  getGetActivityFeedQueryKey,
  useGetAlertStats,
  getGetAlertStatsQueryKey,
  useGetDeviceStatus,
  getGetDeviceStatusQueryKey,
} from "@workspace/api-client-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Thermometer,
  Droplets,
  Wifi,
  AlertTriangle,
  Activity,
  Video,
  VideoOff,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const ALERT_TYPE_COLORS: Record<string, string> = {
  motion: "#f59e0b",
  crying: "#ef4444",
  temperature: "#f97316",
  sound: "#3b82f6",
  offline: "#6b7280",
  online: "#22c55e",
};

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {label}
            </p>
            <p
              className={cn(
                "text-2xl font-bold mt-1",
                accent ? "text-primary" : "text-foreground"
              )}
            >
              {value}
            </p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
          <div
            className={cn(
              "p-2 rounded-md",
              accent ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({
    query: {
      refetchInterval: 10000,
      queryKey: getGetDashboardSummaryQueryKey(),
    },
  });

  const { data: feed, isLoading: feedLoading } = useGetActivityFeed(
    { limit: 15 },
    {
      query: {
        refetchInterval: 15000,
        queryKey: getGetActivityFeedQueryKey({ limit: 15 }),
      },
    }
  );

  const { data: alertStats } = useGetAlertStats({
    query: {
      refetchInterval: 30000,
      queryKey: getGetAlertStatsQueryKey(),
    },
  });

  const { data: device } = useGetDeviceStatus({
    query: {
      refetchInterval: 5000,
      queryKey: getGetDeviceStatusQueryKey(),
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitoramento em tempo real
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                label="Alertas hoje"
                value={summary?.totalAlertsToday ?? 0}
                icon={AlertTriangle}
                sub={`${summary?.unacknowledgedAlerts ?? 0} não lidos`}
                accent={!!summary?.unacknowledgedAlerts}
              />
              <StatCard
                label="Temperatura"
                value={`${(summary?.averageTemperature ?? 0).toFixed(1)}°C`}
                icon={Thermometer}
                sub={`Umidade ${(summary?.averageHumidity ?? 0).toFixed(0)}%`}
              />
              <StatCard
                label="Movimentos"
                value={summary?.motionEvents ?? 0}
                icon={Activity}
                sub="Últimas 24h"
              />
              <StatCard
                label="Choro detectado"
                value={summary?.cryingEvents ?? 0}
                icon={AlertTriangle}
                sub="Hoje"
              />
            </>
          )}
        </div>

        {/* Camera + Alert Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Camera Feed */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Camera ao Vivo
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    device?.online
                      ? "border-green-500/40 text-green-400 bg-green-500/10"
                      : "border-destructive/40 text-destructive bg-destructive/10"
                  )}
                >
                  {device?.online ? "Online" : "Offline"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {device?.online && device?.streamUrl ? (
                <div className="rounded-md overflow-hidden bg-black aspect-video flex items-center justify-center">
                  <img
                    src={device.streamUrl}
                    alt="Live camera feed"
                    className="w-full h-full object-cover"
                    data-testid="camera-stream"
                  />
                </div>
              ) : (
                <div
                  className="rounded-md bg-secondary/50 aspect-video flex flex-col items-center justify-center gap-3"
                  data-testid="camera-offline"
                >
                  {device?.online ? (
                    <>
                      <Video className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma URL de stream configurada
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Configure em Ajustes
                      </p>
                    </>
                  ) : (
                    <>
                      <VideoOff className="h-8 w-8 text-destructive/60" />
                      <p className="text-sm text-muted-foreground">
                        Dispositivo offline
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Verifique a conexão do ESP32
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Device status bar */}
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  {device?.wifiSignal ?? "--"} dBm
                </span>
                <span className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  {device?.temperature?.toFixed(1) ?? "--"}°C
                </span>
                <span className="flex items-center gap-1">
                  <Droplets className="h-3 w-3" />
                  {device?.humidity?.toFixed(0) ?? "--"}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Alert Stats Chart */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Alertas por tipo (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!alertStats || alertStats.length === 0 ? (
                <div className="h-40 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum alerta nas ultimas 24 horas
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={alertStats} barSize={28}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "hsl(215 20.2% 65.1%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(215 20.2% 65.1%)" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(222 47% 13%)",
                        border: "1px solid hsl(222 47% 16%)",
                        borderRadius: "6px",
                        color: "hsl(210 40% 98%)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {alertStats.map((entry) => (
                        <Cell
                          key={entry.type}
                          fill={
                            ALERT_TYPE_COLORS[entry.type] ?? "#f59e0b"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !feed || feed.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade recente
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {feed.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-md hover:bg-secondary/30 transition-colors"
                    data-testid={`activity-item-${item.id}`}
                  >
                    <div
                      className={cn(
                        "mt-0.5 h-2 w-2 rounded-full flex-shrink-0",
                        item.kind === "alert"
                          ? item.severity === "critical"
                            ? "bg-red-500"
                            : item.severity === "high"
                            ? "bg-orange-500"
                            : item.severity === "medium"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                          : "bg-primary"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-tight truncate">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {item.kind === "alert" ? "Alerta" : "Evento"}
                        </span>
                        {item.severity && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 h-4",
                              SEVERITY_COLORS[item.severity]
                            )}
                          >
                            {item.severity}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(item.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
