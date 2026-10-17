import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Building2, CheckCircle2, Clock } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSessionState } from "@/lib/auth";
import { CandidateApplicationForm } from "@/components/CandidateApplicationForm";
import type { CandidateApplicationFormValues } from "@/lib/candidate-schema";

export const Route = createFileRoute("/vagas/$jobId")({
  head: () => ({
    meta: [
      { title: "Detalhes da vaga | Talentos" },
      {
        name: "description",
        content: "Confira os detalhes da vaga, requisitos e envie sua candidatura com currículo.",
      },
      { property: "og:title", content: "Detalhes da vaga | Talentos" },
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const handleApplicationSubmit = async (
    values: CandidateApplicationFormValues,
    file?: File | null,
  ) => {
    let candidateId = user?.id;

    // If user is not yet logged in, auto-create/sign-up or ensure an account exists for their application
    if (!candidateId) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        options: {
          data: {
            full_name: values.name,
          },
        },
      });

      if (authError && !authData?.user) {
        throw new Error(
          `Não foi possível registrar o candidato com o e-mail informado: ${authError.message}. Se você já possui cadastro, faça login.`,
        );
      }

      candidateId = authData?.user?.id;
    }

    if (!candidateId) {
      throw new Error("Não foi possível identificar o ID do candidato.");
    }

    let resumePath: string | null = null;
    if (file && file.size > 0) {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const path = `${candidateId}/${jobId}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file);
      if (uploadError) {
        throw new Error(`Falha ao fazer upload do currículo: ${uploadError.message}`);
      }
      resumePath = path;
    }

    const { error: insertError } = await supabase.from("applications").insert({
      job_id: jobId,
      candidate_id: candidateId,
      full_name: values.name,
      email: values.email,
      phone: values.phone || null,
      cover_letter: values.professionalSummary,
      resume_path: resumePath,
    });

    if (insertError) {
      throw new Error(`Não foi possível salvar a candidatura: ${insertError.message}`);
    }

    void queryClient.invalidateQueries({ queryKey: ["application", jobId, candidateId] });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="size-4" /> Todas as vagas
          </Link>
        </Button>

        {isLoading && <Skeleton className="h-64 rounded-xl" />}

        {!isLoading && !job && (
          <p className="text-muted-foreground">Vaga não encontrada ou não está mais aberta.</p>
        )}

        {job && (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{job.department}</Badge>
              <Badge variant="outline">{job.employment_type}</Badge>
              <Badge variant="outline">{job.seniority}</Badge>
              {job.status === "closed" && <Badge variant="destructive">Encerrada</Badge>}
            </div>
            <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{job.title}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" /> {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="size-4" /> {job.salary_range ?? "Salário a combinar"}
              </span>
            </div>

            <section className="mt-8 space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Sobre a vaga</h2>
                <p className="mt-2 whitespace-pre-line text-muted-foreground">{job.description}</p>
              </div>
              {job.requirements && (
                <div>
                  <h2 className="text-xl font-semibold">Requisitos</h2>
                  <p className="mt-2 whitespace-pre-line text-muted-foreground">
                    {job.requirements}
                  </p>
                </div>
              )}
            </section>

            <Card className="mt-10 shadow-card" id="candidatar">
              <CardHeader>
                <CardTitle>Inscrever-se nesta vaga</CardTitle>
                <CardDescription>
                  Preencha o formulário com seus dados cadastrais, resumo profissional e anexe seu
                  currículo.
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
                              Enviada em {new Date(existing.created_at).toLocaleDateString("pt-BR")}
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
          </>
        )}
      </main>
    </div>
  );
}
