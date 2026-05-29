import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useListEvents,
  getListEventsQueryKey,
} from "@workspace/api-client-react";
import { useState } from "react";
import {
  Activity,
  Baby,
  Thermometer,
  Wifi,
  WifiOff,
  Moon,
  Sun,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const EVENT_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  motion_detected: {
    icon: Activity,
    label: "Movimento detectado",
    color: "text-yellow-400",
  },
  baby_crying: {
    icon: Baby,
    label: "Choro do bebe",
    color: "text-red-400",
  },
  temperature_alert: {
    icon: Thermometer,
    label: "Alerta de temperatura",
    color: "text-orange-400",
  },
  device_online: {
    icon: Wifi,
    label: "Dispositivo online",
    color: "text-green-400",
  },
  device_offline: {
    icon: WifiOff,
    label: "Dispositivo offline",
    color: "text-destructive",
  },
  night_mode_on: {
    icon: Moon,
    label: "Modo noturno ativado",
    color: "text-blue-400",
  },
  night_mode_off: {
    icon: Sun,
    label: "Modo noturno desativado",
    color: "text-yellow-300",
  },
  sound_detected: {
    icon: Volume2,
    label: "Som detectado",
    color: "text-purple-400",
  },
};

function groupByDate(events: Array<{ id: number; type: string; description: string; metadata: string | null; createdAt: string }>) {
  const groups: Record<string, typeof events> = {};
  for (const event of events) {
    const dateKey = format(new Date(event.createdAt), "dd 'de' MMMM 'de' yyyy", {
      locale: ptBR,
    });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(event);
  }
  return Object.entries(groups);
}

export default function EventsPage() {
  const [filterType, setFilterType] = useState<string>("all");

  const params = {
    limit: 200,
    offset: 0,
    ...(filterType !== "all" ? { type: filterType } : {}),
  };

  const { data: events, isLoading } = useListEvents(params, {
    query: {
      queryKey: getListEventsQueryKey(params),
    },
  });

  const grouped = events ? groupByDate(events) : [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Historico de Eventos
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Linha do tempo completa de eventos do monitor
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44 h-8 text-xs" data-testid="select-event-type">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              <SelectItem value="motion_detected">Movimento</SelectItem>
              <SelectItem value="baby_crying">Choro</SelectItem>
              <SelectItem value="temperature_alert">Temperatura</SelectItem>
              <SelectItem value="device_online">Dispositivo online</SelectItem>
              <SelectItem value="device_offline">Dispositivo offline</SelectItem>
              <SelectItem value="night_mode_on">Modo noturno on</SelectItem>
              <SelectItem value="night_mode_off">Modo noturno off</SelectItem>
              <SelectItem value="sound_detected">Som</SelectItem>
            </SelectContent>
          </Select>
          {events && (
            <span className="text-xs text-muted-foreground">
              {events.length} evento{events.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Timeline */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <Activity className="h-8 w-8 opacity-50" />
              <p className="text-sm">Nenhum evento encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map(([dateLabel, dayEvents]) => (
              <div key={dateLabel}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {dateLabel}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Card className="border-border">
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {dayEvents.map((event, index) => {
                        const config = EVENT_CONFIG[event.type] ?? {
                          icon: Activity,
                          label: event.type,
                          color: "text-muted-foreground",
                        };
                        const Icon = config.icon;
                        return (
                          <div
                            key={event.id}
                            className="flex items-start gap-4 px-5 py-4 hover:bg-secondary/10 transition-colors"
                            data-testid={`event-row-${event.id}`}
                          >
                            <div
                              className={cn(
                                "mt-0.5 flex-shrink-0 p-1.5 rounded-md bg-secondary",
                                config.color
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground leading-tight">
                                {event.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                                  {config.label}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(event.createdAt), "HH:mm")}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                {formatDistanceToNow(new Date(event.createdAt), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
