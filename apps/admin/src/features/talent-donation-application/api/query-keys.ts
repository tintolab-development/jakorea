export const talentDonationApplicationQueryKeys = {
  all: ['talent-donation-applications'] as const,
  lists: () => [...talentDonationApplicationQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local', filterKey: string) =>
    [...talentDonationApplicationQueryKeys.lists(), source, filterKey] as const,
  details: () => [...talentDonationApplicationQueryKeys.all, 'detail'] as const,
  detail: (source: 'remote' | 'local', id: string, revealPii?: boolean) =>
    revealPii === undefined
      ? ([...talentDonationApplicationQueryKeys.details(), source, id] as const)
      : ([...talentDonationApplicationQueryKeys.details(), source, id, revealPii] as const),
}
