export const footerQueryKeys = {
  all: ['footer'] as const,
  /** GET /api/admin/site/footer 1회 */
  admin: () => [...footerQueryKeys.all, 'admin', 'remote'] as const,
}
