export const talentDonationIntroQueryKeys = {
  all: ['talent-donation-intro'] as const,
  detail: (source: 'remote' | 'local') =>
    [...talentDonationIntroQueryKeys.all, 'detail', source] as const,
}
