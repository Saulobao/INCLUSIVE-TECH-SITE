import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Bell, Activity, Settings, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetDeviceStatus, getGetDeviceStatusQueryKey } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const { data: deviceStatus } = useGetDeviceStatus({
    query: {
      refetchInterval: 5000,
      queryKey: getGetDeviceStatusQueryKey(),
    },
  });

  const isOnline = deviceStatus?.online;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-20 flex items-center px-5 border-b border-border">
          <img
            src="/logo.png"
            alt="InclusiveTech"
            className="h-12 w-auto object-contain"
          />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem href="/" icon={Home} label="Dashboard" active={location === "/"} />
          <NavItem href="/alerts" icon={Bell} label="Alertas" active={location === "/alerts"} />
          <NavItem href="/events" icon={Activity} label="Eventos" active={location === "/events"} />
          <NavItem href="/settings" icon={Settings} label="Configurações" active={location === "/settings"} />
        </nav>

        <div className="p-4 border-t border-border">
          <div
            className={cn(
              "rounded-lg p-3 flex items-center gap-3",
              isOnline
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
            )}
          >
            <div className="relative">
              <Monitor className="h-5 w-5" />
              <span
                className={cn(
                  "absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-card",
                  isOnline ? "bg-green-500" : "bg-destructive"
                )}
              />
            </div>
            <div>
              <div className="text-sm font-medium">
                {isOnline ? "Monitor Online" : "Monitor Offline"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay">
          <svg className="h-full w-full opacity-[0.1]" xmlns="http://www.w3.org/2000/svg">
            <filter id="noiseFilter">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noiseFilter)" />
          </svg>
        </div>
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
        active
          ? "bg-secondary text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
