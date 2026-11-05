import { useEffect, useState, useCallback } from "react";

/**
 * Configuração da empresa e espaço da Logo.
 *
 * Para definir a logo diretamente no código:
 * Altere `DEFAULT_COMPANY_CONFIG.logoUrl` abaixo com o caminho ou URL da imagem
 * (Exemplos: "/logo.png", "https://suaempresa.com/logo.svg", etc.)
 */
export const DEFAULT_COMPANY_CONFIG = {
  name: "Portal de Vagas",
  subtitle: "Oportunidades & Carreiras",
  // Insira a URL ou caminho da logo da empresa aqui:
  logoUrl: "",
};

export const LOGO_STORAGE_KEY = "company_logo_custom_url";
export const NAME_STORAGE_KEY = "company_name_custom";
export const SUBTITLE_STORAGE_KEY = "company_subtitle_custom";
export const LOGO_CHANGE_EVENT = "company_branding_changed";

export interface CompanyPreset {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  badgeColor: string;
  svgDataUri: string;
}

/**
 * Logos didáticas pré-configuradas para o setor produtivo do interior
 * (Agronegócio, Cooperativas, Indústria Regional e Tecnologia).
 */
export const REGIONAL_COMPANY_PRESETS: CompanyPreset[] = [
  {
    id: "agrotech",
    name: "AgroTech Regional",
    subtitle: "Inovação para o Campo & Cadeias Produtivas",
    category: "Agronegócio",
    badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="240" height="60"><rect width="240" height="60" rx="12" fill="%230f5132"/><circle cx="34" cy="30" r="18" fill="%23198754"/><path d="M26 34c0-7 6-12 14-12v6c-4 0-8 3-8 6h-6z" fill="%23d1e7dd"/><circle cx="38" cy="24" r="3" fill="%23ffc107"/><text x="64" y="28" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="16" font-weight="700">AgroTech</text><text x="64" y="44" fill="%23a3cfbb" font-family="system-ui, sans-serif" font-size="11" font-weight="500">REGIONAL</text></svg>`,
  },
  {
    id: "cooperativa",
    name: "Cooperativa AgroIndustrial",
    subtitle: "União & Força dos Produtores do Interior",
    category: "Cooperativismo",
    badgeColor: "bg-teal-500/10 text-teal-700 border-teal-500/30",
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="240" height="60"><rect width="240" height="60" rx="12" fill="%23064e3b"/><circle cx="34" cy="30" r="18" fill="%23047857"/><path d="M34 18l7 14h-14l7-14z" fill="%236ee7b7"/><circle cx="34" cy="35" r="4" fill="%23fbbf24"/><text x="64" y="28" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="15" font-weight="700">COOPERAÇÃO</text><text x="64" y="44" fill="%23a7f3d0" font-family="system-ui, sans-serif" font-size="11" font-weight="500">Agroindustrial Regional</text></svg>`,
  },
  {
    id: "industria",
    name: "Indústria Central do Interior",
    subtitle: "Manufatura, Logística & Emprego Local",
    category: "Indústria & Fábrica",
    badgeColor: "bg-blue-500/10 text-blue-700 border-blue-500/30",
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="240" height="60"><rect width="240" height="60" rx="12" fill="%231e293b"/><circle cx="34" cy="30" r="18" fill="%230284c7"/><path d="M26 38V26l6 4v-4l6 4v-4l4 2v10H26z" fill="%23e0f2fe"/><text x="64" y="28" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="15" font-weight="700">INDÚSTRIA</text><text x="64" y="44" fill="%237dd3fc" font-family="system-ui, sans-serif" font-size="11" font-weight="500">Central do Interior</text></svg>`,
  },
  {
    id: "tech-interior",
    name: "Polo Tech Regional",
    subtitle: "Software, TI & Hubs de Desenvolvimento",
    category: "Tecnologia & Serviços",
    badgeColor: "bg-indigo-500/10 text-indigo-700 border-indigo-500/30",
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="240" height="60"><rect width="240" height="60" rx="12" fill="%23312e81"/><circle cx="34" cy="30" r="18" fill="%236366f1"/><path d="M26 30l6-6 6 6-6 6-6-6z" fill="%23c7d2fe"/><circle cx="32" cy="30" r="3" fill="%23f43f5e"/><text x="64" y="28" fill="%23ffffff" font-family="system-ui, sans-serif" font-size="15" font-weight="700">POLO TECH</text><text x="64" y="44" fill="%23a5b4fc" font-family="system-ui, sans-serif" font-size="11" font-weight="500">Interior Conectado</text></svg>`,
  },
];

export function useCompanyLogo() {
  // CRITICAL for SSR Hydration: initialize identically on server and initial client render
  const [logoUrl, setLogoState] = useState<string>(DEFAULT_COMPANY_CONFIG.logoUrl);
  const [companyName, setCompanyNameState] = useState<string>(DEFAULT_COMPANY_CONFIG.name);
  const [companySubtitle, setCompanySubtitleState] = useState<string>(
    DEFAULT_COMPANY_CONFIG.subtitle,
  );
  const [isHydrated, setIsHydrated] = useState(false);

  // Sync with localStorage ONLY after hydration has completed on the client
  useEffect(() => {
    setIsHydrated(true);

    const syncState = () => {
      try {
        const storedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
        if (storedLogo !== null) {
          setLogoState(storedLogo);
        } else {
          setLogoState(DEFAULT_COMPANY_CONFIG.logoUrl);
        }

        const storedName = localStorage.getItem(NAME_STORAGE_KEY);
        if (
          storedName !== null &&
          storedName.trim() &&
          storedName.trim() !== "Talentos do Interior"
        ) {
          setCompanyNameState(storedName.trim());
        } else {
          setCompanyNameState(DEFAULT_COMPANY_CONFIG.name);
        }

        const storedSub = localStorage.getItem(SUBTITLE_STORAGE_KEY);
        if (storedSub !== null && storedSub.trim() && !storedSub.includes("do Interior")) {
          setCompanySubtitleState(storedSub.trim());
        } else {
          setCompanySubtitleState(DEFAULT_COMPANY_CONFIG.subtitle);
        }
      } catch {
        // LocalStorage access guarded
      }
    };

    syncState();

    window.addEventListener("storage", syncState);
    window.addEventListener(LOGO_CHANGE_EVENT, syncState);

    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener(LOGO_CHANGE_EVENT, syncState);
    };
  }, []);

  const setLogoUrl = useCallback((url: string) => {
    const cleanUrl = url.trim();
    try {
      if (typeof window !== "undefined") {
        if (cleanUrl) {
          localStorage.setItem(LOGO_STORAGE_KEY, cleanUrl);
        } else {
          localStorage.removeItem(LOGO_STORAGE_KEY);
        }
      }
    } catch {
      // Storage quota or privacy sandbox error
    }
    setLogoState(cleanUrl || DEFAULT_COMPANY_CONFIG.logoUrl);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(LOGO_CHANGE_EVENT));
    }
  }, []);

  const setCompanyName = useCallback((name: string) => {
    const cleanName = name.trim();
    try {
      if (typeof window !== "undefined") {
        if (cleanName) {
          localStorage.setItem(NAME_STORAGE_KEY, cleanName);
        } else {
          localStorage.removeItem(NAME_STORAGE_KEY);
        }
      }
    } catch {
      // Storage quota or privacy sandbox error
    }
    setCompanyNameState(cleanName || DEFAULT_COMPANY_CONFIG.name);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(LOGO_CHANGE_EVENT));
    }
  }, []);

  const setCompanySubtitle = useCallback((sub: string) => {
    const cleanSub = sub.trim();
    try {
      if (typeof window !== "undefined") {
        if (cleanSub) {
          localStorage.setItem(SUBTITLE_STORAGE_KEY, cleanSub);
        } else {
          localStorage.removeItem(SUBTITLE_STORAGE_KEY);
        }
      }
    } catch {
      // Storage quota or privacy sandbox error
    }
    setCompanySubtitleState(cleanSub || DEFAULT_COMPANY_CONFIG.subtitle);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(LOGO_CHANGE_EVENT));
    }
  }, []);

  const applyPreset = useCallback((preset: CompanyPreset) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(LOGO_STORAGE_KEY, preset.svgDataUri);
        localStorage.setItem(NAME_STORAGE_KEY, preset.name);
        localStorage.setItem(SUBTITLE_STORAGE_KEY, preset.subtitle);
      }
    } catch {
      // Storage quota or privacy sandbox error
    }
    setLogoState(preset.svgDataUri);
    setCompanyNameState(preset.name);
    setCompanySubtitleState(preset.subtitle);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(LOGO_CHANGE_EVENT));
    }
  }, []);

  const resetLogo = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(LOGO_STORAGE_KEY);
        localStorage.removeItem(NAME_STORAGE_KEY);
        localStorage.removeItem(SUBTITLE_STORAGE_KEY);
      }
    } catch {
      // Storage quota or privacy sandbox error
    }
    setLogoState(DEFAULT_COMPANY_CONFIG.logoUrl);
    setCompanyNameState(DEFAULT_COMPANY_CONFIG.name);
    setCompanySubtitleState(DEFAULT_COMPANY_CONFIG.subtitle);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(LOGO_CHANGE_EVENT));
    }
  }, []);

  return {
    logoUrl,
    companyName,
    companySubtitle,
    isHydrated,
    setLogoUrl,
    setCompanyName,
    setCompanySubtitle,
    applyPreset,
    resetLogo,
    hasCustomLogo: Boolean(logoUrl),
  };
}
