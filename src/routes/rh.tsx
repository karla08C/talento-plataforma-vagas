import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Users,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  Eye,
  FileText,
  MapPin,
  Mail,
  Phone,
  Star,
  Sparkles,
  BarChart3,
  BookOpen,
  Compass,
  Check,
  Building2,
  Award,
  HeartHandshake,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSessionState } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { formatDatePtBR } from "@/lib/utils";
import { CompanyLogoSlot } from "@/components/CompanyLogoSlot";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export const Route = createFileRoute("/rh")({
  head: () => ({
    meta: [
      { title: "Painel do RH & Atração de Talentos do Interior | Talentos" },
      {
        name: "description",
        content:
          "Gestão didática de vagas regionais, pipeline de candidatos dos municípios e etapas de seleção.",
      },
    ],
  }),
  component: RhDashboardPage,
});

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  seniority: string;
  salary_range: string | null;
  description: string;
  requirements: string | null;
  status: "open" | "closed";
  created_at: string;
  updated_at?: string;
}

interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cover_letter: string | null;
  resume_path: string | null;
  status: ApplicationStatus;
  notes?: string | undefined;
  rating?: number | undefined;
  created_at: string;
  updated_at?: string | undefined;
  job?: Job | undefined;
}

const DEPARTMENTS = [
  "Desenvolvimento & Tecnologia",
  "Operações & Polo Regional",
  "Recursos Humanos & Gestão de Pessoas",
  "Agronegócio & Cadeias Produtivas",
  "Comercial & Expansão Regional",
  "Administrativo & Financeiro",
  "Logística & Suprimentos",
  "Atendimento ao Cidadão / Cliente",
  "Marketing & Comunicação Regional",
];

const REGIONAL_LOCATION_PRESETS = [
  "Polo Regional Ribeirão Preto / SP",
  "Polo Regional Campinas / SP",
  "Polo Regional São José dos Campos / SP",
  "Polo Regional Sorocaba / SP",
  "Polo Regional Feira de Santana / BA",
  "Polo Regional Caruaru / PE",
  "Polo Regional Londrina / PR",
  "Polo Regional Juiz de Fora / MG",
  "Polo Regional Anápolis / GO",
  "Polo Regional Chapecó / SC",
  "Remoto - Qualquer Município do Interior",
];

const EMPLOYMENT_TYPES = ["CLT", "PJ", "Estágio", "Temporário"];
const SENIORITIES = ["Estágio", "Júnior", "Pleno", "Sênior", "Especialista", "Liderança"];

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

export function RhDashboardPage() {
  const { user, isHr } = useSessionState();
  const queryClient = useQueryClient();

  // Active main tab
  const [activeTab, setActiveTab] = useState("candidates");

  // Filters for candidates tab
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");

  // Filters for jobs tab
  const [jobSearch, setJobSearch] = useState("");
  const [jobDeptFilter, setJobDeptFilter] = useState("all");

  // Candidate detail modal state
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [candidateNotes, setCandidateNotes] = useState("");
  const [candidateRating, setCandidateRating] = useState(0);

  // Job create & edit modal state
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  // New/Edit Job form data
  const [jobFormData, setJobFormData] = useState({
    title: "",
    department: "Desenvolvimento & Tecnologia",
    location: "Polo Regional Ribeirão Preto / SP",
    employment_type: "CLT",
    seniority: "Pleno",
    salary_range: "R$ 6.500 - R$ 8.500",
    description: "",
    requirements: "",
    status: "open" as "open" | "closed",
  });

  // Fetch Jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["rh-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Job[];
    },
  });

  // Fetch Applications
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["rh-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: jobsData } = await supabase.from("jobs").select("*");
      const map = new Map((jobsData ?? []).map((j: Job) => [j.id, j]));

      return ((data ?? []) as Array<Record<string, unknown>>).map((raw) => {
        const id = String(raw["id"]);
        const localNote =
          typeof window !== "undefined"
            ? (localStorage.getItem(`recruiter_note_${id}`) ?? (raw["notes"] as string | undefined))
            : (raw["notes"] as string | undefined);
        const localRating =
          typeof window !== "undefined"
            ? Number(localStorage.getItem(`recruiter_rating_${id}`)) ||
              (raw["rating"] as number | undefined) ||
              4
            : ((raw["rating"] as number | undefined) ?? 4);

        const app: Application = {
          id,
          job_id: String(raw["job_id"]),
          candidate_id: String(raw["candidate_id"]),
          full_name: String(raw["full_name"]),
          email: String(raw["email"]),
          phone: (raw["phone"] as string) ?? null,
          cover_letter: (raw["cover_letter"] as string) ?? null,
          resume_path: (raw["resume_path"] as string) ?? null,
          status: normalizeStatus(String(raw["status"])),
          notes: localNote,
          rating: localRating,
          created_at: String(raw["created_at"]),
          updated_at: raw["updated_at"] as string | undefined,
          job: map.get(String(raw["job_id"])) ?? undefined,
        };
        return app;
      });
    },
  });

  // Handle Demo RH Mode Login
  const handleActivateDemoHr = async () => {
    await supabase.auth.signInWithPassword({
      email: "rh@exemplo.com",
      password: "demo-password-123",
    });
    void queryClient.invalidateQueries({ queryKey: ["rh-jobs"] });
    void queryClient.invalidateQueries({ queryKey: ["rh-applications"] });
    toast.success("Modo Recrutador RH Regional ativado!");
  };

  // Open Job Creation Modal
  const handleOpenCreateJob = () => {
    setEditingJob(null);
    setJobFormData({
      title: "",
      department: "Desenvolvimento & Tecnologia",
      location: "Polo Regional Ribeirão Preto / SP",
      employment_type: "CLT",
      seniority: "Pleno",
      salary_range: "R$ 6.500 - R$ 8.500",
      description: "",
      requirements: "",
      status: "open",
    });
    setIsJobModalOpen(true);
  };

  // Open Job Edit Modal
  const handleOpenEditJob = (job: Job) => {
    setEditingJob(job);
    setJobFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      employment_type: job.employment_type,
      seniority: job.seniority,
      salary_range: job.salary_range ?? "",
      description: job.description,
      requirements: job.requirements ?? "",
      status: job.status,
    });
    setIsJobModalOpen(true);
  };

  // Save Job (Insert or Update)
  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobFormData.title.trim() || !jobFormData.description.trim()) {
      toast.error("Preencha ao menos o título e a descrição da vaga.");
      return;
    }

    try {
      if (editingJob) {
        const { error } = await supabase
          .from("jobs")
          .update({
            title: jobFormData.title.trim(),
            department: jobFormData.department,
            location: jobFormData.location.trim(),
            employment_type: jobFormData.employment_type,
            seniority: jobFormData.seniority,
            salary_range: jobFormData.salary_range.trim() || null,
            description: jobFormData.description.trim(),
            requirements: jobFormData.requirements.trim() || null,
            status: jobFormData.status,
          })
          .eq("id", editingJob.id);

        if (error) throw error;
        toast.success("Vaga regional atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("jobs").insert({
          title: jobFormData.title.trim(),
          department: jobFormData.department,
          location: jobFormData.location.trim(),
          employment_type: jobFormData.employment_type,
          seniority: jobFormData.seniority,
          salary_range: jobFormData.salary_range.trim() || null,
          description: jobFormData.description.trim(),
          requirements: jobFormData.requirements.trim() || null,
          status: jobFormData.status,
          created_by: user?.id ?? null,
        });

        if (error) throw error;
        toast.success("Nova oportunidade cadastrada para o interior!");
      }

      setIsJobModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["rh-jobs"] });
    } catch (err: unknown) {
      toast.error("Erro ao salvar vaga", {
        description: err instanceof Error ? err.message : "Tente novamente mais tarde.",
      });
    }
  };

  // Toggle Job Status (Open/Closed)
  const handleToggleJobStatus = async (job: Job) => {
    const nextStatus = job.status === "open" ? "closed" : "open";
    try {
      const { error } = await supabase.from("jobs").update({ status: nextStatus }).eq("id", job.id);

      if (error) throw error;
      toast.success(
        nextStatus === "open"
          ? "Vaga reaberta para inscrições!"
          : "Vaga encerrada para novas inscrições.",
      );
      void queryClient.invalidateQueries({ queryKey: ["rh-jobs"] });
    } catch {
      toast.error("Erro ao alterar status da vaga");
    }
  };

  // Delete Job
  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", jobToDelete.id);
      if (error) throw error;
      toast.success("Vaga removida com sucesso");
      setJobToDelete(null);
      void queryClient.invalidateQueries({ queryKey: ["rh-jobs"] });
    } catch {
      toast.error("Erro ao excluir vaga");
    }
  };

  // Update Candidate Status
  const handleUpdateCandidateStatus = async (candidateId: string, newStatus: ApplicationStatus) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", candidateId);

      if (error) throw error;
      toast.success(`Etapa do candidato atualizada com sucesso!`);
      void queryClient.invalidateQueries({ queryKey: ["rh-applications"] });

      if (selectedCandidate && selectedCandidate.id === candidateId) {
        setSelectedCandidate((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  // Open Candidate Detail Modal
  const handleOpenCandidateDetails = (candidate: Application) => {
    setSelectedCandidate(candidate);
    setCandidateNotes(candidate.notes ?? "");
    setCandidateRating(candidate.rating ?? 4);
  };

  // Save Recruiter Notes & Rating
  const handleSaveCandidateFeedback = async () => {
    if (!selectedCandidate) return;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`recruiter_note_${selectedCandidate.id}`, candidateNotes);
        localStorage.setItem(`recruiter_rating_${selectedCandidate.id}`, String(candidateRating));
      }

      toast.success("Anotações e avaliação do recrutador salvas!");
      setSelectedCandidate(null);
      void queryClient.invalidateQueries({ queryKey: ["rh-applications"] });
    } catch {
      toast.error("Erro ao salvar anotações");
    }
  };

  // Filtered Applications for Candidate Pipeline
  const filteredCandidates = applications.filter((app) => {
    const nameMatch = app.full_name?.toLowerCase().includes(candidateSearch.toLowerCase());
    const emailMatch = app.email?.toLowerCase().includes(candidateSearch.toLowerCase());
    const jobTitleMatch = app.job?.title?.toLowerCase().includes(candidateSearch.toLowerCase());
    const matchesSearch = !candidateSearch || nameMatch || emailMatch || jobTitleMatch;

    if (!matchesSearch) return false;

    if (selectedJobFilter !== "all" && app.job_id !== selectedJobFilter) return false;
    if (selectedStatusFilter !== "all" && app.status !== selectedStatusFilter) return false;

    return true;
  });

  // Filtered Jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesText =
      !jobSearch ||
      job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      job.location.toLowerCase().includes(jobSearch.toLowerCase());
    const matchesDept = jobDeptFilter === "all" || job.department === jobDeptFilter;
    return matchesText && matchesDept;
  });

  // Calculate Metrics
  const totalJobsCount = jobs.length;
  const openJobsCount = jobs.filter((j) => j.status === "open").length;
  const totalApplicationsCount = applications.length;
  const interviewingCount = applications.filter((a) => a.status === "interview").length;
  const offeredCount = applications.filter((a) => a.status === "offer").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Banner Superior do RH com Apoio ao Desenvolvimento Regional */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/15 via-card to-accent/15 p-6 sm:p-8 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Compass className="size-3.5" />
                Gestão de Pessoas & Atração no Interior
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Painel do RH & Desenvolvimento Regional
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Ferramenta didática para gestão de processos seletivos nos polos do interior. Crie
                vagas regionais, avalie currículos de forma humanizada e conduza entrevistas com
                clareza.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <CompanyLogoSlot
                variant="header"
                showConfigureButton={true}
                className="bg-card/70 border border-border/80 px-2.5 py-1 rounded-xl shadow-2xs"
              />
              <Button onClick={handleOpenCreateJob} className="font-semibold shadow-xs">
                <Plus className="mr-1.5 size-4" /> Nova Vaga Regional
              </Button>
              {!isHr && (
                <Button variant="outline" onClick={handleActivateDemoHr} className="shadow-xs">
                  <Sparkles className="mr-1.5 size-4 text-primary" /> Ativar Modo RH
                </Button>
              )}
            </div>
          </div>

          {/* Cards de Métricas Principais */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/80 bg-card/90 p-4 shadow-xs">
              <p className="text-xs font-medium text-muted-foreground">Vagas Abertas no Interior</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {openJobsCount}
                </span>
                <span className="text-xs text-muted-foreground">de {totalJobsCount} total</span>
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-xs">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                Talentos Cadastrados
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-400">
                  {totalApplicationsCount}
                </span>
                <span className="text-xs text-blue-600/80 dark:text-blue-300">inscritos</span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-xs">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Em Fase de Entrevistas
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-400">
                  {interviewingCount}
                </span>
                <span className="text-xs text-amber-600/80 dark:text-amber-300">ativos</span>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Propostas & Contratações
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                  {offeredCount}
                </span>
                <span className="text-xs text-emerald-600/80 dark:text-emerald-300">
                  finalistas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Abas de Navegação Principal do RH */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-3">
              <TabsList className="bg-muted/60 p-1">
                <TabsTrigger value="candidates" className="gap-2 font-semibold text-xs sm:text-sm">
                  <Users className="size-4" />
                  Candidatos & Pipeline ({totalApplicationsCount})
                </TabsTrigger>
                <TabsTrigger value="jobs" className="gap-2 font-semibold text-xs sm:text-sm">
                  <Briefcase className="size-4" />
                  Gestão de Vagas ({totalJobsCount})
                </TabsTrigger>
                <TabsTrigger value="guide" className="gap-2 font-semibold text-xs sm:text-sm">
                  <BookOpen className="size-4 text-primary" />
                  Guia Didático do RH
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2 font-semibold text-xs sm:text-sm">
                  <BarChart3 className="size-4" />
                  Métricas & SLA
                </TabsTrigger>
              </TabsList>

              {activeTab === "candidates" && (
                <span className="text-xs text-muted-foreground">
                  Exibindo {filteredCandidates.length} candidatos no funil
                </span>
              )}
            </div>

            {/* ABA 1: Pipeline de Candidatos (ATS) */}
            <TabsContent value="candidates" className="space-y-6">
              {/* Barra de Filtros de Candidatos */}
              <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar candidato por nome, e-mail ou vaga regional..."
                    className="pl-9"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-full sm:w-56">
                    <Select value={selectedJobFilter} onValueChange={setSelectedJobFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Todas as vagas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as vagas</SelectItem>
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-48">
                    <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Etapa / Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as etapas</SelectItem>
                        <SelectItem value="received">1. Inscrição Recebida</SelectItem>
                        <SelectItem value="screening">2. Em Triagem</SelectItem>
                        <SelectItem value="interview">3. Em Entrevista</SelectItem>
                        <SelectItem value="offer">4. Proposta Enviada</SelectItem>
                        <SelectItem value="rejected">5. Não Selecionado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Lista de Candidatos */}
              {appsLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </div>
              )}

              {!appsLoading && filteredCandidates.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="size-6" />
                  </div>
                  <h3 className="mt-3 text-lg font-bold">Nenhum candidato encontrado</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tente ajustar seus termos de pesquisa ou filtros de vaga.
                  </p>
                </div>
              )}

              {!appsLoading && filteredCandidates.length > 0 && (
                <div className="space-y-3">
                  {filteredCandidates.map((app) => (
                    <Card
                      key={app.id}
                      className="border-border/80 shadow-xs hover:border-primary/40 transition-colors"
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-base text-foreground truncate">
                                {app.full_name}
                              </h4>
                              {app.job?.department && (
                                <Badge variant="secondary" className="text-xs">
                                  {app.job.department}
                                </Badge>
                              )}
                              {app.rating && (
                                <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                                  <Star className="size-3.5 fill-amber-500" />
                                  <span className="font-bold">{app.rating}.0</span>
                                </div>
                              )}
                            </div>

                            <p className="text-sm font-medium text-primary">
                              {app.job?.title ?? "Vaga Regional"}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="size-3 text-muted-foreground" /> {app.email}
                              </span>
                              {app.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="size-3 text-muted-foreground" /> {app.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="size-3 text-muted-foreground" /> Inscrito em{" "}
                                {formatDatePtBR(app.created_at)}
                              </span>
                            </div>

                            {app.notes && (
                              <p className="mt-2 text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg line-clamp-1 border border-border/50">
                                <strong className="text-foreground">Nota interna do RH:</strong>{" "}
                                {app.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
                            <div className="w-48">
                              <Select
                                value={app.status}
                                onValueChange={(val) =>
                                  handleUpdateCandidateStatus(app.id, val as ApplicationStatus)
                                }
                              >
                                <SelectTrigger className="h-9 text-xs font-semibold">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="received">1. Inscrição Recebida</SelectItem>
                                  <SelectItem value="screening">2. Em Triagem (Perfil)</SelectItem>
                                  <SelectItem value="interview">3. Em Entrevista</SelectItem>
                                  <SelectItem value="offer">4. Proposta Enviada</SelectItem>
                                  <SelectItem value="rejected">5. Não Selecionado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenCandidateDetails(app)}
                              className="text-xs"
                            >
                              <Eye className="mr-1.5 size-3.5" /> Detalhes & Currículo
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ABA 2: Gestão de Vagas */}
            <TabsContent value="jobs" className="space-y-6">
              <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar vagas por título ou município do interior..."
                    className="pl-9"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={jobDeptFilter} onValueChange={setJobDeptFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Departamentos</SelectItem>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={handleOpenCreateJob}>
                    <Plus className="mr-1.5 size-4" /> Criar Vaga
                  </Button>
                </div>
              </div>

              {jobsLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-28 rounded-xl" />
                  <Skeleton className="h-28 rounded-xl" />
                </div>
              )}

              {!jobsLoading && filteredJobs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Briefcase className="size-6" />
                  </div>
                  <h3 className="mt-3 text-lg font-bold">Nenhuma vaga cadastrada</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Clique em "+ Nova Vaga Regional" para publicar uma oportunidade.
                  </p>
                  <Button onClick={handleOpenCreateJob} className="mt-4">
                    Cadastrar Vaga
                  </Button>
                </div>
              )}

              {!jobsLoading && filteredJobs.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredJobs.map((job) => {
                    const jobCandidateCount = applications.filter(
                      (a) => a.job_id === job.id,
                    ).length;

                    return (
                      <Card
                        key={job.id}
                        className={`flex flex-col justify-between border-border/80 shadow-xs transition-all hover:border-primary/40 ${
                          job.status === "closed" ? "opacity-75 bg-muted/15" : "bg-card"
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {job.department}
                            </Badge>
                            <div className="flex items-center gap-1.5">
                              {job.status === "open" ? (
                                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium text-[11px]">
                                  Aberta
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-muted-foreground text-[11px]"
                                >
                                  Encerrada
                                </Badge>
                              )}
                            </div>
                          </div>

                          <CardTitle className="text-lg font-bold line-clamp-1 mt-2">
                            {job.title}
                          </CardTitle>

                          <div className="space-y-1 pt-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="size-3.5 text-primary shrink-0" />
                              <span className="truncate">{job.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>{job.employment_type}</span>
                              <span>•</span>
                              <span>{job.seniority}</span>
                              {job.salary_range && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{job.salary_range}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <div className="rounded-lg bg-muted/30 p-2.5 text-xs flex items-center justify-between mb-4 border border-border/60">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Users className="size-3.5 text-primary" /> Candidatos do interior:
                            </span>
                            <span className="font-bold text-foreground">
                              {jobCandidateCount} pessoas
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-primary font-semibold p-0 h-auto"
                              onClick={() => {
                                setSelectedJobFilter(job.id);
                                setActiveTab("candidates");
                              }}
                            >
                              Ver Inscritos ({jobCandidateCount})
                            </Button>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => handleToggleJobStatus(job)}
                              >
                                {job.status === "open" ? "Encerrar" : "Reabrir"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => handleOpenEditJob(job)}
                              >
                                <Edit className="size-3.5 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-destructive hover:bg-destructive/10"
                                onClick={() => setJobToDelete(job)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ABA 3: Guia Didático do Recrutador Regional */}
            <TabsContent value="guide" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-primary/20 shadow-xs md:col-span-1">
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                      <BookOpen className="size-5" />
                    </div>
                    <CardTitle className="text-lg">Pilares do RH do Interior</CardTitle>
                    <CardDescription>
                      Boas práticas didáticas para atração de talentos regionais
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                    <p>
                      <strong>1. Clareza e Acolhimento:</strong> Evite jargões em inglês e termos
                      corporativos excessivos. Explique o que a pessoa fará no dia a dia com
                      linguagem do cotidiano regional.
                    </p>
                    <p>
                      <strong>2. Valorização do Potencial Local:</strong> Muitas pessoas do interior
                      têm enorme capacidade prática e dedicação, mas não tiveram acesso a cursos
                      caros. Avalie a vontade de aprender e o comprometimento.
                    </p>
                    <p>
                      <strong>3. Respeito ao Tempo de Resposta:</strong> Não deixe candidatos sem
                      feedback. Manter a reputação da empresa limpa nos municípios vizinhos é
                      fundamental.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/80 shadow-xs md:col-span-2">
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 mb-2">
                      <HeartHandshake className="size-5" />
                    </div>
                    <CardTitle className="text-lg">
                      Passo a Passo Didático para Conduzir a Vaga
                    </CardTitle>
                    <CardDescription>
                      Como estruturar o processo para ter os melhores resultados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs leading-relaxed">
                    <div className="rounded-xl border border-border/70 p-3.5 bg-muted/20 space-y-1">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Check className="size-4 text-emerald-600" /> Etapa 1: Definição da
                        Modalidade Regional
                      </span>
                      <p className="text-muted-foreground">
                        Defina se o profissional precisa estar presente todos os dias no polo
                        regional, se pode atuar em modelo híbrido ou se a vaga é 100% remota
                        (expandindo o alcance para dezenas de cidades vizinhas).
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/70 p-3.5 bg-muted/20 space-y-1">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Check className="size-4 text-blue-600" /> Etapa 2: Triagem Didática e Justa
                      </span>
                      <p className="text-muted-foreground">
                        Utilize a aba "Candidatos & Pipeline" para classificar os perfis recebidos.
                        Avance os selecionados para "Em Triagem" e depois para "Em Entrevista",
                        preenchendo as notas internas com observações construtivas.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/70 p-3.5 bg-muted/20 space-y-1">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Check className="size-4 text-amber-600" /> Etapa 3: Entrevista e Feedback
                        Humano
                      </span>
                      <p className="text-muted-foreground">
                        Envie mensagem ou e-mail com horário e orientações claras sobre como acessar
                        a videochamada ou como chegar ao escritório do polo regional. Após a
                        entrevista, atualize o status para "Proposta Enviada" ou encerre informando
                        o motivo com empatia.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ABA 4: Relatórios e Indicadores do RH */}
            <TabsContent value="reports" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Candidaturas por Departamento Regional
                    </CardTitle>
                    <CardDescription>
                      Volume de talentos atraídos por área no interior
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {DEPARTMENTS.slice(0, 6).map((dept) => {
                      const count = applications.filter((a) => a.job?.department === dept).length;
                      const percentage =
                        totalApplicationsCount > 0
                          ? Math.round((count / totalApplicationsCount) * 100)
                          : 0;

                      return (
                        <div key={dept} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{dept}</span>
                            <span className="text-muted-foreground">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${Math.max(percentage, 5)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card className="shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-lg">Funil de Conversão do Recrutamento</CardTitle>
                    <CardDescription>
                      Passagem dos candidatos pelas etapas de seleção
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs">
                      <div>
                        <p className="font-bold text-sky-800 dark:text-sky-300">
                          1. Inscrições Recebidas
                        </p>
                        <p className="text-muted-foreground">Porta de entrada no polo regional</p>
                      </div>
                      <span className="text-lg font-extrabold text-sky-700 dark:text-sky-400">
                        {totalApplicationsCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                      <div>
                        <p className="font-bold text-blue-800 dark:text-blue-300">
                          2. Em Triagem pelo RH
                        </p>
                        <p className="text-muted-foreground">Avaliação de perfil e aderência</p>
                      </div>
                      <span className="text-lg font-extrabold text-blue-700 dark:text-blue-400">
                        {applications.filter((a) => a.status === "screening").length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                      <div>
                        <p className="font-bold text-amber-800 dark:text-amber-300">
                          3. Entrevistas Técnicas & Culturais
                        </p>
                        <p className="text-muted-foreground">Comunicação direta com o candidato</p>
                      </div>
                      <span className="text-lg font-extrabold text-amber-700 dark:text-amber-400">
                        {interviewingCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                      <div>
                        <p className="font-bold text-emerald-800 dark:text-emerald-300">
                          4. Proposta Salarial Aceita / Contratação
                        </p>
                        <p className="text-muted-foreground">Finalização do processo com sucesso</p>
                      </div>
                      <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                        {offeredCount}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal de Detalhes do Candidato, Avaliação e Anotações Internas */}
        <Dialog
          open={!!selectedCandidate}
          onOpenChange={(open) => !open && setSelectedCandidate(null)}
        >
          {selectedCandidate && (
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedCandidate.job?.department ?? "Vaga"}</Badge>
                  <Badge variant="outline">{selectedCandidate.job?.title}</Badge>
                </div>
                <DialogTitle className="text-2xl mt-1">{selectedCandidate.full_name}</DialogTitle>
                <DialogDescription>
                  Inscrição enviada em {formatDatePtBR(selectedCandidate.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-muted/30 border border-border/70 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-primary shrink-0" />
                    <span className="font-medium truncate">{selectedCandidate.email}</span>
                  </div>
                  {selectedCandidate.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-primary shrink-0" />
                      <span>{selectedCandidate.phone}</span>
                    </div>
                  )}
                </div>

                {selectedCandidate.cover_letter && (
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                      Resumo Profissional / Apresentação do Candidato
                    </Label>
                    <div className="rounded-xl border border-border/70 bg-card p-4 text-xs sm:text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {selectedCandidate.cover_letter}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Currículo Anexado
                  </Label>
                  <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-primary" />
                      <span className="font-semibold truncate max-w-[280px]">
                        {selectedCandidate.resume_path ?? "curriculo_candidato.pdf"}
                      </span>
                    </div>
                    <Badge variant="secondary">Anexo PDF</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Etapa Atual no Funil
                  </Label>
                  <Select
                    value={selectedCandidate.status}
                    onValueChange={(val) =>
                      handleUpdateCandidateStatus(selectedCandidate.id, val as ApplicationStatus)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="received">1. Inscrição Recebida</SelectItem>
                      <SelectItem value="screening">2. Em Triagem (Análise de Perfil)</SelectItem>
                      <SelectItem value="interview">3. Em Entrevista (RH / Gestão)</SelectItem>
                      <SelectItem value="offer">4. Proposta Enviada (Aprovado)</SelectItem>
                      <SelectItem value="rejected">5. Não Selecionado (Encerrado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Avaliação do Recrutador
                  </Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCandidateRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`size-6 ${
                            star <= (candidateRating || 0)
                              ? "text-amber-500 fill-amber-500"
                              : "text-muted-foreground/40"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">
                      {candidateRating} de 5 estrelas
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="rh-notes"
                    className="text-xs uppercase tracking-wider text-muted-foreground font-bold"
                  >
                    Anotações Internas do RH (Privado)
                  </Label>
                  <Textarea
                    id="rh-notes"
                    rows={3}
                    placeholder="Ex: Candidata com excelente fit cultural. Pontos fortes em React. Agendar entrevista com o tech lead."
                    value={candidateNotes}
                    onChange={(e) => setCandidateNotes(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setSelectedCandidate(null)}>
                  Fechar
                </Button>
                <Button onClick={handleSaveCandidateFeedback}>Salvar Feedback & Notas</Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>

        {/* Modal de Criação / Edição de Vaga com Presets do Interior */}
        <Dialog open={isJobModalOpen} onOpenChange={setIsJobModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingJob ? "Editar Oportunidade Regional" : "Publicar Nova Vaga no Interior"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados com linguagem clara para divulgar a oportunidade nos polos
                regionais.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveJob} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="job-title">Título do Cargo *</Label>
                <Input
                  id="job-title"
                  placeholder="Ex: Pessoa Desenvolvedora Front-end Pleno"
                  value={jobFormData.title}
                  onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departamento *</Label>
                  <Select
                    value={jobFormData.department}
                    onValueChange={(val) => setJobFormData({ ...jobFormData, department: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job-location">Polo Regional / Localização *</Label>
                  <Input
                    id="job-location"
                    placeholder="Ex: Polo Ribeirão Preto, Remoto..."
                    value={jobFormData.location}
                    onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-muted-foreground mr-1">Sugestões:</span>
                    {REGIONAL_LOCATION_PRESETS.slice(0, 3).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setJobFormData({ ...jobFormData, location: preset })}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {preset.split(" - ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Regime de Contratação</Label>
                  <Select
                    value={jobFormData.employment_type}
                    onValueChange={(val) =>
                      setJobFormData({ ...jobFormData, employment_type: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Senioridade</Label>
                  <Select
                    value={jobFormData.seniority}
                    onValueChange={(val) => setJobFormData({ ...jobFormData, seniority: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SENIORITIES.map((sen) => (
                        <SelectItem key={sen} value={sen}>
                          {sen}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job-salary">Faixa Salarial</Label>
                  <Input
                    id="job-salary"
                    placeholder="Ex: R$ 6.000 - R$ 8.000"
                    value={jobFormData.salary_range}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, salary_range: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-desc">Descrição e Atribuições *</Label>
                <Textarea
                  id="job-desc"
                  rows={4}
                  placeholder="Descreva de forma didática as responsabilidades e o impacto da função..."
                  value={jobFormData.description}
                  onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-req">Requisitos e Qualificações</Label>
                <Textarea
                  id="job-req"
                  rows={3}
                  placeholder="O que é essencial e o que pode ser aprendido no polo..."
                  value={jobFormData.requirements}
                  onChange={(e) => setJobFormData({ ...jobFormData, requirements: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Status da Vaga</Label>
                <Select
                  value={jobFormData.status}
                  onValueChange={(val: "open" | "closed") =>
                    setJobFormData({ ...jobFormData, status: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberta (Recebendo candidaturas)</SelectItem>
                    <SelectItem value="closed">Encerrada (Pausada)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsJobModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingJob ? "Salvar Alterações" : "Publicar Vaga Regional"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Confirmação para Excluir Vaga */}
        <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deseja realmente excluir esta vaga?</AlertDialogTitle>
              <AlertDialogDescription>
                A vaga "{jobToDelete?.title}" será excluída permanentemente da plataforma.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteJob}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir Vaga
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
