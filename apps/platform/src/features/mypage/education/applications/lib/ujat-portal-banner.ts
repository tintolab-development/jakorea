import type {
  PortalProgramApplicationSupplement,
  UjatPortalBannerState,
} from '../api/types'

export type UjatScheduleBannerVariant = 'action' | 'review' | 'revision'

export type UjatScheduleBannerCopy = {
  variant: UjatScheduleBannerVariant
  title: string
  body: string
  clickable: boolean
}

const BANNER_STATES = new Set<string>([
  'NONE',
  'ACTION_REQUIRED',
  'ADMIN_REVIEW',
  'REVISION_REQUIRED',
  'FINAL_APPROVED',
  'REJECTED',
])

const BANNER_COPY: Record<UjatScheduleBannerVariant, Omit<UjatScheduleBannerCopy, 'variant'>> = {
  action: {
    title: '관리자와 협의된 일정을 확인해 주세요!',
    body: '협의 된 최종 일정을 확인하고 안내사항을 작성해 주세요!',
    clickable: true,
  },
  review: {
    title: '전달주신 일정을 관리자가 확인 중이에요.',
    body: '확인 후 최종 승인 여부가 반영됩니다.',
    clickable: false,
  },
  revision: {
    title: '작성된 내용에 수정사항이 있어요!',
    body: '담당자와 협의된 내용을 확인 후 수정 제출해 주세요!',
    clickable: true,
  },
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function readUjatPortalBannerState(
  supplement: PortalProgramApplicationSupplement | unknown,
): UjatPortalBannerState | null {
  const root = asRecord(supplement)
  if (!root) return null
  const ujat = asRecord(root.ujat)
  if (!ujat) return null
  const raw = typeof ujat.portalBannerState === 'string' ? ujat.portalBannerState.trim() : ''
  if (!raw || !BANNER_STATES.has(raw)) return null
  return raw as UjatPortalBannerState
}

export function resolveUjatScheduleBannerVariant(
  state: UjatPortalBannerState | null | undefined,
): UjatScheduleBannerVariant | null {
  if (state === 'ACTION_REQUIRED') return 'action'
  if (state === 'ADMIN_REVIEW') return 'review'
  if (state === 'REVISION_REQUIRED') return 'revision'
  return null
}

export function resolveUjatScheduleBannerFromState(
  state: UjatPortalBannerState | null | undefined,
): UjatScheduleBannerCopy | null {
  const variant = resolveUjatScheduleBannerVariant(state)
  if (!variant) return null
  return { variant, ...BANNER_COPY[variant] }
}

export function resolveUjatScheduleBanner(
  supplement: PortalProgramApplicationSupplement | unknown,
): UjatScheduleBannerCopy | null {
  return resolveUjatScheduleBannerFromState(readUjatPortalBannerState(supplement))
}

export function shouldUseUjatApplicationContent(detailCase: string | undefined): boolean {
  return detailCase === 'ujat-participant'
}

export function shouldShowUjatScheduleBanner(
  detailCase: string | undefined,
  state: UjatPortalBannerState | null | undefined,
): boolean {
  return shouldUseUjatApplicationContent(detailCase) && resolveUjatScheduleBannerFromState(state) != null
}

export function sanitizeUjatParticipantBasicInfoFields<T extends { label: string; value: string }>(
  detailCase: string | undefined,
  educationTargetDetailLabel: string | null | undefined,
  fields: readonly T[],
): T[] {
  if (!shouldUseUjatApplicationContent(detailCase)) return [...fields]
  if (educationTargetDetailLabel?.trim()) return [...fields]
  return fields.map(field =>
    field.label === '대상' && field.value.trim() === '초등학교'
      ? { ...field, value: '-' }
      : field,
  )
}
