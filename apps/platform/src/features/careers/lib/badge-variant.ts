import type { CareerJobStatus } from '../model/types'

export function careerJobBadgeVariant(status: CareerJobStatus) {
  if (status === 'recruiting') {
    return 'primary' as const
  }
  if (status === 'result') {
    return 'deep' as const
  }
  return 'closed' as const
}
