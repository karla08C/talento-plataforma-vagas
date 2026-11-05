import React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck2,
  Sparkles,
  FileText,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Info,
  Calendar,
  Video,
  MapPin,
} from "lucide-react";
import { getStatusConfig } from "./CandidateStatusBadge";

export interface PipelineStage {
  id: string;
  stepNumber: number;
  titlePt: string;
  titleEn: string;
  description: string;
  candidateTips: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    stepNumber: 1,
    id: "received",
    titlePt: "Inscrição",
    titleEn: "Applied",
    description: "Currículo recebido e dados cadastrados no polo regional",
    candidateTips: "Seus dados já estão no sistema. Nenhuma ação necessária no momento.",
  },
  {
    stepNumber: 2,
    id: "screening",
    titlePt: "Em Análise",
    titleEn: "In Review",
    description: "Triagem didática de requisitos e alinhamento de perfil",
    candidateTips:
      "A equipe de RH analisa seu resumo e afinidade com o polo. Tempo médio: 3 a 5 dias.",
  },
  {
    stepNumber: 3,
    id: "interview",
    titlePt: "Entrevista",
    titleEn: "Interview Scheduled",
    description: "Conversa com RH ou liderança regional (online ou presencial)",
    candidateTips: "Fique atento(a) ao e-mail e WhatsApp para instruções de acesso e horário.",
  },
  {
    stepNumber: 4,
    id: "offer",
    titlePt: "Decisão / Proposta",
    titleEn: "Offer / Final",
    description: "Retorno final e envio de proposta de trabalho",
    candidateTips:
      "Apresentação da proposta salarial, pacote de benefícios e orientações de admissão.",
  },
];

interface CandidateProgressStepperProps {
  status: string;
  updatedAt?: string;
  notes?: string;
  jobLocation?: string;
  className?: string;
}

export function CandidateProgressStepper({
  status,
  updatedAt,
  notes,
  jobLocation,
  className = "",
}: CandidateProgressStepperProps) {
  const [showStageDetails, setShowStageDetails] = React.useState(false);
  const config = getStatusConfig(status);
  const isRejected = status === "rejected";
  const currentStep = config.stepIndex;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header do Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
        <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
          <HelpCircle className="size-3.5 text-primary" />
          Acompanhamento da Candidatura • Pipeline de Seleção
        </span>
        <span className="font-medium text-muted-foreground text-[11px]">
          {isRejected
            ? "Status atual: Processo Encerrado"
            : `Etapa ${currentStep} de 4 (${config.labelPt} • ${config.labelEn})`}
        </span>
      </div>

      {/* Grid de Etapas com Barra Visual */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PIPELINE_STAGES.map((stage) => {
          const stepNumber = stage.stepNumber;
          const isDone = !isRejected && currentStep > stepNumber;
          const isCurrent = !isRejected && currentStep === stepNumber;
          const isHaltedHere = isRejected && stepNumber === currentStep;

          let cardBorder = "border-border/60 bg-muted/20 text-muted-foreground";
          let circleBg = "bg-muted text-muted-foreground";

          if (isDone) {
            cardBorder = "border-emerald-500/30 bg-emerald-500/5 text-foreground";
            circleBg = "bg-emerald-600 text-white shadow-2xs";
          } else if (isCurrent) {
            if (config.key === "interview" || config.key === "interview_scheduled") {
              cardBorder =
                "border-purple-500 bg-purple-500/10 text-foreground ring-1 ring-purple-500/40 shadow-xs";
              circleBg = "bg-purple-600 text-white shadow-2xs";
            } else if (config.key === "screening" || config.key === "in_review") {
              cardBorder =
                "border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500/40 shadow-xs";
              circleBg = "bg-amber-600 text-white shadow-2xs";
            } else if (config.key === "offer") {
              cardBorder =
                "border-emerald-500 bg-emerald-500/15 text-foreground ring-1 ring-emerald-500/40 shadow-xs";
              circleBg = "bg-emerald-600 text-white shadow-2xs";
            } else {
              cardBorder =
                "border-sky-500 bg-sky-500/10 text-foreground ring-1 ring-sky-500/40 shadow-xs";
              circleBg = "bg-sky-600 text-white shadow-2xs";
            }
          } else if (isHaltedHere) {
            cardBorder = "border-rose-500/30 bg-rose-500/5 text-muted-foreground";
            circleBg = "bg-rose-600 text-white";
          }

          return (
            <div
              key={stage.id}
              className={`rounded-xl border p-3 transition-all relative ${cardBorder}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-transform ${circleBg}`}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : isHaltedHere ? (
                    <XCircle className="size-3.5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs truncate">{stage.titlePt}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block truncate">
                    {stage.titleEn}
                  </span>
                </div>
              </div>

              <p className="mt-1.5 text-[11px] leading-tight text-muted-foreground line-clamp-2">
                {stage.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Caixa de Destaque Didático conforme o Status Atual */}
      <div
        className={`rounded-xl border p-4 text-xs space-y-2 transition-colors ${config.accentBorder} ${config.accentBg}`}
      >
        <div className="flex items-start gap-2.5">
          {status === "interview" || status === "interview_scheduled" ? (
            <CalendarCheck2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          ) : status === "screening" || status === "in_review" ? (
            <Clock className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          ) : status === "rejected" ? (
            <XCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          ) : status === "offer" ? (
            <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="size-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                {status === "interview" || status === "interview_scheduled"
                  ? "Status: Entrevista Agendada (Interview Scheduled)"
                  : status === "screening" || status === "in_review"
                    ? "Status: Em Análise (In Review)"
                    : status === "rejected"
                      ? "Status: Não Selecionado (Rejected)"
                      : status === "offer"
                        ? "Status: Proposta Disponível (Offer)"
                        : "Status: Inscrição Recebida (Applied)"}
              </span>

              {updatedAt && (
                <span className="text-[11px] text-muted-foreground">
                  Atualizado em {new Date(updatedAt).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>

            <p className="text-foreground/90 leading-relaxed">{config.longDesc}</p>

            {/* Mensagens específicas para cada status */}
            {status === "interview" && (
              <div className="mt-2.5 rounded-lg border border-purple-500/20 bg-background/80 p-2.5 space-y-1.5 text-xs text-foreground">
                <div className="flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-400">
                  <Video className="size-3.5" /> Orientações da Entrevista
                </div>
                <p className="text-muted-foreground">
                  Você receberá por e-mail e mensagem o link da sala de videoconferência ou o
                  endereço da unidade regional ({jobLocation || "Polo Regional"}).
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCircle2 className="size-3 text-emerald-600" /> Duração aprox.: 30-45 min
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCircle2 className="size-3 text-emerald-600" /> Formato didático e
                    acolhedor
                  </span>
                </div>
              </div>
            )}

            {status === "screening" && (
              <div className="mt-2 rounded-lg border border-amber-500/20 bg-background/80 p-2.5 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Dica didática:</strong> Não se preocupe se
                  demorar alguns dias; nossas avaliações são humanizadas e cada currículo é lido
                  individualmente pelo RH.
                </p>
              </div>
            )}

            {notes && (
              <div className="mt-2 pt-2 border-t border-border/60 text-xs">
                <span className="font-semibold text-foreground">Nota do RH: </span>
                <span className="text-muted-foreground italic">"{notes}"</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
