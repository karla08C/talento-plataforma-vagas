import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  MapPin,
  User,
  Mail,
  Phone,
  Search,
  BookOpen,
  Compass,
  Building2,
  Laptop,
  Check,
  CalendarCheck2,
  XCircle,
  Sparkles,
  HelpCircle,
  Layers,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSessionState } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { formatDatePtBR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CandidateStatusBadge, getStatusConfig } from "@/components/CandidateStatusBadge";
import { CandidateProgressStepper } from "@/components/CandidateProgressStepper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ApplicationStatus = Database["public"]["Enums"]["application_status"];

export const Route = createFileRoute("/minhas-candidaturas")({
  head: () => ({
    meta: [
      { title: "Área do Candidato - Minhas Candidaturas | Talentos do Interior" },
      {
        name: "description",
        content:
          "Acompanhe o status e a evolução das suas candidaturas em polos e cidades do interior com transparência didática.",
      },
    ],
  }),
  component: MinhasCandidaturasPage,
});

interface JobItem {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  seniority: string;
  salary_range: string | null;
  status: string;
}

interface ApplicationItem {
  id: string;
  job_id: string;
  candidate_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cover_letter: string | null;
  resume_path: string | null;
  status: ApplicationStatus;
  notes?: string;
  rating?: number;
  created_at: string;
  updated_at?: string;
  job?: JobItem | undefined;
}

function normalizeStatus(st: string): ApplicationStatus {
  if (st === "in_review") return "screening";
  if (st === "interviewing" || st === "interview_scheduled") return "interview";
  if (st === "offered" || st === "approved") return "offer";
  if (
    st === "received" ||
    st === "screening" ||
    st === "interview" ||
    st === "offer" ||
    st === "rejected"
  ) {
    return st;
  }
  return "received";
}

export function MinhasCandidaturasPage() {
  const { user } = useSessionState();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [appToCancel, setAppToCancel] = useState<ApplicationItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showDidacticGuide, setShowDidacticGuide] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Fetch applications
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["candidate-applications", user?.id, user?.email],
    queryFn: async () => {
      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (appsError) throw appsError;

      const { data: jobsData } = await supabase.from("jobs").select("*");
      const jobsMap = new Map((jobsData ?? []).map((j: JobItem) => [j.id, j]));

      let userApps = (appsData ?? []).map((row) => ({
        ...row,
        status: normalizeStatus(row.status),
      })) as ApplicationItem[];

      if (user) {
        const byUser = userApps.filter(
          (a) => a.candidate_id === user.id || a.email.toLowerCase() === user.email?.toLowerCase(),
        );
        if (byUser.length > 0) {
          userApps = byUser;
        }
      }

      return userApps.map((app) => ({
        ...app,
        job: jobsMap.get(app.job_id) ?? undefined,
      }));
    },
  });

  const handleDemoCandidateLogin = async () => {
    await supabase.auth.signInWithPassword({
      email: "mariana.souza@exemplo.com",
      password: "demo-password-123",
    });
    void queryClient.invalidateQueries({ queryKey: ["candidate-applications"] });
    toast.success("Conectado como candidata Mariana Souza (Interior de SP)!");
  };

  const handleCancelApplication = async () => {
    if (!appToCancel) return;
    setCancelling(true);
    try {
      const { error } = await supabase.from("applications").delete().eq("id", appToCancel.id);

      if (error) throw error;

      toast.success("Candidatura cancelada com sucesso");
      setAppToCancel(null);
      void queryClient.invalidateQueries({ queryKey: ["candidate-applications"] });
    } catch (err: unknown) {
      toast.error("Erro ao cancelar candidatura", {
        description: err instanceof Error ? err.message : "Tente novamente mais tarde.",
      });
    } finally {
      setCancelling(false);
    }
  };

  // Quick live simulator to test different status badges
  const handleSimulateStatus = async (appId: string, newStatus: ApplicationStatus) => {
    setUpdatingAppId(appId);
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appId);

      if (error) throw error;

      const config = getStatusConfig(newStatus);
      toast.success(`Status atualizado para: ${config.labelPt} (${config.labelEn})`);
      void queryClient.invalidateQueries({ queryKey: ["candidate-applications"] });

      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp({
          ...selectedApp,
          status: newStatus,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err: unknown) {
      toast.error("Erro ao simular status", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setUpdatingAppId(null);
    }
  };

  const filteredApps = applications.filter((app) => {
    const titleMatch = app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? true;
    const deptMatch =
      app.job?.department?.toLowerCase().includes(searchQuery.toLowerCase()) ?? true;
    const locMatch = app.job?.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? true;
    const textMatch = !searchQuery || titleMatch || deptMatch || locMatch;

    if (!textMatch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "screening") return app.status === "screening";
    if (statusFilter === "interview") return app.status === "interview";
    if (statusFilter === "rejected") return app.status === "rejected";
    if (statusFilter === "offer") return app.status === "offer";
    if (statusFilter === "received") return app.status === "received";
    return true;
  });

  // Calculate stats for badges
  const totalReceived = applications.filter((a) => a.status === "received").length;
  const totalInReview = applications.filter((a) => a.status === "screening").length;
  const totalInterview = applications.filter((a) => a.status === "interview").length;
  const totalRejected = applications.filter((a) => a.status === "rejected").length;
  const totalOffer = applications.filter((a) => a.status === "offer").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Banner Superior com Contexto Didático para Desenvolvimento do Interior */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/15 via-card to-accent/10 border border-primary/20 p-6 sm:p-8 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Compass className="size-3.5" />
                Painel do Candidato • Minhas Oportunidades
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {user?.user_metadata?.["full_name"]
                  ? `Minhas Candidaturas — ${user.user_metadata["full_name"]}`
                  : "Acompanhamento de Candidaturas"}
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Acompanhe em tempo real o status de cada vaga enviada. Cada etapa conta com badges
                de status claros, orientações didáticas e previsão de retorno da equipe de seleção.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="font-semibold shadow-xs text-xs"
                onClick={() => setShowDidacticGuide(!showDidacticGuide)}
              >
                <BookOpen className="mr-1.5 size-4 text-primary" />
                {showDidacticGuide ? "Ocultar Guia de Etapas" : "Guia de Etapas e Status"}
              </Button>

              <Button asChild variant="default" className="shadow-xs font-semibold text-xs">
                <Link to="/">
                  <Briefcase className="mr-1.5 size-4" /> Buscar Novas Vagas
                </Link>
              </Button>
            </div>
          </div>

          {/* Guia Didático de Significado dos Status */}
          {showDidacticGuide && (
            <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5 text-xs text-foreground space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 font-bold text-sm text-primary">
                <Sparkles className="size-4" />
                Dicionário Didático de Status das Candidaturas
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg bg-card p-3 border border-border/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <CandidateStatusBadge status="screening" size="sm" />
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    <strong>Em Análise (In Review):</strong> Seu currículo está sendo avaliado por
                    recrutadores da região para conferência de experiências e requisitos.
                  </p>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <CandidateStatusBadge status="interview" size="sm" />
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    <strong>Entrevista Agendada (Interview Scheduled):</strong> Seu perfil avançou
                    para a conversa direta com RH ou gestor (videoconferência ou no polo local).
                  </p>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <CandidateStatusBadge status="rejected" size="sm" />
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    <strong>Não Selecionado (Rejected):</strong> O processo encerrou para esta vaga,
                    mas seu currículo permanece ativo no banco regional de talentos.
                  </p>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <CandidateStatusBadge status="offer" size="sm" />
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    <strong>Proposta Enviada (Offer):</strong> Parabéns! Você foi aprovado(a) e o
                    time de RH enviou os termos salariais e benefícios para sua análise.
                  </p>
                </div>

                <div className="rounded-lg bg-card p-3 border border-border/80 space-y-1.5 shadow-2xs sm:col-span-2 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <CandidateStatusBadge status="received" size="sm" />
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    <strong>Inscrição Recebida (Applied):</strong> Candidatura salva no sistema com
                    segurança, aguardando início da triagem pela equipe de atração do interior.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cards de Métricas por Status */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs"
                  : "border-border/80 bg-card/80 hover:bg-card"
              }`}
            >
              <p className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                <span>Todas</span>
                <Layers className="size-3 text-muted-foreground" />
              </p>
              <p className="mt-1 text-2xl font-extrabold">{applications.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Total enviadas</p>
            </button>

            <button
              onClick={() => setStatusFilter("screening")}
              className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                statusFilter === "screening"
                  ? "border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/40 shadow-xs"
                  : "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
              }`}
            >
              <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>Em Análise</span>
                <Clock className="size-3 text-amber-600 dark:text-amber-400" />
              </p>
              <p className="mt-1 text-2xl font-extrabold text-amber-800 dark:text-amber-300">
                {totalInReview}
              </p>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                In Review
              </p>
            </button>

            <button
              onClick={() => setStatusFilter("interview")}
              className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                statusFilter === "interview"
                  ? "border-purple-500 bg-purple-500/15 ring-1 ring-purple-500/40 shadow-xs"
                  : "border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10"
              }`}
            >
              <p className="text-[11px] font-medium text-purple-800 dark:text-purple-300 flex items-center justify-between">
                <span>Entrevistas</span>
                <CalendarCheck2 className="size-3 text-purple-600 dark:text-purple-400" />
              </p>
              <p className="mt-1 text-2xl font-extrabold text-purple-800 dark:text-purple-300">
                {totalInterview}
              </p>
              <p className="text-[10px] text-purple-700/80 dark:text-purple-400/80 mt-0.5">
                Interview Scheduled
              </p>
            </button>

            <button
              onClick={() => setStatusFilter("offer")}
              className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                statusFilter === "offer"
                  ? "border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500/40 shadow-xs"
                  : "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
              }`}
            >
              <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>Propostas</span>
                <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
              </p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">
                {totalOffer}
              </p>
              <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                Offer / Aprovado
              </p>
            </button>

            <button
              onClick={() => setStatusFilter("rejected")}
              className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                statusFilter === "rejected"
                  ? "border-rose-500 bg-rose-500/15 ring-1 ring-rose-500/40 shadow-xs"
                  : "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"
              }`}
            >
              <p className="text-[11px] font-medium text-rose-800 dark:text-rose-400 flex items-center justify-between">
                <span>Não Selecionados</span>
                <XCircle className="size-3 text-rose-600 dark:text-rose-400" />
              </p>
              <p className="mt-1 text-2xl font-extrabold text-rose-800 dark:text-rose-400">
                {totalRejected}
              </p>
              <p className="text-[10px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">Rejected</p>
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por cargo, departamento ou cidade..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Segmented Control de Status */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="text-xs h-8"
            >
              Todas ({applications.length})
            </Button>
            <Button
              variant={statusFilter === "screening" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("screening")}
              className={`text-xs h-8 ${
                statusFilter === "screening"
                  ? ""
                  : "text-amber-800 dark:text-amber-300 border-amber-500/30"
              }`}
            >
              Em Análise • In Review ({totalInReview})
            </Button>
            <Button
              variant={statusFilter === "interview" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("interview")}
              className={`text-xs h-8 ${
                statusFilter === "interview"
                  ? ""
                  : "text-purple-800 dark:text-purple-300 border-purple-500/30"
              }`}
            >
              Entrevista Agendada ({totalInterview})
            </Button>
            <Button
              variant={statusFilter === "offer" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("offer")}
              className="text-xs h-8"
            >
              Propostas ({totalOffer})
            </Button>
            <Button
              variant={statusFilter === "rejected" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("rejected")}
              className="text-xs h-8"
            >
              Não Selecionados ({totalRejected})
            </Button>
          </div>
        </div>

        {/* Lista de Candidaturas */}
        <div className="mt-6 space-y-5">
          {appsLoading && (
            <div className="space-y-4">
              <Skeleton className="h-56 rounded-2xl" />
              <Skeleton className="h-56 rounded-2xl" />
            </div>
          )}

          {!appsLoading && filteredApps.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card shadow-xs">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Briefcase className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold">Nenhuma candidatura encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                {applications.length === 0
                  ? "Você ainda não se inscreveu em vagas. Conheça as oportunidades em polos e municípios do interior!"
                  : "Nenhuma candidatura corresponde aos filtros ou busca selecionados."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link to="/">
                    <Briefcase className="mr-2 size-4" /> Ver Vagas Abertas
                  </Link>
                </Button>
                {applications.length === 0 && !user && (
                  <Button variant="outline" onClick={handleDemoCandidateLogin}>
                    Conectar como Candidata Demo (Mariana Souza)
                  </Button>
                )}
                {statusFilter !== "all" && (
                  <Button variant="ghost" onClick={() => setStatusFilter("all")}>
                    Limpar Filtro de Status
                  </Button>
                )}
              </div>
            </div>
          )}

          {!appsLoading &&
            filteredApps.map((app) => {
              const statusCfg = getStatusConfig(app.status);

              return (
                <Card
                  key={app.id}
                  className="overflow-hidden border-border/80 shadow-xs hover:border-primary/40 transition-all duration-200"
                >
                  <CardHeader className="bg-muted/15 pb-4 border-b border-border/50">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        {/* Linha de Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Badge de Status Principal com Alta Visibilidade */}
                          <CandidateStatusBadge
                            status={app.status}
                            size="default"
                            showEnglishTag={true}
                          />

                          {app.job?.department && (
                            <Badge variant="outline" className="text-xs font-normal">
                              {app.job.department}
                            </Badge>
                          )}
                          {app.job?.employment_type && (
                            <Badge variant="secondary" className="text-xs font-normal">
                              {app.job.employment_type}
                            </Badge>
                          )}
                        </div>

                        {/* Título do Cargo */}
                        <h3 className="text-xl font-extrabold tracking-tight text-foreground">
                          {app.job?.title ?? "Vaga de Emprego Regional"}
                        </h3>

                        {/* Metadados: Localização, Salário e Data */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {app.job?.location && (
                            <span className="flex items-center gap-1 font-medium">
                              <MapPin className="size-3.5 text-primary" /> {app.job.location}
                            </span>
                          )}
                          {app.job?.salary_range && (
                            <span className="flex items-center gap-1 font-medium text-foreground/80">
                              <Building2 className="size-3.5 text-primary" /> {app.job.salary_range}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" /> Enviada em{" "}
                            {formatDatePtBR(app.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Botões de Ação do Card */}
                      <div className="flex flex-wrap items-center gap-2 self-start pt-1 sm:pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedApp(app)}
                          className="text-xs font-semibold shadow-2xs"
                        >
                          <Eye className="mr-1.5 size-3.5 text-primary" />
                          Acompanhar Detalhes
                        </Button>

                        {app.job_id && (
                          <Button variant="ghost" size="sm" asChild className="text-xs">
                            <Link to="/vagas/$jobId" params={{ jobId: app.job_id }}>
                              Ver Vaga <ChevronRight className="ml-1 size-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-5 space-y-4">
                    {/* Stepper Visual de Etapas do Recrutamento estilo Sólides ATS */}
                    <CandidateProgressStepper
                      status={app.status}
                      updatedAt={app.updated_at || app.created_at}
                      notes={app.notes}
                      jobLocation={app.job?.location}
                    />

                    {/* Barra de Simulação Rápida para o Candidato/Avaliador testar todos os status */}
                    <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Sparkles className="size-3.5 text-primary" />
                        <span>Simular status desta vaga:</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        <Button
                          variant={app.status === "screening" ? "default" : "outline"}
                          size="sm"
                          disabled={updatingAppId === app.id}
                          onClick={() => handleSimulateStatus(app.id, "screening")}
                          className="h-6 text-[10px] px-2"
                        >
                          In Review
                        </Button>
                        <Button
                          variant={app.status === "interview" ? "default" : "outline"}
                          size="sm"
                          disabled={updatingAppId === app.id}
                          onClick={() => handleSimulateStatus(app.id, "interview")}
                          className="h-6 text-[10px] px-2"
                        >
                          Interview Scheduled
                        </Button>
                        <Button
                          variant={app.status === "offer" ? "default" : "outline"}
                          size="sm"
                          disabled={updatingAppId === app.id}
                          onClick={() => handleSimulateStatus(app.id, "offer")}
                          className="h-6 text-[10px] px-2"
                        >
                          Offer
                        </Button>
                        <Button
                          variant={app.status === "rejected" ? "default" : "outline"}
                          size="sm"
                          disabled={updatingAppId === app.id}
                          onClick={() => handleSimulateStatus(app.id, "rejected")}
                          className="h-6 text-[10px] px-2 text-rose-600 dark:text-rose-400"
                        >
                          Rejected
                        </Button>
                        <Button
                          variant={app.status === "received" ? "default" : "outline"}
                          size="sm"
                          disabled={updatingAppId === app.id}
                          onClick={() => handleSimulateStatus(app.id, "received")}
                          className="h-6 text-[10px] px-2"
                        >
                          Received
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {/* Modal de Detalhes da Inscrição com Status em Destaque */}
        <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
          {selectedApp && (
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="secondary">
                    {selectedApp.job?.department ?? "Vaga Regional"}
                  </Badge>
                  <CandidateStatusBadge
                    status={selectedApp.status}
                    size="sm"
                    showEnglishTag={true}
                  />
                </div>
                <DialogTitle className="text-xl font-bold">
                  {selectedApp.job?.title ?? "Detalhes da Candidatura"}
                </DialogTitle>
                <DialogDescription>
                  Inscrição enviada em {formatDatePtBR(selectedApp.created_at)}
                  {selectedApp.job?.location && ` • ${selectedApp.job.location}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2 text-sm">
                {/* Destaque do Status Atual com Badge Grande */}
                <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Status Atual do Processo
                    </span>
                    <CandidateStatusBadge
                      status={selectedApp.status}
                      size="lg"
                      showEnglishTag={true}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {getStatusConfig(selectedApp.status).longDesc}
                  </p>

                  {selectedApp.notes && (
                    <div className="rounded-lg bg-muted/40 p-3 border border-border/60 text-xs">
                      <span className="font-semibold text-foreground">Comentário do RH: </span>
                      <span className="text-muted-foreground">{selectedApp.notes}</span>
                    </div>
                  )}
                </div>

                {/* Stepper no Modal */}
                <CandidateProgressStepper
                  status={selectedApp.status}
                  updatedAt={selectedApp.updated_at || selectedApp.created_at}
                  notes={selectedApp.notes}
                  jobLocation={selectedApp.job?.location}
                />

                {/* Dados da Inscrição Enviada */}
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    Dados Registrados pelo Candidato
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-primary shrink-0" />
                      <span className="font-medium">{selectedApp.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-primary shrink-0" />
                      <span className="truncate">{selectedApp.email}</span>
                    </div>
                    {selectedApp.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-4 text-primary shrink-0" />
                        <span>{selectedApp.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumo Profissional */}
                {selectedApp.cover_letter && (
                  <div className="space-y-1.5">
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      Resumo Profissional / Apresentação
                    </h4>
                    <p className="rounded-xl border border-border/70 bg-card p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                      {selectedApp.cover_letter}
                    </p>
                  </div>
                )}

                {/* Arquivo de Currículo */}
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    Currículo Cadastrado
                  </h4>
                  <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="size-4 text-primary shrink-0" />
                      <span className="font-medium truncate">
                        {selectedApp.resume_path ?? "curriculo_candidato.pdf"}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      Documento Válido
                    </Badge>
                  </div>
                </div>

                {/* Canal de Atendimento do Interior */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="size-4 text-primary shrink-0" />
                    <span>Dúvidas sobre o processo no polo regional? Fale com nosso suporte.</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 shrink-0"
                    onClick={() =>
                      toast.info(
                        "Canal de apoio ao candidato regional: contato pelo e-mail rh@talentosinterior.com.br",
                      )
                    }
                  >
                    Contato RH
                  </Button>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const toCancel = selectedApp;
                    setSelectedApp(null);
                    setAppToCancel(toCancel);
                  }}
                >
                  Desistir desta Vaga
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)}>
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>

        {/* Diálogo de Confirmação para Desistir da Vaga */}
        <AlertDialog open={!!appToCancel} onOpenChange={(open) => !open && setAppToCancel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza que deseja desistir da vaga?</AlertDialogTitle>
              <AlertDialogDescription>
                Ao cancelar sua candidatura para "{appToCancel?.job?.title}", seu perfil será
                removido do processo seletivo deste cargo no polo regional.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelling}>Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelApplication}
                disabled={cancelling}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelling ? "Cancelando..." : "Confirmar desistência"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
