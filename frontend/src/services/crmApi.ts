import type { BootstrapData, DailyTask, PotentialCustomer, User, VisitCustomer } from "../types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(payload.detail || response.statusText);
  }

  return response.json() as Promise<T>;
}

export const crmApi = {
  health: () => request<{ ok: boolean }>("/api/health"),
  login: (password: string) =>
    request<User & { navigation: string[] }>("/api/login", {
      method: "POST",
      body: JSON.stringify({ password })
    }),
  bootstrap: (user: User) =>
    request<BootstrapData>("/api/bootstrap", {
      method: "POST",
      body: JSON.stringify(user)
    }),
  addPotential: (user: User, customer: VisitCustomer) =>
    request<{ ok: boolean; message: string; potentials: PotentialCustomer[] }>("/api/potentials/add", {
      method: "POST",
      body: JSON.stringify({ user, customer })
    }),
  updatePotential: (row_number: number | string, updates: Record<string, unknown>) =>
    request<{ ok: boolean }>("/api/potentials/update", {
      method: "POST",
      body: JSON.stringify({ row_number: Number(row_number), updates })
    }),
  saveDailyPlan: (user: User, plan_date: string, tasks: DailyTask[]) =>
    request<{ ok: boolean; message: string }>("/api/daily-plan", {
      method: "POST",
      body: JSON.stringify({ user, plan_date, tasks })
    })
};

