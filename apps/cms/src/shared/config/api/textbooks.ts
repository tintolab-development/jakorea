const trimEnv = (value: string | undefined, fallback: string): string =>
  (value?.trim().replace(/\/$/, '') || fallback).replace(/\/$/, '') || fallback

export const textbooksApiPaths = {
  prefix: trimEnv(
    import.meta.env.VITE_TEXTBOOKS_API_BASE_PATH as string | undefined,
    '/api/cms/textbooks'
  ),
  list: () => textbooksApiPaths.prefix,
  byId: (id: string) => `${textbooksApiPaths.prefix}/${encodeURIComponent(id)}`,
  matches: () => `${textbooksApiPaths.prefix}/matches`,
} as const
