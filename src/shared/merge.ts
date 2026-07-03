export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

/** Mutating merge — keeps object identity so UI bindings stay attached. */
export function applyPatchInPlace<T>(target: T, patch: DeepPartial<T>): void {
  for (const key of Object.keys(patch as Record<string, unknown>)) {
    const pv = (patch as Record<string, unknown>)[key]
    const tv = (target as Record<string, unknown>)[key]
    if (
      pv !== null && typeof pv === 'object' && !Array.isArray(pv) &&
      tv !== null && typeof tv === 'object' && !Array.isArray(tv)
    ) {
      applyPatchInPlace(tv, pv as DeepPartial<typeof tv>)
    } else {
      ;(target as Record<string, unknown>)[key] = pv
    }
  }
}

/** Immutable deep merge — patches never carry arrays for now, so arrays are replaced. */
export function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const key of Object.keys(patch as Record<string, unknown>)) {
    const pv = (patch as Record<string, unknown>)[key]
    const bv = (base as Record<string, unknown>)[key]
    if (
      pv !== null && typeof pv === 'object' && !Array.isArray(pv) &&
      bv !== null && typeof bv === 'object' && !Array.isArray(bv)
    ) {
      out[key] = deepMerge(bv, pv as DeepPartial<typeof bv>)
    } else {
      out[key] = pv
    }
  }
  return out as T
}
