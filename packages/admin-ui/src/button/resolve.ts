export type AdminButtonVariant = 'primary' | 'secondary' | 'default' | 'error' | 'cancel' | 'delete'
export type AdminButtonSize = 'h52' | 'h44' | 'h40' | 'h36' | 'h32' | 'large' | 'medium' | 'small'
export type AdminButtonResolvedSize = 'h52' | 'h44' | 'h40' | 'h36' | 'h32'
export type AdminButtonResolvedVariant = 'primary' | 'secondary' | 'default' | 'error'

export function resolveAdminButtonSize(size: AdminButtonSize): AdminButtonResolvedSize {
  if (size === 'large') return 'h44'
  if (size === 'medium') return 'h40'
  if (size === 'small') return 'h32'
  return size
}

export function resolveAdminButtonVariant(variant: AdminButtonVariant): AdminButtonResolvedVariant {
  if (variant === 'cancel') return 'default'
  if (variant === 'delete') return 'error'
  return variant
}
