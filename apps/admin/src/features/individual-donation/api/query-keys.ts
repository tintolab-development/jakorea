export const individualDonationQueryKeys = {
  all: ['individual-donation'] as const,
  detail: (source: 'remote' | 'local') =>
    [...individualDonationQueryKeys.all, 'detail', source] as const,
}
