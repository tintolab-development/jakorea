import type { IntegrationStatus } from '../data/types'
import { integrationStatusLabel } from '../lib/compute-rates'

const CLASS_BY_STATUS: Record<IntegrationStatus, string> = {
  'api-wired': 'bd-badge bd-badge--wired',
  hybrid: 'bd-badge bd-badge--hybrid',
  'mock-only': 'bd-badge bd-badge--mock',
  'n-a': 'bd-badge bd-badge--na',
}

export function StatusBadge({ status }: { status: IntegrationStatus }) {
  return <span className={CLASS_BY_STATUS[status]}>{integrationStatusLabel(status)}</span>
}
