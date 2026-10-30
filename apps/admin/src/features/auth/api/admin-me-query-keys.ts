export const adminMeQueryKeys = {
  all: ['admin', 'me'] as const,
  profile: (adminId: string) => [...adminMeQueryKeys.all, adminId] as const,
}
