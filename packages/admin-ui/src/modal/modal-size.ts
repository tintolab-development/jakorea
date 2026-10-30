export type AdminModalSize = 'compact' | 'default' | 'medium' | 'wide' | 'large' | 'full'

export const ADMIN_MODAL_SIZE_WIDTH: Record<AdminModalSize, number | undefined> = {
  compact: 600,
  default: 800,
  medium: 1000,
  wide: 1200,
  large: 1400,
  full: undefined,
}
