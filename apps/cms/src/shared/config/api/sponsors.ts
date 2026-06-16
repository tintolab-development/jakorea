const trimEnv = (value: string | undefined, fallback: string): string =>
  (value?.trim().replace(/\/$/, '') || fallback).replace(/\/$/, '') || fallback

export const sponsorsApiPaths = {
  prefix: trimEnv(import.meta.env.VITE_SPONSORS_API_PREFIX as string | undefined, '/api/sponsors'),
  list: () => sponsorsApiPaths.prefix,
  byId: (id: string) => `${sponsorsApiPaths.prefix}/${encodeURIComponent(id)}`,
  end: (id: string) => `${sponsorsApiPaths.prefix}/${encodeURIComponent(id)}/end`,
  contacts: (id: string) => `${sponsorsApiPaths.prefix}/${encodeURIComponent(id)}/contacts`,
  contactById: (contactId: string) =>
    `${sponsorsApiPaths.prefix}/contacts/${encodeURIComponent(contactId)}`,
  yearlyBusinesses: (id: string) =>
    `${sponsorsApiPaths.prefix}/${encodeURIComponent(id)}/yearly-businesses`,
  yearlyBusinessById: (yearlyBusinessId: string) =>
    `${sponsorsApiPaths.prefix}/yearly-businesses/${encodeURIComponent(yearlyBusinessId)}`,
} as const
