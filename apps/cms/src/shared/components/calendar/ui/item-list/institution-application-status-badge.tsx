import { StatusOutlineTag } from '@/shared/components/status-outline-tag'
import { getInstitutionApplicationStatusColor } from '@/shared/constants/institution-application-status-colors'

/**
 * 캘린더 우측 일별 리스트 전용 기관 신청 상태 Tag (Figma Status / Tag — UJAT 일정 확인 14804:19740 · 기관 배정 14804:19750).
 * 라벨은 호출처 문자열, 색은 `institution-application-status-colors.ts` Tag 정의.
 */
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
      accentColor={getInstitutionApplicationStatusColor(statusKey, 'tag')}
    />
  )
}
