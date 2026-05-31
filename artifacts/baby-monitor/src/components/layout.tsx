import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Bell, Activity, Settings, Monitor, Star, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useGetDeviceStatus, getGetDeviceStatusQueryKey } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/alerts", icon: Bell, label: "Alertas" },
  { href: "/events", icon: Activity, label: "Eventos" },
  { href: "/settings", icon: Settings, label: "Config." },
  { href: "/credits", icon: Star, label: "Créditos" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const { data: deviceStatus } = useGetDeviceStatus({
    query: {
      refetchInterval: 5000,
      queryKey: getGetDeviceStatusQueryKey(),
    },
  });

  const isOnline = deviceStatus?.online;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col flex-shrink-0">
        <div className="h-20 flex items-center px-5 border-b border-border">
          <img src="/logo.png" alt="InclusiveTech" className="h-12 w-auto object-contain" />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                location === href
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          {/* Status do monitor */}
          <div className={cn(
            "rounded-lg p-3 flex items-center gap-3",
            isOnline ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
          )}>
            <div className="relative">
              <Monitor className="h-5 w-5" />
              <span className={cn(
                "absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-card",
                isOnline ? "bg-green-500" : "bg-destructive"
              )} />
            </div>
            <div className="text-sm font-medium">
              {isOnline ? "Monitor Online" : "Monitor Offline"}
            </div>
          </div>

          {/* Usuário logado + sair */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {user?.username}
            </span>
            <button
              onClick={logout}
              title="Sair"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Header ────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4 bg-card border-b border-border">
        <img src="/logo.png" alt="InclusiveTech" className="h-9 w-auto object-contain" />
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-full",
            isOnline ? "bg-green-500/15 text-green-400" : "bg-destructive/15 text-destructive"
          )}>
            <span className={cn(
              "h-2 w-2 rounded-full",
              isOnline ? "bg-green-500" : "bg-destructive"
            )} />
            {isOnline ? "Online" : "Offline"}
          </div>
          <button
            onClick={logout}
            title="Sair"
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        <div className="absolute inset-0 pointer-events-none">
          <svg className="h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <filter id="noiseFilter">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noiseFilter)" />
          </svg>
        </div>

        <div className="flex-1 overflow-y-auto z-10 pt-14 md:pt-0 pb-20 md:pb-0">
          <div className="px-4 py-5 md:p-8 max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Nav ────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border flex items-center">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = location === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "drop-shadow-sm")} />
              <span className="text-[9px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
