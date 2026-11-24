// The questions the interface asks the core, cached until other bundles are opened.

import { useQuery } from "@tanstack/react-query";
import { core } from "./client";
import { type Address, keyOf } from "./documents";

export function useObject(address: Address) {
  return useQuery({
    queryKey: ["object", keyOf(address)],
    queryFn: async () => (await core.object(address)) ?? null,
  });
}

export function useReferrers(address: Address) {
  return useQuery({
    queryKey: ["referrers", keyOf(address)],
    queryFn: () => core.referrers(address),
  });
}

/** A payload too large to be written inline, fetched only when `wanted`. */
export function usePayload(sha256: string, wanted: boolean) {
  return useQuery({
    queryKey: ["payload", sha256],
    queryFn: async () => (await core.payload(sha256)) ?? null,
    enabled: wanted,
  });
}
