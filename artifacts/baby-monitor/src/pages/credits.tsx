import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Code2, Palette, Server, Heart } from "lucide-react";

const credits = [
  {
    role: "Design & Programação",
    icon: Code2,
    entries: [
      {
        name: "Saulo Ryan Lisboa Nascimento Rocha",
        description: "Designer e desenvolvedor do painel BabyWatch — concepção visual, arquitetura do sistema e implementação completa.",
      },
    ],
  },
  {
    role: "Infraestrutura & Backend",
    icon: Server,
    entries: [
      {
        name: "Replit",
        description: "Hospedagem, ambiente de desenvolvimento em nuvem e suporte ao backend. O servidor, banco de dados e a API foram construídos e implantados na plataforma Replit.",
        url: "https://replit.com",
      },
    ],
  },
  {
    role: "Produto",
    icon: Palette,
    entries: [
      {
        name: "InclusiveTech",
        description: "Empresa responsável pela babá eletrônica ESP32 BabyWatch — hardware, conectividade e visão do produto.",
      },
    ],
  },
];

export default function CreditsPage() {
  return (
    <Layout>
      <div className="space-y-8 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Créditos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            As pessoas e plataformas por trás do BabyWatch
          </p>
        </div>

        {/* Logo */}
        <div className="flex justify-center py-4">
          <img
            src="/logo.png"
            alt="InclusiveTech"
            className="h-28 w-auto object-contain opacity-90"
          />
        </div>

        {/* Credits sections */}
        <div className="space-y-4">
          {credits.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.role} className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                      {section.role}
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {section.entries.map((entry) => (
                      <div key={entry.name} className="pl-1">
                        {entry.url ? (
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-medium text-primary hover:underline"
                          >
                            {entry.name}
                          </a>
                        ) : (
                          <p className="text-base font-medium text-foreground">
                            {entry.name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                          {entry.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 pt-2 pb-6 text-xs text-muted-foreground">
          <span>Feito com</span>
          <Heart className="h-3 w-3 text-primary fill-primary" />
          <span>pela InclusiveTech</span>
        </div>
      </div>
    </Layout>
  );
}
