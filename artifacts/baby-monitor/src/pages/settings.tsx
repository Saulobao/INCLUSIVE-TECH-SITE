import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetDeviceStatus,
  getGetDeviceStatusQueryKey,
  useUpdateDeviceConfig,
} from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw, Wifi, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: device, isLoading } = useGetDeviceStatus({
    query: {
      refetchInterval: 10000,
      queryKey: getGetDeviceStatusQueryKey(),
    },
  });

  const [name, setName] = useState("");
  const [nightMode, setNightMode] = useState(false);
  const [sensitivity, setSensitivity] = useState(3);
  const [streamUrl, setStreamUrl] = useState("");

  useEffect(() => {
    if (device) {
      setName(device.name);
      setNightMode(device.nightModeEnabled ?? false);
      setSensitivity(device.sensitivityLevel ?? 3);
      setStreamUrl(device.streamUrl ?? "");
    }
  }, [device]);

  const updateConfig = useUpdateDeviceConfig({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetDeviceStatusQueryKey(),
        });
        toast({ title: "Configuracoes salvas com sucesso" });
      },
      onError: () => {
        toast({
          title: "Erro ao salvar",
          description: "Tente novamente",
          variant: "destructive",
        });
      },
    },
  });

  const handleSave = () => {
    updateConfig.mutate({
      data: {
        name,
        nightModeEnabled: nightMode,
        sensitivityLevel: sensitivity,
        streamUrl: streamUrl || undefined,
      },
    });
  };

  const sensitivityLabels = ["Muito baixa", "Baixa", "Media", "Alta", "Muito alta"];

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Configuracoes do Dispositivo
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure o ESP32 BabyWatch
          </p>
        </div>

        {/* Device Info */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status atual</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-md p-3 flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      device?.online ? "bg-green-500" : "bg-destructive"
                    )}
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium">
                      {device?.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-md p-3 flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sinal Wi-Fi</p>
                    <p className="text-sm font-medium">{device?.wifiSignal ?? "--"} dBm</p>
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-md p-3 flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Temperatura</p>
                    <p className="text-sm font-medium">
                      {device?.temperature?.toFixed(1) ?? "--"}°C / {device?.humidity?.toFixed(0) ?? "--"}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Config Form */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Configuracoes</CardTitle>
            <CardDescription className="text-xs">
              Alteracoes sao enviadas ao dispositivo ESP32
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="device-name" className="text-sm">
                Nome do dispositivo
              </Label>
              <Input
                id="device-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ESP32 BabyWatch"
                className="h-9"
                data-testid="input-device-name"
              />
            </div>

            {/* Stream URL */}
            <div className="space-y-2">
              <Label htmlFor="stream-url" className="text-sm">
                URL do stream de camera (MJPEG)
              </Label>
              <Input
                id="stream-url"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="http://192.168.1.x:81/stream"
                className="h-9 font-mono text-xs"
                data-testid="input-stream-url"
              />
              <p className="text-xs text-muted-foreground">
                URL do stream MJPEG do ESP32-CAM, ex: http://192.168.1.100:81/stream
              </p>
            </div>

            {/* Night Mode */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Modo noturno</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reduz brilho e ativa visao infravermelha
                </p>
              </div>
              <Switch
                checked={nightMode}
                onCheckedChange={setNightMode}
                data-testid="switch-night-mode"
              />
            </div>

            {/* Sensitivity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Sensibilidade da IA</Label>
                <span className="text-xs text-primary font-medium">
                  {sensitivityLabels[(sensitivity ?? 3) - 1]}
                </span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[sensitivity]}
                onValueChange={(v) => setSensitivity(v[0])}
                className="w-full"
                data-testid="slider-sensitivity"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Menos alertas</span>
                <span>Mais alertas</span>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={updateConfig.isPending || isLoading}
              className="w-full gap-2"
              data-testid="button-save-settings"
            >
              {updateConfig.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar configuracoes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
