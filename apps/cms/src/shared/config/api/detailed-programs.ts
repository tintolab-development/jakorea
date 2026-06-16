const trimEnv = (value: string | undefined, fallback: string): string =>
  (value?.trim().replace(/\/$/, '') || fallback).replace(/\/$/, '') || fallback

export const detailedProgramsApiPaths = {
  prefix: trimEnv(
    import.meta.env.VITE_DETAILED_PROGRAMS_API_PREFIX as string | undefined,
    '/api/admin/detailed-programs'
  ),
  list: () => detailedProgramsApiPaths.prefix,
  byId: (id: number | string) => `${detailedProgramsApiPaths.prefix}/${encodeURIComponent(String(id))}`,
} as const
