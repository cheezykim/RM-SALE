import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "../services/crmApi";
import type { DailyTask, User, VisitCustomer } from "../types";
import { useSessionStore } from "../store/sessionStore";

export function useBootstrap(user: User | null) {
  const setNavigation = useSessionStore((state) => state.setNavigation);

  return useQuery({
    queryKey: ["bootstrap", user?.staff_id],
    queryFn: async () => {
      if (!user) throw new Error("Missing user session");
      const data = await crmApi.bootstrap(user);
      setNavigation(data.navigation);
      return data;
    },
    enabled: Boolean(user)
  });
}

export function useLogin() {
  const setUser = useSessionStore((state) => state.setUser);
  const setNavigation = useSessionStore((state) => state.setNavigation);

  return useMutation({
    mutationFn: crmApi.login,
    onSuccess: (data) => {
      const { navigation, ...user } = data;
      setUser(user);
      setNavigation(navigation);
    }
  });
}

export function useAddPotential(user: User) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customer: VisitCustomer) => crmApi.addPotential(user, customer),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bootstrap", user.staff_id] });
    }
  });
}

export function useUpdatePotential(user: User) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rowNumber, updates }: { rowNumber: number | string; updates: Record<string, unknown> }) =>
      crmApi.updatePotential(rowNumber, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bootstrap", user.staff_id] });
    }
  });
}

export function useSaveDailyPlan() {
  return useMutation({
    mutationFn: ({ user, planDate, tasks }: { user: User; planDate: string; tasks: DailyTask[] }) =>
      crmApi.saveDailyPlan(user, planDate, tasks)
  });
}

export function useGenerateDailyReport() {
  return useMutation({
    mutationFn: ({ user, reportDate, activities }: { user: User; reportDate: string; activities: Record<string, string> }) =>
      crmApi.generateDailyReport(user, reportDate, activities)
  });
}

export function useSubmitDailyReport() {
  return useMutation({
    mutationFn: ({ user, reportDate, activities }: { user: User; reportDate: string; activities: Record<string, string> }) =>
      crmApi.submitDailyReport(user, reportDate, activities)
  });
}
