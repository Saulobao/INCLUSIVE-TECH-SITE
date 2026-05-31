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
import {
  Save,
  RefreshCw,
  Wifi,
  Thermometer,
  KeyRound,
  UserPlus,
  Trash2,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, THEME_PRESETS, type ThemeColor } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

const BASE = "https://inclusive-tech-site.onrender.com";

// ── Hook: lista de usuários ────────────────────────────────────────────────────
function useUsers() {
  const [users, setUsers] = useState<
    {
      id: number;
      username: string;
      displayName: string | null;
      createdAt: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    fetch(`${BASE}/api/users`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setUsers(d.users);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);
  return { users, loading, reload };
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { color: themeColor, setColor: setThemeColor } = useTheme();
  const { user: me } = useAuth();

  // ── Device settings ──────────────────────────────────────────────────────────
  const { data: device, isLoading } = useGetDeviceStatus({
    query: { refetchInterval: 10000, queryKey: getGetDeviceStatusQueryKey() },
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

  // ── Change password ───────────────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwds, setShowPwds] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setPwdLoading(true);
    const r = await fetch(`${BASE}/api/auth/change-password`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: currentPwd,
        newPassword: newPwd,
      }),
    });
    const d = await r.json();
    setPwdLoading(false);
    if (r.ok) {
      toast({ title: "Senha alterada com sucesso" });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } else {
      toast({
        title: d.error ?? "Erro ao alterar senha",
        variant: "destructive",
      });
    }
  };

  // ── User management ───────────────────────────────────────────────────────────
  const { users, loading: usersLoading, reload: reloadUsers } = useUsers();
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newUserPwd, setNewUserPwd] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    const r = await fetch(`${BASE}/api/users`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: newUsername,
        password: newUserPwd,
        displayName: newDisplayName,
      }),
    });
    const d = await r.json();
    setCreateLoading(false);
    if (r.ok) {
      toast({ title: `Usuário "${d.user.username}" criado` });
      setNewUsername("");
      setNewDisplayName("");
      setNewUserPwd("");
      reloadUsers();
    } else {
      toast({
        title: d.error ?? "Erro ao criar usuário",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    setDeletingId(id);
    const r = await fetch(`${BASE}/api/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const d = await r.json();
    setDeletingId(null);
    if (r.ok) {
      toast({ title: `Usuário "${username}" removido` });
      reloadUsers();
    } else {
      toast({
        title: d.error ?? "Erro ao remover usuário",
        variant: "destructive",
      });
    }
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
            Configure o dispositivo e o acesso ao painel
          </p>
        </div>

        {/* Theme Color */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cor do painel</CardTitle>
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
                  className="flex flex-col items-center gap-1.5 group focus:outline-none"
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-full border-2 transition-transform group-hover:scale-110",
                      themeColor === preset.id
                        ? "border-foreground scale-110 shadow-lg"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span
                    className={cn(
                      "text-[10px]",
                      themeColor === preset.id
                        ? "text-foreground font-medium"
                        : "text-muted-foreground",
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
                      device?.online ? "bg-green-500" : "bg-destructive",
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

        {/* Device Config */}
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
                URL do stream MJPEG do ESP32-CAM, ex:
                http://192.168.1.100:81/stream
              </p>
            </div>
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

        {/* ── Change Password ──────────────────────────────────────────────── */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Alterar senha
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Altere a senha da sua conta ({me?.username})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-pwd" className="text-sm">
                  Senha atual
                </Label>
                <div className="relative">
                  <Input
                    id="current-pwd"
                    type={showPwds ? "text" : "password"}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="Senha atual"
                    required
                    className="h-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwds(!showPwds)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPwds ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-pwd" className="text-sm">
                  Nova senha
                </Label>
                <Input
                  id="new-pwd"
                  type={showPwds ? "text" : "password"}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-pwd" className="text-sm">
                  Confirmar nova senha
                </Label>
                <Input
                  id="confirm-pwd"
                  type={showPwds ? "text" : "password"}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  className={cn(
                    "h-9",
                    confirmPwd && confirmPwd !== newPwd && "border-destructive",
                  )}
                />
                {confirmPwd && confirmPwd !== newPwd && (
                  <p className="text-xs text-destructive">
                    As senhas não coincidem
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={pwdLoading || (!!confirmPwd && confirmPwd !== newPwd)}
                className="w-full gap-2"
              >
                {pwdLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Alterar senha
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── User Management ──────────────────────────────────────────────── */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Gerenciar usuários
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Adicione ou remova quem pode acessar o painel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* User list */}
            <div className="space-y-2">
              {usersLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Nenhum usuário cadastrado
                </p>
              ) : (
                users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium leading-tight">
                        {u.username}
                      </p>
                      {u.displayName && (
                        <p className="text-xs text-muted-foreground">
                          {u.displayName}
                        </p>
                      )}
                    </div>
                    {u.id === me?.id ? (
                      <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        você
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        disabled={deletingId === u.id}
                        className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                        title={`Remover ${u.username}`}
                      >
                        {deletingId === u.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Add user form */}
            <form onSubmit={handleCreateUser} className="space-y-3">
              <p className="text-xs font-medium text-foreground">
                Novo usuário
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-uname" className="text-xs">
                    Usuário
                  </Label>
                  <Input
                    id="new-uname"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="ex: mae"
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-dname" className="text-xs">
                    Nome (opcional)
                  </Label>
                  <Input
                    id="new-dname"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="ex: Mãe"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-upwd" className="text-xs">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="new-upwd"
                    type={showNewPwd ? "text" : "password"}
                    value={newUserPwd}
                    onChange={(e) => setNewUserPwd(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="h-9 pr-9 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNewPwd ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={createLoading}
                variant="outline"
                className="w-full gap-2 h-9"
              >
                {createLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Criar usuário
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
