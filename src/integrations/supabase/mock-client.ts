// In-memory / local fallback mock client for Supabase when credentials are not configured.
import type { Session, User } from "@supabase/supabase-js";

export const DEFAULT_MOCK_JOBS = [
  {
    id: "d1a88b1f-7985-48b7-a3cf-05be3b679a01",
    title: "Pessoa Desenvolvedora Front-end Pleno",
    department: "Tecnologia",
    location: "São Paulo - Híbrido",
    employment_type: "CLT",
    seniority: "Pleno",
    salary_range: "R$ 8.000 - R$ 11.000",
    description:
      "Você vai construir interfaces do nosso produto principal ao lado de designers e product managers, cuidando de performance, acessibilidade e qualidade de código.",
    requirements:
      "React e TypeScript; testes automatizados; noções de acessibilidade; inglês técnico.",
    status: "open",
    created_by: null,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "e2b99c2a-8096-49c8-b4da-16cf4c780b02",
    title: "Analista de Recursos Humanos",
    department: "Recursos Humanos",
    location: "Remoto",
    employment_type: "CLT",
    seniority: "Júnior",
    salary_range: "R$ 4.000 - R$ 5.500",
    description:
      "Apoiar todo o ciclo de recrutamento e seleção, desde a abertura da vaga até a integração da pessoa contratada.",
    requirements: "Experiência com recrutamento; boa comunicação; organização e uso de planilhas.",
    status: "open",
    created_by: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "f3c00d3b-9107-4ad9-c5eb-27da5d891c03",
    title: "Analista de Dados Sênior",
    department: "Dados",
    location: "Rio de Janeiro - Presencial",
    employment_type: "PJ",
    seniority: "Sênior",
    salary_range: "R$ 14.000 - R$ 18.000",
    description:
      "Responsável por modelagem de dados, dashboards executivos e apoio à tomada de decisão das áreas de negócio.",
    requirements: "SQL avançado; Python; experiência com data warehouse; storytelling com dados.",
    status: "open",
    created_by: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "a4d11e4c-0218-4be0-d6fc-38eb6e902d04",
    title: "Estágio em Marketing",
    department: "Marketing",
    location: "Belo Horizonte - Híbrido",
    employment_type: "Estágio",
    seniority: "Estágio",
    salary_range: "R$ 2.000 + benefícios",
    description:
      "Apoiar a produção de conteúdo, campanhas de mídia paga e análise de métricas das redes sociais.",
    requirements:
      "Cursando Marketing, Publicidade ou áreas afins; boa escrita; interesse por redes sociais.",
    status: "open",
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

type AuthListener = (event: string, session: Session | null) => void;
const authListeners: Set<AuthListener> = new Set();

function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Ignore error
  }
  return null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore error
  }
}

function removeStorageItem(key: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore error
  }
}

let storedSession: Session | null = null;
try {
  const raw = getStorageItem("mock_supabase_session");
  if (raw) {
    storedSession = JSON.parse(raw);
  }
} catch {
  storedSession = null;
}

const mockTables: Record<string, unknown[]> = {
  jobs: [...DEFAULT_MOCK_JOBS],
  applications: [],
  profiles: [],
  user_roles: [],
};

try {
  const rawApps = getStorageItem("mock_supabase_applications");
  if (rawApps) {
    mockTables["applications"] = JSON.parse(rawApps);
  }
} catch {
  // Ignore error
}

class QueryBuilder {
  private table: string;
  private filters: Array<(row: Record<string, unknown>) => boolean> = [];
  private orderFn?: (a: Record<string, unknown>, b: Record<string, unknown>) => number;

  constructor(table: string) {
    this.table = table;
  }

  select(_cols?: string) {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const asc = options?.ascending ?? true;
    this.orderFn = (a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      return (valA < valB ? -1 : 1) * (asc ? 1 : -1);
    };
    return this;
  }

  private getRows(): Record<string, unknown>[] {
    const list = (mockTables[this.table] ?? []) as Record<string, unknown>[];
    let filtered = list.filter((row) => this.filters.every((f) => f(row)));
    if (this.orderFn) {
      filtered = [...filtered].sort(this.orderFn);
    }
    return filtered;
  }

  async maybeSingle() {
    const rows = this.getRows();
    return { data: rows[0] ?? null, error: null };
  }

  async single() {
    const rows = this.getRows();
    return { data: rows[0] ?? null, error: rows[0] ? null : new Error("Not found") };
  }

  async insert(record: Record<string, unknown> | Record<string, unknown>[]) {
    const items = Array.isArray(record) ? record : [record];
    const inserted: Record<string, unknown>[] = [];
    const list = mockTables[this.table] ?? [];

    for (const item of items) {
      const row = {
        id: item["id"] ?? `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item,
      };
      list.push(row);
      inserted.push(row);
    }
    mockTables[this.table] = list;
    if (this.table === "applications") {
      setStorageItem("mock_supabase_applications", JSON.stringify(list));
    }
    return { data: inserted, error: null };
  }

  async update(patch: Record<string, unknown>) {
    const list = (mockTables[this.table] ?? []) as Record<string, unknown>[];
    for (let i = 0; i < list.length; i++) {
      const row = list[i];
      if (row && this.filters.every((f) => f(row))) {
        list[i] = { ...row, ...patch, updated_at: new Date().toISOString() };
      }
    }
    return { data: null, error: null };
  }

  async delete() {
    const list = (mockTables[this.table] ?? []) as Record<string, unknown>[];
    mockTables[this.table] = list.filter((row) => !this.filters.every((f) => f(row)));
    return { data: null, error: null };
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: Record<string, unknown>[];
          error: null;
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    const res = { data: this.getRows(), error: null };
    return Promise.resolve(res).then(onfulfilled, onrejected);
  }
}

export function createMockSupabaseClient() {
  return {
    from: (table: string) => new QueryBuilder(table),
    storage: {
      from: (_bucket: string) => ({
        upload: async (path: string, _file: unknown) => ({
          data: { path },
          error: null,
        }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://mock.storage/${path}` },
        }),
      }),
    },
    auth: {
      async getSession() {
        return { data: { session: storedSession }, error: null };
      },
      onAuthStateChange(callback: AuthListener) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
      async signInWithPassword({ email }: { email: string; password?: string }) {
        const id = `user-${email.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const user: User = {
          id,
          app_metadata: {},
          user_metadata: { full_name: email.split("@")[0] },
          aud: "authenticated",
          created_at: new Date().toISOString(),
          email,
        };
        const session: Session = {
          access_token: `mock-token-${Date.now()}`,
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: `mock-refresh-${Date.now()}`,
          user,
        };
        storedSession = session;
        setStorageItem("mock_supabase_session", JSON.stringify(session));
        authListeners.forEach((fn) => fn("SIGNED_IN", session));
        return { data: { user, session }, error: null };
      },
      async signUp({
        email,
        options,
      }: {
        email: string;
        password?: string;
        options?: { data?: { full_name?: string } };
      }) {
        const id = `user-${email.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const user: User = {
          id,
          app_metadata: {},
          user_metadata: { full_name: options?.data?.full_name ?? email.split("@")[0] },
          aud: "authenticated",
          created_at: new Date().toISOString(),
          email,
        };
        const session: Session = {
          access_token: `mock-token-${Date.now()}`,
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: `mock-refresh-${Date.now()}`,
          user,
        };
        storedSession = session;
        setStorageItem("mock_supabase_session", JSON.stringify(session));
        authListeners.forEach((fn) => fn("SIGNED_IN", session));
        return { data: { user, session }, error: null };
      },
      async signOut() {
        storedSession = null;
        removeStorageItem("mock_supabase_session");
        authListeners.forEach((fn) => fn("SIGNED_OUT", null));
        return { error: null };
      },
      async setSession(tokens: { access_token: string; refresh_token: string }) {
        if (!tokens) return { data: { session: null }, error: null };
        const user: User = {
          id: "google-mock-user",
          app_metadata: {},
          user_metadata: { full_name: "Google User" },
          aud: "authenticated",
          created_at: new Date().toISOString(),
          email: "user@example.com",
        };
        const session: Session = {
          access_token: tokens.access_token,
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: tokens.refresh_token,
          user,
        };
        storedSession = session;
        setStorageItem("mock_supabase_session", JSON.stringify(session));
        authListeners.forEach((fn) => fn("SIGNED_IN", session));
        return { data: { session }, error: null };
      },
    },
  };
}
