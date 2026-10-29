import { useState, useRef } from "react";
import {
  Building2,
  ImagePlus,
  Upload,
  Trash2,
  Link as LinkIcon,
  Check,
  Sparkles,
  Settings,
  Pencil,
  Factory,
  CheckCircle2,
} from "lucide-react";
import { useCompanyLogo, REGIONAL_COMPANY_PRESETS, type CompanyPreset } from "@/lib/company-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CompanyLogoSlotProps {
  variant?: "header" | "banner" | "slot" | "job-header" | "rh-preview";
  className?: string;
  showConfigureButton?: boolean;
}

export function CompanyLogoSlot({
  variant = "header",
  className = "",
  showConfigureButton = true,
}: CompanyLogoSlotProps) {
  const {
    logoUrl,
    companyName,
    companySubtitle,
    setLogoUrl,
    setCompanyName,
    setCompanySubtitle,
    applyPreset,
    resetLogo,
    hasCustomLogo,
  } = useCompanyLogo();

  const [open, setOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [inputName, setInputName] = useState("");
  const [inputSubtitle, setInputSubtitle] = useState("");
  const [activeTab, setActiveTab] = useState<string>("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenDialog = () => {
    setInputUrl(logoUrl || "");
    setInputName(companyName);
    setInputSubtitle(companySubtitle);
    setOpen(true);
  };

  const handleSaveAll = () => {
    if (inputName.trim()) {
      setCompanyName(inputName.trim());
    }
    if (inputSubtitle.trim()) {
      setCompanySubtitle(inputSubtitle.trim());
    }
    if (inputUrl.trim()) {
      setLogoUrl(inputUrl.trim());
    }
    toast.success("Identidade da empresa salva com sucesso!");
    setOpen(false);
  };

  const handleSelectPreset = (preset: CompanyPreset) => {
    applyPreset(preset);
    setInputName(preset.name);
    setInputSubtitle(preset.subtitle);
    setInputUrl(preset.svgDataUri);
    toast.success(`Modelo "${preset.name}" aplicado!`);
    setOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido (PNG, SVG, JPG, WebP).");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 3 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
        if (inputName.trim()) setCompanyName(inputName.trim());
        toast.success("Logo carregada com sucesso!");
        setOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    resetLogo();
    setInputUrl("");
    setInputName("Talentos do Interior");
    setInputSubtitle("Desenvolvimento Regional & Oportunidades");
    toast.info("Logo removida. O espaço reservado voltou ao padrão.");
    setOpen(false);
  };

  const renderConfigModal = () => (
    <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-4" />
          </div>
          <div>
            <DialogTitle>Personalizar Logo da Empresa</DialogTitle>
            <DialogDescription className="text-xs">
              Defina a marca oficial e o nome da sua empresa para exibir no cabeçalho e em todas as
              vagas.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Campos de Nome e Ramo */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="company-name-input" className="text-xs font-semibold">
              Nome da Empresa / Organização
            </Label>
            <Input
              id="company-name-input"
              placeholder="Ex: AgroTech Regional, Cooperativa..."
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="text-sm h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company-sub-input" className="text-xs font-semibold">
              Slogan ou Ramo de Atuação
            </Label>
            <Input
              id="company-sub-input"
              placeholder="Ex: Agronegócio, Indústria, Tecnologia..."
              value={inputSubtitle}
              onChange={(e) => setInputSubtitle(e.target.value)}
              className="text-sm h-9"
            />
          </div>
        </div>

        {/* Pré-visualização atual da logo */}
        <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-primary" />
              Pré-visualização atual:
            </span>
            {hasCustomLogo && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                Logo ativa
              </span>
            )}
          </div>
          <div className="flex h-16 items-center justify-center rounded-lg bg-card border border-border/50 p-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Pré-visualização da logo"
                className="max-h-12 max-w-full object-contain"
              />
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Building2 className="size-4 text-primary" />
                <span className="font-semibold text-foreground">{inputName || companyName}</span>
                <span className="text-muted-foreground text-[11px]">(Sem logo personalizada)</span>
              </div>
            )}
          </div>
        </div>

        {/* Abas para escolher método: Upload, URL ou Modelos Rápidos */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9 text-xs">
            <TabsTrigger value="upload" className="text-xs">
              <Upload className="mr-1.5 size-3.5" /> Fazer Upload
            </TabsTrigger>
            <TabsTrigger value="presets" className="text-xs">
              <Sparkles className="mr-1.5 size-3.5 text-amber-500" /> Modelos Prontos
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs">
              <LinkIcon className="mr-1.5 size-3.5" /> Link da Web
            </TabsTrigger>
          </TabsList>

          {/* Aba 1: Upload */}
          <TabsContent value="upload" className="space-y-3 pt-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer rounded-xl border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 p-6 text-center transition-all"
            >
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                <Upload className="size-5" />
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">
                Clique para selecionar a imagem da logo
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                PNG, SVG, JPG ou WebP (até 3 MB). Formato horizontal é recomendado.
              </p>
            </div>
          </TabsContent>

          {/* Aba 2: Modelos Prontos do Interior */}
          <TabsContent value="presets" className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground">
              Selecione um exemplo didático para aplicar instantaneamente:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REGIONAL_COMPANY_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-card p-2 text-left hover:border-primary hover:bg-primary/5 transition-all text-xs"
                >
                  <img
                    src={preset.svgDataUri}
                    alt={preset.name}
                    className="h-8 w-24 object-contain rounded bg-muted/30 shrink-0"
                  />
                  <div className="truncate">
                    <p className="font-semibold text-foreground truncate">{preset.name}</p>
                    <span className="text-[10px] text-muted-foreground">{preset.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Aba 3: URL */}
          <TabsContent value="url" className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="logo-url-input" className="text-xs">
                Endereço URL da imagem
              </Label>
              <div className="relative">
                <LinkIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="logo-url-input"
                  placeholder="https://suaempresa.com.br/logo.png"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="pl-8 text-sm h-9"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dica Didática para desenvolvedores do interior */}
        <div className="rounded-lg bg-muted/60 p-2.5 text-[11px] text-muted-foreground flex items-start gap-2">
          <Factory className="size-4 text-primary shrink-0 mt-0.5" />
          <div>
            <strong>Desenvolvimento Regional:</strong> Você também pode definir a logo oficial fixa
            no código abrindo{" "}
            <code className="text-foreground font-mono">src/lib/company-config.ts</code> e alterando
            a variável{" "}
            <code className="text-foreground font-mono">DEFAULT_COMPANY_CONFIG.logoUrl</code>.
          </div>
        </div>
      </div>

      <DialogFooter className="flex sm:justify-between gap-2">
        {hasCustomLogo ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 text-xs"
            onClick={handleRemove}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Remover logo
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-9 text-xs"
          >
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={handleSaveAll} className="h-9 text-xs gap-1.5">
            <Check className="size-3.5" />
            Salvar
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );

  // Variant: Header (SiteHeader.tsx)
  if (variant === "header") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {logoUrl ? (
          <div className="flex items-center gap-2">
            <img
              src={logoUrl}
              alt={companyName}
              className="h-8 max-h-8 max-w-[140px] sm:max-w-[180px] object-contain rounded"
            />
            {showConfigureButton && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                    title="Configurar logo e nome da empresa"
                    onClick={handleOpenDialog}
                  >
                    <Pencil className="size-3 text-muted-foreground" />
                    <span className="sr-only">Editar logo da empresa</span>
                  </Button>
                </DialogTrigger>
                {renderConfigModal()}
              </Dialog>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  onClick={handleOpenDialog}
                  className="group flex items-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-2.5 py-1 text-xs text-primary transition-all hover:bg-primary/10 hover:border-primary cursor-pointer text-left"
                  title="Clique para adicionar a logo da sua empresa"
                >
                  <Building2 className="size-3.5 text-primary shrink-0" />
                  <span className="font-semibold whitespace-nowrap">Colocar Logo</span>
                  <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors hidden sm:inline">
                    (Espaço reservado)
                  </span>
                </button>
              </DialogTrigger>
              {renderConfigModal()}
            </Dialog>
          </div>
        )}
      </div>
    );
  }

  // Variant: Job Header (for job detail header)
  if (variant === "job-header") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex size-12 sm:size-14 items-center justify-center rounded-xl border border-border bg-card p-1.5 shadow-xs shrink-0 overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="max-h-full max-w-full object-contain" />
          ) : (
            <Building2 className="size-6 text-primary" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm sm:text-base text-foreground truncate">
            {companyName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {companySubtitle || "Vagas Oficiais & Desenvolvimento Regional"}
          </p>
        </div>
      </div>
    );
  }

  // Variant: Slot (featured card for the index Hero)
  if (variant === "slot") {
    return (
      <div
        className={`rounded-2xl border border-border/80 bg-card/95 backdrop-blur p-4 sm:p-5 shadow-lift transition-all ${className}`}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Espaço da Empresa
              </span>
            </div>
            {showConfigureButton && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={handleOpenDialog}
                  >
                    <Pencil className="size-3" />
                    {hasCustomLogo ? "Alterar Logo" : "Adicionar Logo"}
                  </Button>
                </DialogTrigger>
                {renderConfigModal()}
              </Dialog>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-16 w-36 sm:w-44 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-2 transition-colors hover:border-primary/60">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="max-h-12 max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1 text-primary">
                    <Building2 className="size-3.5" />
                    <span className="text-[11px] font-bold">Sua Logo Aqui</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">Clique para adicionar</span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                {companyName}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{companySubtitle}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  ✓ Verificada
                </span>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  Portal Oficial
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Variant: Banner (wide card)
  return (
    <div
      className={`rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-card transition-all ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="group relative flex h-16 w-full sm:w-52 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-3 transition-colors hover:border-primary/60">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="max-h-12 max-w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1.5 text-primary">
                  <Building2 className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Logo da Empresa
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">Espaço reservado</span>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {companyName}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{companySubtitle}</p>
          </div>
        </div>

        {showConfigureButton && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="self-start sm:self-center shrink-0 gap-1.5"
                onClick={handleOpenDialog}
              >
                <Settings className="size-4" />
                {hasCustomLogo ? "Alterar Logo" : "Configurar Logo"}
              </Button>
            </DialogTrigger>
            {renderConfigModal()}
          </Dialog>
        )}
      </div>
    </div>
  );
}
