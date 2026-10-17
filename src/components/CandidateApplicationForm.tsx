import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User, Mail, Phone, FileText, Upload, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  candidateApplicationSchema,
  type CandidateApplicationFormValues,
} from "@/lib/candidate-schema";

interface CandidateApplicationFormProps {
  jobId?: string;
  defaultValues?: Partial<CandidateApplicationFormValues>;
  onSubmitSuccess?: (values: CandidateApplicationFormValues, file?: File | null) => void;
  onCustomSubmit?: (values: CandidateApplicationFormValues, file?: File | null) => Promise<void>;
  requireResume?: boolean;
}

export function CandidateApplicationForm({
  jobId,
  defaultValues,
  onSubmitSuccess,
  onCustomSubmit,
  requireResume = true,
}: CandidateApplicationFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<CandidateApplicationFormValues>({
    resolver: zodResolver(candidateApplicationSchema),
    mode: "onTouched",
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      professionalSummary: defaultValues?.professionalSummary ?? "",
    },
  });

  const professionalSummaryValue = form.watch("professionalSummary") ?? "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validExtensions = [".pdf", ".doc", ".docx"];
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setFileError("Formato não suportado. Envie arquivos PDF, DOC ou DOCX.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError("O arquivo do currículo não pode ultrapassar 10 MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleFormSubmit = async (values: CandidateApplicationFormValues) => {
    if (requireResume && !selectedFile) {
      setFileError("Por favor, anexe seu currículo (PDF, DOC ou DOCX).");
      toast.error("Currículo obrigatório", {
        description: "Selecione um arquivo de currículo antes de enviar.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFileError(null);

      if (onCustomSubmit) {
        await onCustomSubmit(values, selectedFile);
      } else {
        // Default simulated action
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      setIsSubmitted(true);
      toast.success("Candidatura enviada com sucesso!", {
        description: "Seus dados e resumo profissional foram registrados.",
      });
      onSubmitSuccess?.(values, selectedFile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido ao enviar";
      toast.error("Erro ao enviar candidatura", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && !onCustomSubmit) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center text-card-foreground">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-7" />
        </div>
        <h3 className="mt-4 text-xl font-semibold">Candidatura Registrada!</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Obrigado por se candidatar. Seu perfil e resumo profissional já foram encaminhados para a
          equipe de recrutamento.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setIsSubmitted(false);
            form.reset();
            setSelectedFile(null);
          }}
        >
          Enviar outra candidatura
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
        noValidate
        id={`candidate-form-${jobId ?? "general"}`}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Nome completo */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 font-medium">
                  <User className="size-4 text-muted-foreground" />
                  Nome completo <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Maria Clara Silva" autoComplete="name" {...field} />
                </FormControl>
                <FormDescription>Informe seu nome e sobrenome completo.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* E-mail */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 font-medium">
                  <Mail className="size-4 text-muted-foreground" />
                  E-mail <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="exemplo@dominio.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Canal onde você receberá o retorno dos recrutadores.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Telefone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5 font-medium">
                <Phone className="size-4 text-muted-foreground" />
                Telefone / WhatsApp <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="(11) 98765-4321"
                  autoComplete="tel"
                  {...field}
                  onChange={(e) => {
                    // Simple auto-formatting helper for Brazilian phone numbers
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length > 11) v = v.slice(0, 11);
                    let formatted = v;
                    if (v.length > 2) {
                      formatted = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                    }
                    if (v.length > 7) {
                      formatted = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
                    }
                    field.onChange(v.length > 0 ? formatted : e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Número para contato rápido ou entrevistas via WhatsApp.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Resumo Profissional */}
        <FormField
          control={form.control}
          name="professionalSummary"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-1.5 font-medium">
                  <FileText className="size-4 text-muted-foreground" />
                  Resumo profissional <span className="text-destructive">*</span>
                </FormLabel>
                <span className="text-xs text-muted-foreground">
                  {professionalSummaryValue.length}/2000 caracteres
                </span>
              </div>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Destaque seus principais projetos, tecnologias dominadas, conquistas recentes e o que te motiva nesta oportunidade..."
                  className="resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Um resumo conciso ajuda o recrutador a compreender rapidamente seus diferenciais.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Upload de Currículo */}
        <div className="space-y-2">
          <label className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <Upload className="size-4 text-muted-foreground" />
              Currículo (PDF, DOC ou DOCX)
              {requireResume && <span className="text-destructive">*</span>}
            </span>
            {selectedFile && (
              <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB anexado
              </span>
            )}
          </label>
          <div className="relative">
            <Input
              id={`resume-upload-${jobId ?? "general"}`}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="cursor-pointer file:cursor-pointer file:text-foreground"
            />
          </div>
          {fileError ? (
            <p className="text-[0.8rem] font-medium text-destructive">{fileError}</p>
          ) : (
            <p className="text-[0.8rem] text-muted-foreground">
              Tamanho máximo: 10 MB. Formatos aceitos: .pdf, .doc, .docx.
            </p>
          )}
        </div>

        {/* Ação de envio */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-w-[200px]"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enviando candidatura...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Enviar candidatura
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
