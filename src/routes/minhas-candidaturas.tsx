import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  MapPin,
  User,
  Mail,
  Phone,
  AlertCircle,
  XCircle,
  HelpCircle,
  Sparkles,
  Search,
  BookOpen,
  Compass,
  Building2,
  Laptop,
  Check,
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
          "Acompanhe o andamento das suas candidaturas em polos e cidades do interior com transparência e didática.",
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
  created_at: string;
  updated_at?: string;
  job?: JobItem | undefined;
}

const STAGES: Array<{ key: ApplicationStatus; label: string; desc: string }> = [
  { key: "received", label: "1. Inscrição", desc: "Currículo recebido pelo polo" },
  { key: "screening", label: "2. Triagem", desc: "Análise didática de perfil e requisitos" },
  { key: "interview", label: "3. Entrevistas", desc: "Conversa com RH / Liderança regional" },
  { key: "offer", label: "4. Proposta", desc: "Aprovação e orientações de contratação" },
];

function getStageStep(status: ApplicationStatus): number {
  switch (status) {
    case "received":
      return 1;
    case "screening":
      return 2;
    case "interview":
      return 3;
    case "offer":
      return 4;
    case "rejected":
      return 2;
    default:
      return 1;
  }
}

function getStatusBadge(status: ApplicationStatus) {
  switch (status) {
    case "received":
      return (
        <Badge
          variant="secondary"
          className="bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20 font-medium text-xs"
        >
          Inscrição Recebida
        </Badge>
      );
    case "screening":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 font-medium text-xs"
        >
          Em Triagem
        </Badge>
      );
    case "interview":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-medium text-xs"
        >
          Em Entrevista
        </Badge>
      );
    case "offer":
      return (
        <Badge
          variant="secondary"
          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium text-xs"
        >
          Proposta Enviada
        </Badge>
      );
    case "rejected":
      return (
        <Badge
          variant="secondary"
          className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 font-medium text-xs"
        >
          Processo Encerrado
        </Badge>
      );
  }
}

function normalizeStatus(st: string): ApplicationStatus {
  if (st === "in_review") return "screening";
  if (st === "interviewing") return "interview";
  if (st === "offered") return "offer";
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

  const filteredApps = applications.filter((app) => {
    const titleMatch = app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? true;
    const deptMatch =
      app.job?.department?.toLowerCase().includes(searchQuery.toLowerCase()) ?? true;
    const textMatch = !searchQuery || titleMatch || deptMatch;

    if (!textMatch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "active") return app.status !== "rejected" && app.status !== "offer";
    if (statusFilter === "interview") return app.status === "interview";
    if (statusFilter === "finished") return app.status === "rejected" || app.status === "offer";
    return true;
  });

  const totalActive = applications.filter(
    (a) => a.status !== "rejected" && a.status !== "offer",
  ).length;
  const totalInterviews = applications.filter((a) => a.status === "interview").length;
  const totalOffered = applications.filter((a) => a.status === "offer").length;

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
                Setor de Oportunidades & Desenvolvimento do Interior
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {user?.user_metadata?.["full_name"]
                  ? `Olá, ${user.user_metadata["full_name"]}!`
                  : "Painel do Candidato do Interior"}
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Aqui você acompanha suas oportunidades de trabalho em polos regionais e cidades do
                interior, com etapas claras, transparentes e apoio didático em cada fase.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="font-semibold shadow-xs text-xs"
                onClick={() => setShowDidacticGuide(!showDidacticGuide)}
              >
                <BookOpen className="mr-1.5 size-4 text-primary" />
                {showDidacticGuide ? "Fechar Guia Didático" : "Guia Didático do Candidato"}
              </Button>

              <Button asChild variant="default" className="shadow-xs font-semibold text-xs">
                <Link to="/">
                  <Briefcase className="mr-1.5 size-4" /> Buscar Vagas
                </Link>
              </Button>
            </div>
          </div>

          {/* Painel Didático Expansível para Moradores do Interior */}
          {showDidacticGuide && (
            <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5 text-xs text-foreground space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 font-bold text-sm text-primary">
                <Sparkles className="size-4" />
                Passo a Passo Didático para Quem Busca Oportunidade no Interior
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-card p-3.5 border border-border/80 space-y-1.5 shadow-2xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Check className="size-3.5 text-emerald-600" /> 1. Inscrição Sem Burocracia
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    Você só precisa de nome, contato e um resumo simples das suas experiências. Não
                    se preocupe se veio de outra área: talentos locais são muito valorizados!
                  </p>
                </div>

                <div className="rounded-lg bg-card p-3.5 border border-border/80 space-y-1.5 shadow-2xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-blue-600" /> 2. Modalidades no Interior
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>Polo Regional:</strong> trabalho perto da sua casa.
                    <br />
                    <strong>Remoto:</strong> trabalhe de casa sem se mudar da sua cidade ou família.
                  </p>
                </div>

                <div className="rounded-lg bg-card p-3.5 border border-border/80 space-y-1.5 shadow-2xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Laptop className="size-3.5 text-amber-600" /> 3. Entrevistas Acolhedoras
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    As entrevistas podem ser por videochamada simples no celular ou presenciais no
                    polo regional com o RH local. Avisamos tudo por e-mail e WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cards de Métricas */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/80 bg-card/80 p-4 backdrop-blur shadow-xs">
              <p className="text-xs font-medium text-muted-foreground">Inscrições Enviadas</p>
              <p className="mt-1 text-2xl font-bold">{applications.length}</p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-xs">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                Em Processo Ativo
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-400">
                {totalActive}
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-xs">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Em Entrevista
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
                {totalInterviews}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Propostas & Aprovado
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {totalOffered}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cargo, polo regional ou área..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              Todas ({applications.length})
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Em Andamento ({totalActive})
            </Button>
            <Button
              variant={statusFilter === "interview" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("interview")}
            >
              Entrevistas ({totalInterviews})
            </Button>
            <Button
              variant={statusFilter === "finished" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("finished")}
            >
              Finalizadas
            </Button>
          </div>
        </div>

        {/* Lista de Candidaturas */}
        <div className="mt-6 space-y-4">
          {appsLoading && (
            <div className="space-y-4">
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
            </div>
          )}

          {!appsLoading && filteredApps.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Briefcase className="size-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold">Nenhuma candidatura encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                {applications.length === 0
                  ? "Você ainda não se inscreveu em vagas do interior. Conheça as oportunidades abertas e dê o próximo passo na sua carreira!"
                  : "Nenhuma candidatura corresponde aos filtros selecionados."}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild>
                  <Link to="/">
                    <Briefcase className="mr-2 size-4" /> Ver Vagas Abertas
                  </Link>
                </Button>
                {applications.length === 0 && !user && (
                  <Button variant="outline" onClick={handleDemoCandidateLogin}>
                    Testar com Candidata Demo do Interior
                  </Button>
                )}
              </div>
            </div>
          )}

          {!appsLoading &&
            filteredApps.map((app) => {
              const currentStep = getStageStep(app.status);
              const isRejected = app.status === "rejected";

              return (
                <Card
                  key={app.id}
                  className="overflow-hidden border-border/80 shadow-xs hover:border-primary/40 transition-all duration-200"
                >
                  <CardHeader className="bg-muted/20 pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {app.job?.department && (
                            <Badge variant="secondary" className="text-xs">
                              {app.job.department}
                            </Badge>
                          )}
                          {app.job?.employment_type && (
                            <Badge variant="outline" className="text-xs">
                              {app.job.employment_type}
                            </Badge>
                          )}
                          {getStatusBadge(app.status)}
                        </div>

                        <h3 className="text-xl font-bold tracking-tight text-foreground">
                          {app.job?.title ?? "Vaga de Emprego Regional"}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {app.job?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5 text-primary" /> {app.job.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" /> Inscrito em{" "}
                            {formatDatePtBR(app.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedApp(app)}
                          className="text-xs"
                        >
                          <Eye className="mr-1.5 size-3.5" /> Ver Inscrição
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

                  <CardContent className="pt-6">
                    {/* Stepper Visual de Etapas do Recrutamento estilo Sólides */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="size-3.5 text-primary" /> Etapas do Processo
                          Seletivo Didático
                        </span>
                        <span>
                          {isRejected
                            ? "Status: Processo encerrado"
                            : `Etapa ${currentStep} de ${STAGES.length}`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {STAGES.map((stage, idx) => {
                          const stepNumber = idx + 1;
                          const isDone = !isRejected && currentStep > stepNumber;
                          const isCurrent = !isRejected && currentStep === stepNumber;
                          const isFailedHere = isRejected && stepNumber === currentStep;

                          return (
                            <div
                              key={stage.key}
                              className={`rounded-xl border p-3 transition-colors ${
                                isDone
                                  ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                                  : isCurrent
                                    ? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary/30"
                                    : isFailedHere
                                      ? "border-rose-500/30 bg-rose-500/5 text-muted-foreground"
                                      : "border-border/60 bg-muted/10 text-muted-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                                    isDone
                                      ? "bg-emerald-500 text-white"
                                      : isCurrent
                                        ? "bg-primary text-primary-foreground"
                                        : isFailedHere
                                          ? "bg-rose-500 text-white"
                                          : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="size-3.5" />
                                  ) : isFailedHere ? (
                                    <XCircle className="size-3.5" />
                                  ) : (
                                    stepNumber
                                  )}
                                </div>
                                <span className="font-semibold text-xs leading-none">
                                  {stage.label}
                                </span>
                              </div>
                              <p className="mt-1.5 text-[11px] text-muted-foreground line-clamp-1">
                                {stage.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Caixa de Mensagem / Orientação Didática */}
                      <div className="mt-4 rounded-xl border border-border/80 bg-muted/30 p-3.5 text-xs text-muted-foreground flex items-start gap-3">
                        <AlertCircle className="size-4 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          {app.status === "received" && (
                            <p>
                              <strong>Etapa 1:</strong> Sua candidatura foi registrada no polo
                              regional e está aguardando a análise da equipe de recrutamento. Fique
                              atento ao seu telefone e e-mail.
                            </p>
                          )}
                          {app.status === "screening" && (
                            <p className="text-foreground font-medium">
                              <strong>Etapa 2 (Triagem):</strong> Seu perfil e experiências estão em
                              análise pelo recrutador regional. Em breve você receberá novidades!
                            </p>
                          )}
                          {app.status === "interview" && (
                            <p className="text-amber-700 dark:text-amber-400 font-medium">
                              <strong>Etapa 3 (Entrevista):</strong> Parabéns! Seu perfil avançou
                              para entrevista com os gestores da vaga. Fique atento às orientações
                              de data e link da chamada ou local do polo.
                            </p>
                          )}
                          {app.status === "offer" && (
                            <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              <strong>Etapa 4 (Aprovado):</strong> Excelente notícia! Você recebeu
                              uma proposta de trabalho. Entre em contato com o time de RH para tirar
                              dúvidas sobre a contratação.
                            </p>
                          )}
                          {app.status === "rejected" && (
                            <p>
                              Agradecemos sua dedicação a este processo seletivo regional. Seu
                              currículo continua registrado em nosso banco de talentos do interior
                              para futuras vagas que surgirem na sua região.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {/* Modal de Detalhes da Inscrição */}
        <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
          {selectedApp && (
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedApp.job?.department ?? "Vaga"}</Badge>
                  {getStatusBadge(selectedApp.status)}
                </div>
                <DialogTitle className="text-xl">
                  {selectedApp.job?.title ?? "Detalhes da Candidatura"}
                </DialogTitle>
                <DialogDescription>
                  Inscrito em {formatDatePtBR(selectedApp.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    Dados Informados
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-primary" />
                      <span>{selectedApp.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-primary" />
                      <span>{selectedApp.email}</span>
                    </div>
                    {selectedApp.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-4 text-primary" />
                        <span>{selectedApp.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

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

                <div className="space-y-1.5">
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    Currículo Anexado
                  </h4>
                  <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-primary" />
                      <span className="font-medium truncate max-w-[240px]">
                        {selectedApp.resume_path ?? "curriculo_candidato.pdf"}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      PDF registrado
                    </Badge>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const toCancel = selectedApp;
                    setSelectedApp(null);
                    setAppToCancel(toCancel);
                  }}
                >
                  Desistir da Vaga
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
