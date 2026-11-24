// What the core's error codes mean, in the interface language.

import { m } from "~/paraglide/messages.js";

const OBJECT_ERRORS: Record<string, () => string> = {
  no_layout: m.error_no_layout,
  truncated: m.error_truncated,
  trailing_bytes: m.error_trailing_bytes,
  invalid_layout: m.error_invalid_layout,
  malformed: m.error_malformed,
  unresolved_reference_type: m.error_unresolved_reference_type,
  obfuscation: m.error_obfuscation,
};

const ASSET_ERRORS: Record<string, () => string> = {
  not_compiled: m.error_not_compiled,
  encoder_unavailable: m.error_encoder_unavailable,
  too_large: m.error_too_large,
  outside_dependencies: m.error_outside_dependencies,
};

/** The explanation of an error code, or the core's own words for one this list doesn't know. */
export function explain(code: string): string {
  return (OBJECT_ERRORS[code] ?? ASSET_ERRORS[code])?.() ?? m.error_other({ reason: code });
}
