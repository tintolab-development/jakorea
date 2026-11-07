export const talentDonationApplicationQueryKeys = {
  all: ['talent-donation-applications'] as const,
  lists: () => [...talentDonationApplicationQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local', filterKey: string) =>
    [...talentDonationApplicationQueryKeys.lists(), source, filterKey] as const,
  details: () => [...talentDonationApplicationQueryKeys.all, 'detail'] as const,
  detail: (source: 'remote' | 'local', id: string) =>
    [...talentDonationApplicationQueryKeys.details(), source, id] as const,
}
