import { StatusOutlineTag } from '@/shared/components/status-outline-tag'

const NEUTRAL_TAG_ACCENT = 'rgba(61, 61, 61, 0.8)'

/**
 * Figma Status / Tag — UJAT 일정 확인(14804:19740) · UJAT 기관 배정(14804:19750).
 * 라벨은 호출처 문자열을 그대로 쓰고, 색만 statusKey로 정한다. 모르는 key는 중립 80%.
 */
const INSTITUTION_APPLICATION_TAG_ACCENT: Record<string, string> = {
  temp_assigned: NEUTRAL_TAG_ACCENT,
  temp_rejected: 'var(--Status-pink-main, #e8007c)',
  application_rejected: 'var(--Status-red-main, #c32f4a)',
  evaluation_pending: 'var(--Status-green-main, #1e8c29)',
  institution_checking: 'var(--Status-green-main, #1e8c29)',
  institution_confirmed: 'var(--Status-blue-main, #017eaf)',
  approval_completed: NEUTRAL_TAG_ACCENT,
  revision_requested: 'var(--Status-purple-main, #8457ce)',
}

/** 캘린더 우측 일별 리스트 전용 기관 신청 상태 Tag (테이블 리스트뷰와 표현 종류 분리) */
export function InstitutionApplicationStatusBadge({
  statusKey,
  label,
}: {
  statusKey: string
  label: string
}) {
  return (
    <StatusOutlineTag
      label={label}
      accentColor={INSTITUTION_APPLICATION_TAG_ACCENT[statusKey] ?? NEUTRAL_TAG_ACCENT}
    />
  )
}
