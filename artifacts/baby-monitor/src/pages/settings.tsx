import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { useTheme, THEME_PRESETS, type ThemeColor } from "@/lib/theme";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { color: themeColor, setColor: setThemeColor } = useTheme();

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
        toast({ title: "Configurações salvas com sucesso" });
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

  const sensitivityLabels = [
    "Muito baixa",
    "Baixa",
    "Média",
    "Alta",
    "Muito alta",
  ];

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure o dispositivo e a aparência do painel
          </p>
        </div>

        {/* Theme Color */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Cor do painel
            </CardTitle>
            <CardDescription className="text-xs">
              Escolha a cor de destaque do layout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 flex-wrap">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setThemeColor(preset.id as ThemeColor)}
                  data-testid={`theme-color-${preset.id}`}
                  title={preset.label}
                  className={cn(
                    "flex flex-col items-center gap-1.5 group focus:outline-none"
                  )}
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-full border-2 transition-transform group-hover:scale-110",
                      themeColor === preset.id
                        ? "border-foreground scale-110 shadow-lg"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span
                    className={cn(
                      "text-[10px]",
                      themeColor === preset.id
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Status */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status atual</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
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
                    <p className="text-sm font-medium">
                      {device?.wifiSignal ?? "--"} dBm
                    </p>
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-md p-3 flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Temperatura</p>
                    <p className="text-sm font-medium">
                      {device?.temperature?.toFixed(1) ?? "--"}°C /{" "}
                      {device?.humidity?.toFixed(0) ?? "--"}%
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
            <CardTitle className="text-sm font-medium">
              Dispositivo ESP32
            </CardTitle>
            <CardDescription className="text-xs">
              Alterações são enviadas ao dispositivo
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
                URL da câmera (MJPEG)
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
                  Reduz brilho e ativa visão infravermelha
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
                  Salvar configurações
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
