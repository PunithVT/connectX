import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchMe, login as loginApi } from "@/api/auth.api";
import { useAuthStore } from "@/store";
import type { LoginPayload } from "@/types/api";

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: !!accessToken,
  });
}

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginApi(payload),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();
  return () => {
    clear();
    qc.clear();
  };
}
