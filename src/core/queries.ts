// The questions the interface asks the core, cached until other bundles are opened.

import { useQuery } from "@tanstack/react-query";
import { queryClient } from "~/lib/query";
import { core } from "./client";
import { type Address, keyOf } from "./documents";
import type { Member } from "./session";
import type { Direction } from "./units";

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

/** The assets `bundle` makes. Planning reads the bundle, but converts nothing. */
export function useAssets(bundle: string) {
  return useQuery({ queryKey: ["assets", bundle], queryFn: () => core.assets(bundle) });
}

/** The asset `name`, converted the first time it is asked for. */
export function useConverted(name: string) {
  return useQuery({ queryKey: ["asset", name], queryFn: () => core.convert(name) });
}

/** The objects converting the asset `name` may read. */
export function useClosure(name: string) {
  return useQuery({ queryKey: ["closure", name], queryFn: () => core.closure(name) });
}

/** A file of a converted asset. */
export function useMember(member: Member) {
  return useQuery(memberQuery(member));
}

/** A file of a converted asset, fetched outside a component. */
export function fetchMember(member: Member): Promise<Uint8Array | null> {
  return queryClient.fetchQuery(memberQuery(member));
}

function memberQuery(member: Member) {
  return {
    queryKey: ["member", member.sha256],
    queryFn: async () => (await core.member(member)) ?? null,
  };
}

/** The units at most `depth` ties from the unit of `center`, following `direction`. */
export function useAround(center: Address, direction: Direction, depth: number, limit: number) {
  return useQuery({
    queryKey: ["around", keyOf(center), direction, depth, limit],
    queryFn: () => core.around(center, direction, depth, limit),
  });
}

/** The units that hold `objects`, fetched only when `wanted`. */
export function useGathered(objects: Address[], wanted: boolean) {
  return useQuery({
    queryKey: ["gather", objects.map(keyOf)],
    queryFn: () => core.gather(objects),
    enabled: wanted,
  });
}

/** The bundles each open bundle depends on. */
export function useDependencies() {
  return useQuery({ queryKey: ["dependencies"], queryFn: () => core.dependencies() });
}

/** The references objects of the bundle `from` make to objects of the bundle `to`. */
export function useBetween(from: string, to: string) {
  return useQuery({ queryKey: ["between", from, to], queryFn: () => core.between(from, to) });
}
