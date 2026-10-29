import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Briefcase, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSessionState } from "@/lib/auth";
import { CompanyLogoSlot } from "@/components/CompanyLogoSlot";
import { useCompanyLogo } from "@/lib/company-config";

export function SiteHeader() {
  const { user, loading } = useSessionState();
  const { companyName, hasCustomLogo } = useCompanyLogo();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Identidade Visual / Logo da Empresa */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group" title="Ir para início">
            <span className="flex size-9 items-center justify-center rounded-lg bg-hero-gradient text-primary-foreground shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Briefcase className="size-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-base font-bold tracking-tight text-foreground leading-tight">
                {companyName || "Talentos"}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium leading-none hidden sm:inline">
                Portal de Vagas
              </span>
            </div>
          </Link>

          <div className="h-5 w-px bg-border/80 hidden sm:block" />

          {/* Espaço dedicado para a logo da empresa */}
          <CompanyLogoSlot variant="header" showConfigureButton={true} />
        </div>

        {/* Navegação Principal */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Vagas</Link>
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <Link to="/minhas-candidaturas" className="flex items-center gap-1.5">
              <span>Candidato</span>
            </Link>
          </Button>

          <Button variant="ghost" size="sm" asChild className="relative">
            <Link to="/rh" className="flex items-center gap-1.5">
              <span>Painel RH</span>
              <span className="rounded-full bg-primary/15 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                ATS
              </span>
            </Link>
          </Button>

          {!loading && user && (
            <Button variant="outline" size="sm" onClick={handleSignOut} className="ml-1">
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          )}

          {!loading && !user && (
            <Button size="sm" asChild className="ml-1">
              <Link to="/auth" search={{ redirect: undefined }}>
                Entrar
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
