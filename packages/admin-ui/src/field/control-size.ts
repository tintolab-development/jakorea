export type AdminControlSize = 'xlarge' | 'large' | 'medium' | 'small' | 'compact'

export function cmsControlSizeClass(size: AdminControlSize): string {
  return `cms-control--${size}`
}
