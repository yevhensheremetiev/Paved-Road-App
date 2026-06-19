import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { configureAuth, getAuthSession } from "../auth";
import { loadWebConfig } from "../config";

export function useAuthSession() {
  const config = useMemo(() => loadWebConfig(), []);
  const authSessionQuery = useQuery({
    queryFn: () => {
      configureAuth(config);
      return getAuthSession();
    },
    queryKey: ["authSession"],
    retry: false
  });

  return {
    authSessionQuery,
    config
  };
}
