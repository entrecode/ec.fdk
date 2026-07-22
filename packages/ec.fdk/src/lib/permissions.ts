import type { ExpandTemplatePermissionsConfig } from "../types";
import { getTemplateDataManagers } from "./admin";

/**
 * Matches template-based permission strings of the form
 * `dm:template-<uuidv4>:<rest>`. The datamanager grants these to act like
 * `dm:<dataManagerID>:<rest>` for every datamanager created from `<templateID>`.
 * Entries whose id is not a valid v4 UUID are intentionally left untouched.
 * @ignore
 */
const TEMPLATE_PERMISSION_RE =
  /^dm:template-([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}):(.+)$/i;

/**
 * How long a `templateID → dataManagerIDs` mapping stays fresh (ms). Clients receive
 * no invalidation events, so this TTL is the sole freshness guarantee (~5 min).
 * @ignore
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { dataManagerIDs: string[]; expires: number };

/** Module-level cache, keyed by `<env>:<templateID>`. @ignore */
const templateCache = new Map<string, CacheEntry>();

/**
 * Clears the internal `templateID → dataManagerIDs` cache used by
 * {@link expandTemplatePermissions}. Mainly useful in tests or to force a refresh
 * before the TTL (~5 min) expires.
 */
export function clearTemplatePermissionCache(): void {
  templateCache.clear();
}

/** Resolves a single templateID to its dataManagerIDs, using the TTL cache. @ignore */
async function resolveTemplate(
  config: ExpandTemplatePermissionsConfig,
  templateID: string,
): Promise<string[]> {
  const key = `${config.env}:${templateID}`;
  const cached = templateCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.dataManagerIDs;
  }
  const dataManagerIDs = await getTemplateDataManagers({
    env: config.env,
    token: config.token,
    fetcher: config.fetcher,
    templateID,
  });
  templateCache.set(key, { dataManagerIDs, expires: Date.now() + CACHE_TTL_MS });
  return dataManagerIDs;
}

/**
 * Expands template-based permissions into concrete datamanager permissions.
 *
 * Entries of the form `dm:template-<templateID>:<rest>` are replaced with one
 * `dm:<dataManagerID>:<rest>` per datamanager created from that template (looked up
 * via {@link getTemplateDataManagers}, cached ~5 min). All other permission strings
 * pass through unchanged. The result is deduplicated while preserving order.
 *
 * The fdk deliberately does **no** matching itself (no `shiro-trie`, no `dm:` parsing
 * beyond this expansion): the returned array is still raw data to be fed into your own
 * matcher on the consumer side. Run raw account permissions through this helper
 * *before* matching whenever template grants may be present.
 *
 * Fail-closed: entries with an invalid (non-v4) template UUID are left untouched, and
 * if the lookup route fails for a template, its entries stay unexpanded (raw
 * `dm:template-…` string) instead of throwing — so a transient outage never silently
 * widens or drops access.
 *
 * @example
 * import { fdk, expandTemplatePermissions } from "ec.fdk";
 * const raw = await fdk("stage").token(token).dm("83cc6374").getPermissions();
 * const perms = await expandTemplatePermissions({ env: "stage", token }, raw);
 * // pair `perms` with shiro-trie (or any matcher) on the consumer side
 */
export async function expandTemplatePermissions(
  config: ExpandTemplatePermissionsConfig,
  permissions: string[],
): Promise<string[]> {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return permissions ?? [];
  }

  // Collect the distinct templateIDs that actually occur (one fetch per templateID).
  const templateIDs = new Set<string>();
  for (const permission of permissions) {
    const match = TEMPLATE_PERMISSION_RE.exec(permission);
    if (match) {
      templateIDs.add(match[1]);
    }
  }

  if (templateIDs.size === 0) {
    return permissions;
  }

  // Resolve each templateID → dataManagerIDs. `null` marks a failed lookup (fail-closed).
  const mappings = new Map<string, string[] | null>();
  await Promise.all(
    Array.from(templateIDs).map(async (templateID) => {
      try {
        mappings.set(templateID, await resolveTemplate(config, templateID));
      } catch {
        mappings.set(templateID, null);
      }
    }),
  );

  const result: string[] = [];
  const seen = new Set<string>();
  const push = (permission: string) => {
    if (!seen.has(permission)) {
      seen.add(permission);
      result.push(permission);
    }
  };

  for (const permission of permissions) {
    const match = TEMPLATE_PERMISSION_RE.exec(permission);
    if (!match) {
      push(permission);
      continue;
    }
    const [, templateID, rest] = match;
    const dataManagerIDs = mappings.get(templateID);
    if (!dataManagerIDs) {
      // Lookup failed → keep the raw template entry unexpanded (fail-closed).
      push(permission);
      continue;
    }
    // Valid mapping (possibly empty) → replace with concrete permissions.
    for (const dataManagerID of dataManagerIDs) {
      push(`dm:${dataManagerID}:${rest}`);
    }
  }

  return result;
}
