// Reading and changing the place from components.

import { getRouteApi } from "@tanstack/react-router";
import type { Address } from "~/core/documents";
import type { Place } from "~/router";

const root = getRouteApi("__root__");

export function usePlace(): Place {
  return root.useSearch();
}

export function useGo(): (place: Place) => void {
  const navigate = root.useNavigate();
  return (place) => navigate({ search: place });
}

export function placeOf(address: Address): Place {
  return { b: address.bundle, f: address.file, o: address.id };
}

export function addressOf(place: Place): Address | undefined {
  const { b, f, o } = place;
  return b !== undefined && f !== undefined && o !== undefined
    ? { bundle: b, file: f, id: o }
    : undefined;
}
