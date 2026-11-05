import React from "react";
import { Clock, Search, CalendarCheck2, XCircle, Sparkles, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ApplicationStatusKey =
  | "received"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "in_review"
  | "interview_scheduled"
  | "applied";

export interface StatusConfig {
  key: string;
  labelPt: string;
  labelEn: string;
  shortDesc: string;
  longDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  stepIndex: number;
  badgeClasses: string;
  dotColor: string;
  accentBorder: string;
  accentBg: string;
}

export const STATUS_CONFIG_MAP: Record<string, StatusConfig> = {
  received: {
    key: "received",
    labelPt: "Inscrição Recebida",
    labelEn: "Application Received",
    shortDesc: "Currículo recebido e registrado no polo regional",
    longDesc:
      "Sua candidatura foi registrada no sistema com sucesso. O setor de recrutamento regional foi notificado e logo iniciará a primeira triagem do seu perfil.",
    icon: FileCheck,
    stepIndex: 1,
    badgeClasses:
      "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/30 font-medium hover:bg-sky-500/15",
    dotColor: "bg-sky-500",
    accentBorder: "border-sky-500/30",
    accentBg: "bg-sky-500/5",
  },
  applied: {
    key: "applied",
    labelPt: "Inscrição Recebida",
    labelEn: "Application Received",
    shortDesc: "Currículo recebido e registrado no polo regional",
    longDesc:
      "Sua candidatura foi registrada com sucesso e aguarda análise da equipe de recrutamento.",
    icon: FileCheck,
    stepIndex: 1,
    badgeClasses:
      "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/30 font-medium hover:bg-sky-500/15",
    dotColor: "bg-sky-500",
    accentBorder: "border-sky-500/30",
    accentBg: "bg-sky-500/5",
  },
  screening: {
    key: "screening",
    labelPt: "Em Análise",
    labelEn: "In Review",
    shortDesc: "Currículo em triagem e validação didática de requisitos",
    longDesc:
      "O time de RH e o gestor da vaga estão revisando suas informações, experiências e localização. Tempo médio de resposta: 3 a 5 dias úteis.",
    icon: Search,
    stepIndex: 2,
    badgeClasses:
      "bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/30 font-medium hover:bg-amber-500/20",
    dotColor: "bg-amber-500 animate-pulse",
    accentBorder: "border-amber-500/30",
    accentBg: "bg-amber-500/5",
  },
  in_review: {
    key: "in_review",
    labelPt: "Em Análise",
    labelEn: "In Review",
    shortDesc: "Currículo em triagem e validação didática de requisitos",
    longDesc:
      "O time de RH e o gestor da vaga estão revisando suas informações, experiências e localização. Tempo médio de resposta: 3 a 5 dias úteis.",
    icon: Search,
    stepIndex: 2,
    badgeClasses:
      "bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/30 font-medium hover:bg-amber-500/20",
    dotColor: "bg-amber-500 animate-pulse",
    accentBorder: "border-amber-500/30",
    accentBg: "bg-amber-500/5",
  },
  interview: {
    key: "interview",
    labelPt: "Entrevista Agendada",
    labelEn: "Interview Scheduled",
    shortDesc: "Conversa com RH ou liderança do polo regional",
    longDesc:
      "Parabéns! Seu perfil se destacou e você foi convidado(a) para a etapa de entrevista. O RH entrará em contato com o horário, link de videoconferência ou endereço do polo.",
    icon: CalendarCheck2,
    stepIndex: 3,
    badgeClasses:
      "bg-purple-500/15 text-purple-900 dark:text-purple-300 border-purple-500/30 font-medium hover:bg-purple-500/20 ring-1 ring-purple-500/20",
    dotColor: "bg-purple-500",
    accentBorder: "border-purple-500/30",
    accentBg: "bg-purple-500/5",
  },
  interview_scheduled: {
    key: "interview_scheduled",
    labelPt: "Entrevista Agendada",
    labelEn: "Interview Scheduled",
    shortDesc: "Conversa com RH ou liderança do polo regional",
    longDesc:
      "Parabéns! Seu perfil se destacou e você foi convidado(a) para a etapa de entrevista.",
    icon: CalendarCheck2,
    stepIndex: 3,
    badgeClasses:
      "bg-purple-500/15 text-purple-900 dark:text-purple-300 border-purple-500/30 font-medium hover:bg-purple-500/20 ring-1 ring-purple-500/20",
    dotColor: "bg-purple-500",
    accentBorder: "border-purple-500/30",
    accentBg: "bg-purple-500/5",
  },
  offer: {
    key: "offer",
    labelPt: "Proposta Enviada",
    labelEn: "Offer / Aprovado",
    shortDesc: "Candidato aprovado e proposta de trabalho emitida",
    longDesc:
      "Vitória importante! Você avançou em todas as etapas e foi aprovado(a). A proposta salarial e o pacote de benefícios estão disponíveis para sua confirmação.",
    icon: Sparkles,
    stepIndex: 4,
    badgeClasses:
      "bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border-emerald-500/30 font-medium hover:bg-emerald-500/20 ring-1 ring-emerald-500/20",
    dotColor: "bg-emerald-500",
    accentBorder: "border-emerald-500/30",
    accentBg: "bg-emerald-500/5",
  },
  rejected: {
    key: "rejected",
    labelPt: "Não Selecionado",
    labelEn: "Rejected",
    shortDesc: "Processo concluído para esta posição específica",
    longDesc:
      "Agradecemos muito sua disponibilidade e dedicação nesta oportunidade. Seu currículo permanece ativo em nosso banco de dados regional para futuros processos.",
    icon: XCircle,
    stepIndex: 2,
    badgeClasses:
      "bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-500/20 font-medium hover:bg-rose-500/15",
    dotColor: "bg-rose-500",
    accentBorder: "border-rose-500/30",
    accentBg: "bg-rose-500/5",
  },
};

export function getStatusConfig(rawStatus?: string): StatusConfig {
  const normalized = (rawStatus || "received").toLowerCase().trim();
  return STATUS_CONFIG_MAP[normalized] || STATUS_CONFIG_MAP.received;
}

interface CandidateStatusBadgeProps {
  status: string;
  size?: "sm" | "default" | "lg";
  showEnglishTag?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function CandidateStatusBadge({
  status,
  size = "default",
  showEnglishTag = true,
  showIcon = true,
  className = "",
}: CandidateStatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  if (size === "sm") {
    return (
      <Badge
        variant="secondary"
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold border ${config.badgeClasses} ${className}`}
      >
        {showIcon && <Icon className="size-3 shrink-0" />}
        <span>{config.labelPt}</span>
        {showEnglishTag && (
          <span className="text-[10px] opacity-75 font-normal">({config.labelEn})</span>
        )}
      </Badge>
    );
  }

  if (size === "lg") {
    return (
      <div
        className={`inline-flex items-center gap-2.5 rounded-xl border px-3.5 py-1.5 shadow-2xs ${config.badgeClasses} ${className}`}
      >
        <span className="relative flex size-2.5 items-center justify-center">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotColor}`}
          />
          <span className={`relative inline-flex size-2 rounded-full ${config.dotColor}`} />
        </span>
        {showIcon && <Icon className="size-4 shrink-0" />}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
          <span className="font-bold text-sm tracking-tight">{config.labelPt}</span>
          {showEnglishTag && (
            <span className="text-xs font-medium opacity-80">• {config.labelEn}</span>
          )}
        </div>
      </div>
    );
  }

  // Default size
  return (
    <Badge
      variant="secondary"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border ${config.badgeClasses} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${config.dotColor}`} />
      {showIcon && <Icon className="size-3.5 shrink-0" />}
      <span className="leading-none">{config.labelPt}</span>
      {showEnglishTag && (
        <span className="text-[10px] font-medium opacity-80 leading-none">• {config.labelEn}</span>
      )}
    </Badge>
  );
}
