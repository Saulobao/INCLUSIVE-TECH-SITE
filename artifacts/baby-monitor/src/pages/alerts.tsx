import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useListAlerts,
  getListAlertsQueryKey,
  useAcknowledgeAlert,
  useAcknowledgeAllAlerts,
} from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Check, AlertTriangle, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const TYPE_LABELS: Record<string, string> = {
  motion: "Movimento",
  crying: "Choro",
  temperature: "Temperatura",
  sound: "Som",
  offline: "Offline",
  online: "Online",
};

export default function AlertsPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAck, setFilterAck] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = {
    limit: 100,
    offset: 0,
    ...(filterType !== "all" ? { type: filterType } : {}),
    ...(filterAck === "unread" ? { acknowledged: false } : filterAck === "read" ? { acknowledged: true } : {}),
  };

  const { data: alerts, isLoading } = useListAlerts(params, {
    query: {
      queryKey: getListAlertsQueryKey(params),
      refetchInterval: 15000,
    },
  });

  const acknowledgeAlert = useAcknowledgeAlert({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
        toast({ title: "Alerta marcado como lido" });
      },
    },
  });

  const acknowledgeAll = useAcknowledgeAllAlerts({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
        toast({ title: `${data.count} alertas marcados como lidos` });
      },
    },
  });

  const unreadCount = alerts?.filter((a) => !a.acknowledged).length ?? 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              Alertas de IA
              {unreadCount > 0 && (
                <Badge
                  className="bg-primary text-primary-foreground text-xs h-5 min-w-5 px-1.5"
                  data-testid="unread-badge"
                >
                  {unreadCount}
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Notificacoes geradas pelo modelo de IA do ESP32
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => acknowledgeAll.mutate({})}
              disabled={acknowledgeAll.isPending}
              data-testid="button-acknowledge-all"
              className="gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todos como lidos
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 h-8 text-xs" data-testid="select-type">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="motion">Movimento</SelectItem>
              <SelectItem value="crying">Choro</SelectItem>
              <SelectItem value="temperature">Temperatura</SelectItem>
              <SelectItem value="sound">Som</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAck} onValueChange={setFilterAck}>
            <SelectTrigger className="w-36 h-8 text-xs" data-testid="select-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="unread">Nao lidos</SelectItem>
              <SelectItem value="read">Lidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alerts list */}
        <Card className="border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !alerts || alerts.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
                <BellOff className="h-8 w-8 opacity-50" />
                <p className="text-sm">Nenhum alerta encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-4 px-5 py-4 transition-colors",
                      !alert.acknowledged
                        ? "bg-secondary/20 hover:bg-secondary/30"
                        : "hover:bg-secondary/10 opacity-70"
                    )}
                    data-testid={`alert-row-${alert.id}`}
                  >
                    <div
                      className={cn(
                        "mt-1 flex-shrink-0 h-2 w-2 rounded-full",
                        alert.severity === "critical"
                          ? "bg-red-500"
                          : alert.severity === "high"
                          ? "bg-orange-500"
                          : alert.severity === "medium"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {alert.message}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4",
                            SEVERITY_COLORS[alert.severity]
                          )}
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                          {TYPE_LABELS[alert.type] ?? alert.type}
                        </span>
                        {alert.confidence != null && (
                          <span className="text-xs text-muted-foreground">
                            {(alert.confidence * 100).toFixed(0)}% confianca
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={() => acknowledgeAlert.mutate({ id: alert.id })}
                        disabled={acknowledgeAlert.isPending}
                        data-testid={`button-ack-${alert.id}`}
                        title="Marcar como lido"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
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
