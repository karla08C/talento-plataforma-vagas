import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  MapPin,
  Building2,
  Clock,
  Search,
  Globe,
  Briefcase,
  SlidersHorizontal,
  X,
  ChevronRight,
  Sparkles,
  HeartHandshake,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CompanyLogoSlot } from "@/components/CompanyLogoSlot";
import { useCompanyLogo } from "@/lib/company-config";
import { formatDatePtBR } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal de Vagas | Trabalhe Conosco (Sólides)" },
      {
        name: "description",
        content:
          "Encontre vagas abertas CLT, PJ e Estágio nas modalidades Remoto, Híbrido ou Presencial. Faça sua candidatura online diretamente pelo portal de carreiras.",
      },
      { property: "og:title", content: "Portal de Vagas | Trabalhe Conosco" },
      {
        property: "og:description",
        content: "Encontre oportunidades profissionais e candidate-se com facilidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { companyName } = useCompanyLogo();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [selectedModality, setSelectedModality] = useState<string>("todos");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("todos");
  const [selectedContract, setSelectedContract] = useState<string>("todos");
  const [selectedSeniority, setSelectedSeniority] = useState<string>("todos");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", "open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const departments = useMemo(() => {
    const list = Array.from(new Set((jobs ?? []).map((j) => j.department).filter(Boolean)));
    return list.sort();
  }, [jobs]);

  const contractTypes = useMemo(() => {
    const list = Array.from(new Set((jobs ?? []).map((j) => j.employment_type).filter(Boolean)));
    return list.sort();
  }, [jobs]);

  const seniorities = useMemo(() => {
    const list = Array.from(new Set((jobs ?? []).map((j) => j.seniority).filter(Boolean)));
    return list.sort();
  }, [jobs]);

  // Modality helper
  const getJobModality = (locationStr: string): "remoto" | "hibrido" | "presencial" => {
    const loc = locationStr.toLowerCase();
    if (loc.includes("remoto") || loc.includes("home office")) return "remoto";
    if (loc.includes("híbrido") || loc.includes("hibrido")) return "hibrido";
    return "presencial";
  };

  const filteredJobs = useMemo(() => {
    return (jobs ?? []).filter((job) => {
      const jobModality = getJobModality(job.location);

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(term);
        const matchesDesc = job.description.toLowerCase().includes(term);
        const matchesDept = job.department.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc && !matchesDept) return false;
      }

      // Location term filter
      if (locationTerm.trim()) {
        const loc = locationTerm.toLowerCase();
        const matchesLocation = job.location.toLowerCase().includes(loc);
        if (!matchesLocation) return false;
      }

      // Modality filter
      if (selectedModality !== "todos") {
        if (jobModality !== selectedModality) return false;
      }

      // Department filter
      if (selectedDepartment !== "todos") {
        if (job.department !== selectedDepartment) return false;
      }

      // Contract filter
      if (selectedContract !== "todos") {
        if (job.employment_type !== selectedContract) return false;
      }

      // Seniority filter
      if (selectedSeniority !== "todos") {
        if (job.seniority !== selectedSeniority) return false;
      }

      return true;
    });
  }, [
    jobs,
    searchTerm,
    locationTerm,
    selectedModality,
    selectedDepartment,
    selectedContract,
    selectedSeniority,
  ]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(locationTerm) ||
    selectedModality !== "todos" ||
    selectedDepartment !== "todos" ||
    selectedContract !== "todos" ||
    selectedSeniority !== "todos";

  const clearAllFilters = () => {
    setSearchTerm("");
    setLocationTerm("");
    setSelectedModality("todos");
    setSelectedDepartment("todos");
    setSelectedContract("todos");
    setSelectedSeniority("todos");
  };

  const totalRemote = (jobs ?? []).filter((j) => getJobModality(j.location) === "remoto").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero de Carreiras estilo Sólides Vagas */}
      <section className="border-b border-border/70 bg-gradient-to-b from-primary/5 via-background to-background py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                {companyName &&
                companyName !== "Portal de Vagas" &&
                !companyName.includes("do Interior")
                  ? `Construa sua história na ${companyName}`
                  : "Construa sua história profissional"}
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                Explore nossas oportunidades abertas, inscreva-se em poucos cliques e acompanhe seu
                processo seletivo de forma 100% digital e transparente.
              </p>

              {/* Destaques rápidos */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Candidatura 100% gratuita
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="size-4 text-blue-600 dark:text-blue-400" />
                  Vagas Remotas e Presenciais
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-4 text-amber-500" />
                  Retorno garantido pelo portal
                </span>
              </div>
            </div>

            {/* Espaço dedicado para logo da empresa com botão para alterar */}
            <div className="shrink-0">
              <CompanyLogoSlot variant="slot" showConfigureButton={true} />
            </div>
          </div>

          {/* Motor de Busca Duplo estilo Sólides Vagas */}
          <div className="mt-8 rounded-2xl border border-border/80 bg-card p-3 shadow-lift sm:p-4">
            <div className="grid gap-3 md:grid-cols-[1.5fr_1.2fr_auto]">
              {/* Campo 1: Cargo ou Palavra-chave */}
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 size-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cargo, área ou tecnologia (ex: Frontend, RH, Vendas)..."
                  className="h-12 border-0 bg-muted/40 pl-10 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-primary"
                  aria-label="Buscar por cargo ou tecnologia"
                />
              </div>

              {/* Campo 2: Localidade ou Remoto */}
              <div className="relative flex items-center">
                <MapPin className="absolute left-3.5 size-4 text-muted-foreground" />
                <Input
                  value={locationTerm}
                  onChange={(e) => setLocationTerm(e.target.value)}
                  placeholder="Cidade, estado ou 'Remoto'..."
                  className="h-12 border-0 bg-muted/40 pl-10 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-primary"
                  aria-label="Buscar por cidade ou localização"
                />
              </div>

              {/* Botão de Busca */}
              <Button
                className="h-12 px-6 font-semibold shadow-xs"
                onClick={() => {
                  const element = document.getElementById("vagas-lista");
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Search className="mr-2 size-4" />
                Buscar Vagas
              </Button>
            </div>

            {/* Pílulas de Acesso Rápido por Modalidade */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
              <span className="text-xs font-medium text-muted-foreground">Modalidade:</span>
              <Button
                type="button"
                size="sm"
                variant={selectedModality === "todos" ? "default" : "outline"}
                className="h-7 text-xs rounded-full"
                onClick={() => setSelectedModality("todos")}
              >
                Todas ({jobs?.length ?? 0})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={selectedModality === "remoto" ? "default" : "outline"}
                className={`h-7 text-xs rounded-full ${
                  selectedModality === "remoto"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`}
                onClick={() => setSelectedModality("remoto")}
              >
                <Globe className="mr-1 size-3" />
                Home Office / Remoto ({totalRemote})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={selectedModality === "hibrido" ? "default" : "outline"}
                className="h-7 text-xs rounded-full"
                onClick={() => setSelectedModality("hibrido")}
              >
                <Building2 className="mr-1 size-3" />
                Híbrido
              </Button>
              <Button
                type="button"
                size="sm"
                variant={selectedModality === "presencial" ? "default" : "outline"}
                className="h-7 text-xs rounded-full"
                onClick={() => setSelectedModality("presencial")}
              >
                <MapPin className="mr-1 size-3" />
                Presencial
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Filtros Complementares e Listagem */}
      <main id="vagas-lista" className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <SlidersHorizontal className="size-3.5" />
              Filtros:
            </span>

            {/* Filtro por Departamento */}
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="h-9 w-[170px] text-xs">
                <SelectValue placeholder="Área / Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Áreas</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Tipo de Contrato */}
            <Select value={selectedContract} onValueChange={setSelectedContract}>
              <SelectTrigger className="h-9 w-[150px] text-xs">
                <SelectValue placeholder="Contrato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Regimes</SelectItem>
                {contractTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Senioridade */}
            <Select value={selectedSeniority} onValueChange={setSelectedSeniority}>
              <SelectTrigger className="h-9 w-[140px] text-xs">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Níveis</SelectItem>
                {seniorities.map((sen) => (
                  <SelectItem key={sen} value={sen}>
                    {sen}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-sm font-medium text-foreground">
              {isLoading ? (
                "Carregando vagas..."
              ) : (
                <>
                  <strong className="text-primary">{filteredJobs.length}</strong> vaga
                  {filteredJobs.length !== 1 ? "s" : ""} encontrada
                  {filteredJobs.length !== 1 ? "s" : ""}
                </>
              )}
            </span>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 size-3" />
                Limpar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Grid de Vagas estilo Sólides Vagas */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}

          {!isLoading &&
            filteredJobs.map((job) => {
              const modality = getJobModality(job.location);

              return (
                <Card
                  key={job.id}
                  className="group relative flex flex-col justify-between overflow-hidden border border-border/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-card"
                >
                  <CardHeader className="pb-3">
                    {/* Linha superior: Departamento e Modalidade */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="font-medium text-xs">
                          {job.department}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {job.employment_type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {job.seniority}
                        </Badge>
                      </div>

                      {/* Modalidade com cor personalizada estilo Sólides */}
                      {modality === "remoto" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <Globe className="size-3" />
                          Remoto
                        </span>
                      )}
                      {modality === "hibrido" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                          <Building2 className="size-3" />
                          Híbrido
                        </span>
                      )}
                      {modality === "presencial" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-muted bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          <MapPin className="size-3" />
                          Presencial
                        </span>
                      )}
                    </div>

                    {/* Título da Vaga */}
                    <Link
                      to="/vagas/$jobId"
                      params={{ jobId: job.id }}
                      className="group-hover:text-primary transition-colors block"
                    >
                      <CardTitle className="mt-3 text-xl font-bold tracking-tight">
                        {job.title}
                      </CardTitle>
                    </Link>

                    {/* Logo ou Nome da Empresa */}
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo da Empresa"
                          className="h-4 max-w-[80px] object-contain opacity-80"
                        />
                      ) : (
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Briefcase className="size-3 text-primary" />
                          Talentos
                        </span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {job.location}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Building2 className="size-3.5 text-muted-foreground" />
                        {job.salary_range ?? "Salário a combinar"}
                      </span>

                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="size-3" />
                        Publicada em {formatDatePtBR(job.created_at)}
                      </span>
                    </div>

                    <div className="mt-4 pt-1">
                      <Button
                        className="w-full justify-between group-hover:bg-primary font-medium"
                        asChild
                      >
                        <Link to="/vagas/$jobId" params={{ jobId: job.id }}>
                          <span>Candidatar-se à vaga</span>
                          <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {/* Estado vazio */}
        {!isLoading && filteredJobs.length === 0 && (
          <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <Search className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nenhuma vaga encontrada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Não encontramos vagas com os filtros selecionados. Tente buscar por outros termos ou
              limpe os filtros.
            </p>
            <Button variant="outline" size="sm" className="mt-6" onClick={clearAllFilters}>
              Limpar todos os filtros
            </Button>
          </div>
        )}

        {/* Seção "Por que trabalhar conosco?" no estilo Sólides Vagas */}
        <section className="mt-16 rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-8 sm:p-12 shadow-card">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              Nossa Cultura
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Por que fazer parte do nosso time?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Acreditamos no potencial das pessoas e proporcionamos um ambiente onde você pode
              aprender, crescer e fazer a diferença todos os dias.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-base">Crescimento Real</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Plano de desenvolvimento individual, feedbacks frequentes e oportunidades reais de
                evolução na carreira.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Award className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-base">Benefícios Flexíveis</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Auxílio refeição/alimentação, assistência médica e odontológica, suporte home office
                e parcerias de bem-estar.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-base">Cultura Colaborativa</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Um time acolhedor, onde todas as vozes têm espaço e a diversidade é celebrada em
                todas as decisões.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <HeartHandshake className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-base">Equilíbrio & Flexibilidade</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Modelos de trabalho flexíveis (Remoto e Híbrido), foco em resultados e respeito à
                sua vida pessoal.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ - Dúvidas Frequentes estilo Sólides */}
        <section className="mt-16 border-t border-border/70 pt-12">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <HelpCircle className="size-4" />
              <span>Dúvidas Frequentes</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Como funciona o nosso processo seletivo?
            </h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-border/70 bg-card p-4">
                <h4 className="font-semibold text-sm">A inscrição é gratuita?</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sim! Todas as candidaturas no portal são 100% gratuitas. Nunca cobramos taxas de
                  inscrição ou participação.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-4">
                <h4 className="font-semibold text-sm">Como recebo retorno da minha candidatura?</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Você pode acompanhar o status da sua inscrição diretamente na aba "Minhas
                  candidaturas" com seu e-mail cadastrado.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-4">
                <h4 className="font-semibold text-sm">Posso me candidatar a mais de uma vaga?</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sim, você pode se candidatar a todas as vagas que combinem com suas experiências e
                  objetivos profissionais.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé no estilo Sólides Vagas */}
      <footer className="border-t border-border/70 bg-muted/20 py-10">
        <div className="mx-auto max-w-6xl px-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Portal de Vagas e Recrutamento — Talentos
            </p>
            <p>Plataforma para gestão de processos seletivos e atração de talentos.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link to="/" className="hover:underline">
              Vagas em Aberto
            </Link>
            <Link to="/minhas-candidaturas" className="hover:underline">
              Área do Candidato
            </Link>
            <Link to="/auth" search={{ redirect: undefined }} className="hover:underline">
              Acesso RH
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
