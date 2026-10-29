import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MapPin,
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  Share2,
  Gift,
  Award,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSessionState } from "@/lib/auth";
import { CandidateApplicationForm } from "@/components/CandidateApplicationForm";
import type { CandidateApplicationFormValues } from "@/lib/candidate-schema";
import { useCompanyLogo } from "@/lib/company-config";
import { CompanyLogoSlot } from "@/components/CompanyLogoSlot";
import { formatDatePtBR } from "@/lib/utils";

export const Route = createFileRoute("/vagas/$jobId")({
  head: () => ({
    meta: [
      { title: "Detalhes da vaga | Portal de Carreiras (Sólides)" },
      {
        name: "description",
        content: "Confira os detalhes da vaga, requisitos e envie sua candidatura com currículo.",
      },
      { property: "og:title", content: "Detalhes da vaga | Portal de Carreiras" },
      { property: "og:description", content: "Requisitos, benefícios e inscrição para a vaga." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const { user, loading: sessionLoading } = useSessionState();
  const { logoUrl } = useCompanyLogo();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["application", jobId, user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, full_name, email, phone, cover_letter, created_at")
        .eq("job_id", jobId)
        .eq("candidate_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        toast.success("Link da vaga copiado com sucesso!");
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      toast.info("Compartilhe o link da barra de navegação com seus contatos.");
    }
  };

  const scrollToApply = () => {
    const el = document.getElementById("candidatar");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleApplicationSubmit = async (
    values: CandidateApplicationFormValues,
    file?: File | null,
  ) => {
    let candidateId = user?.id;

    if (!candidateId) {
      const randomPassword = `Talentos@${Math.random().toString(36).slice(-8)}A1!`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: randomPassword,
        options: {
          data: {
            full_name: values.name,
            phone: values.phone,
          },
        },
      });

      if (signUpError) {
        if (
          signUpError.message.includes("User already registered") ||
          signUpError.message.includes("already registered")
        ) {
          navigate({
            to: "/auth",
            search: { redirect: `/vagas/${jobId}` },
          });
          throw new Error("Você já possui cadastro no portal. Faça login para continuar.");
        }
        throw new Error(`Erro ao registrar candidato: ${signUpError.message}`);
      }

      candidateId = signUpData?.user?.id;
    }

    if (!candidateId) {
      throw new Error("Não foi possível identificar a conta do candidato.");
    }

    let resumePath: string | null = null;
    if (file) {
      const fileExt = file.name.split(".").pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${candidateId}/${Date.now()}_${sanitizedName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Falha no upload do currículo: ${uploadError.message}`);
      }

      resumePath = uploadData?.path ?? filePath;
    }

    const { error: insertError } = await supabase.from("applications").insert({
      job_id: jobId,
      candidate_id: candidateId,
      full_name: values.name,
      email: values.email,
      phone: values.phone,
      cover_letter: values.professionalSummary,
      resume_path: resumePath,
      status: "received",
    });

    if (insertError) {
      throw new Error(`Não foi possível salvar a candidatura: ${insertError.message}`);
    }

    void queryClient.invalidateQueries({ queryKey: ["application", jobId, candidateId] });
  };

  // Helper for modality
  const getJobModality = (loc: string) => {
    const l = (loc || "").toLowerCase();
    if (l.includes("remoto") || l.includes("home office")) return "remoto";
    if (l.includes("híbrido") || l.includes("hibrido")) return "hibrido";
    return "presencial";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb estilo Sólides Vagas */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Início
          </Link>
          <ChevronRight className="size-3" />
          <Link to="/" className="hover:text-foreground transition-colors">
            Vagas abertas
          </Link>
          {job && (
            <>
              <ChevronRight className="size-3" />
              <span className="truncate max-w-[200px] text-foreground font-medium">
                {job.title}
              </span>
            </>
          )}
        </nav>

        {isLoading && <Skeleton className="h-64 rounded-2xl" />}

        {!isLoading && !job && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <h2 className="text-xl font-bold">Vaga não encontrada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta oportunidade pode ter sido preenchida ou desativada pelo time de RH.
            </p>
            <Button className="mt-6" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 size-4" /> Ver outras vagas abertas
              </Link>
            </Button>
          </div>
        )}

        {job && (
          <>
            {/* Header da Vaga estilo Sólides */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-card">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-4">
                  {/* Badges de Modalidade e Categoria */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {job.department}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {job.employment_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {job.seniority}
                    </Badge>

                    {getJobModality(job.location) === "remoto" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <Globe className="size-3" />
                        Remoto / Home Office
                      </span>
                    )}
                    {getJobModality(job.location) === "hibrido" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                        <Building2 className="size-3" />
                        Híbrido
                      </span>
                    )}

                    {job.status === "closed" && <Badge variant="destructive">Encerrada</Badge>}
                  </div>

                  {/* Título Principal */}
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                    {job.title}
                  </h1>

                  {/* Informações Rápidas */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <MapPin className="size-4 text-primary" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Building2 className="size-4 text-primary" />{" "}
                      {job.salary_range ?? "Salário a combinar"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-4 text-muted-foreground" />
                      Publicada em {formatDatePtBR(job.created_at)}
                    </span>
                  </div>
                </div>

                {/* Logo da Empresa e Ações Rápidas */}
                <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                  <CompanyLogoSlot variant="job-header" showConfigureButton={true} />

                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="mr-1.5 size-3.5" />
                      {copiedLink ? "Copiado!" : "Compartilhar"}
                    </Button>
                    <Button size="sm" onClick={scrollToApply} className="font-semibold shadow-xs">
                      Candidatar-se
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Corpo com seções estruturadas no padrão Sólides Vagas */}
            <div className="mt-8 space-y-8">
              {/* Seção: Sobre a Vaga */}
              <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
                <div className="flex items-center gap-2 text-primary font-semibold text-base">
                  <Briefcase className="size-5" />
                  <h2>Sobre a vaga</h2>
                </div>
                <div className="mt-3 text-sm sm:text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                  {job.description}
                </div>
              </section>

              {/* Seção: Requisitos e Qualificações */}
              {job.requirements && (
                <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
                  <div className="flex items-center gap-2 text-primary font-semibold text-base">
                    <ShieldCheck className="size-5" />
                    <h2>Requisitos e qualificações</h2>
                  </div>
                  <div className="mt-3 text-sm sm:text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                    {job.requirements}
                  </div>
                </section>
              )}

              {/* Seção: Benefícios Oferecidos (Padrão Sólides) */}
              <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
                <div className="flex items-center gap-2 text-primary font-semibold text-base">
                  <Gift className="size-5" />
                  <h2>O que oferecemos (Benefícios)</h2>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Vale Refeição / Alimentação flexível</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Assistência médica e odontológica</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Auxílio Home Office & mobilidade</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Day off no mês do seu aniversário</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Parcerias de bem-estar e saúde mental</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Programa de desenvolvimento contínuo</span>
                  </div>
                </div>
              </section>

              {/* Etapas do Processo Seletivo estilo Sólides */}
              <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
                <div className="flex items-center gap-2 text-primary font-semibold text-base">
                  <Award className="size-5" />
                  <h2>Etapas do Processo Seletivo</h2>
                </div>
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Inscrição</p>
                      <p className="text-muted-foreground">Envio do currículo</p>
                    </div>
                  </div>
                  <ChevronRight className="hidden sm:block size-4 text-muted-foreground" />

                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Triagem</p>
                      <p className="text-muted-foreground">Análise de perfil</p>
                    </div>
                  </div>
                  <ChevronRight className="hidden sm:block size-4 text-muted-foreground" />

                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Entrevistas</p>
                      <p className="text-muted-foreground">RH e Gestão</p>
                    </div>
                  </div>
                  <ChevronRight className="hidden sm:block size-4 text-muted-foreground" />

                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 font-bold">
                      4
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Contratação</p>
                      <p className="text-muted-foreground">Boas-vindas!</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Card de Inscrição da Candidatura */}
              <Card className="mt-10 shadow-card border-primary/30" id="candidatar">
                <CardHeader>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    <Sparkles className="size-3.5" />
                    Inscrição Online
                  </div>
                  <CardTitle className="text-xl sm:text-2xl">
                    Candidatar-se a esta oportunidade
                  </CardTitle>
                  <CardDescription>
                    Preencha seus dados, conte sobre sua trajetória no resumo profissional e anexe
                    seu currículo.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {sessionLoading && <Skeleton className="h-24 rounded-lg" />}

                  {!sessionLoading && existing && (
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-6 text-card-foreground">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-base">Candidatura já enviada!</h3>
                            <Badge variant="secondary" className="capitalize">
                              Status: {existing.status ?? "Recebida"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Sua candidatura para esta vaga foi registrada com sucesso na base de
                            talentos.
                            {existing.created_at && (
                              <span className="block mt-1 text-xs">
                                Enviada em {formatDatePtBR(existing.created_at)}
                              </span>
                            )}
                          </p>
                          <div className="pt-3">
                            <Button variant="outline" size="sm" asChild>
                              <Link to="/">Ver outras vagas abertas</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!sessionLoading && !existing && (
                    <>
                      {!user && (
                        <div className="mb-6 flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">
                            Já possui conta de candidato? Faça login para carregar seus dados
                            automaticamente.
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="shrink-0 self-start sm:self-auto"
                          >
                            <Link to="/auth" search={{ redirect: `/vagas/${jobId}` }}>
                              Entrar
                            </Link>
                          </Button>
                        </div>
                      )}
                      <CandidateApplicationForm
                        jobId={jobId}
                        defaultValues={{
                          name: (user?.user_metadata?.["full_name"] as string) ?? "",
                          email: user?.email ?? "",
                        }}
                        onCustomSubmit={handleApplicationSubmit}
                        requireResume={true}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
