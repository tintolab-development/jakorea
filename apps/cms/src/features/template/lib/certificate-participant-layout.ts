import templateCertificateBg from '@/assets/images/template/certificate-background.png'
import activityCertificateBg from '@/assets/images/template/activity-certificate-background.png'
import { PARTICIPANT_INFO_ROW_LABELS } from '@/features/template/ui/template-management/template-custom-fields-form'
import {
  INSTRUCTOR_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
  VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
} from '@/features/template/lib/certificate-form-settings'

/**
 * 증명서 「참여자 정보」 줄 구성 — 템플릿(증명서 종류)별.
 *
 * - 수료증·참가인증서 등: 6줄. 기본 배경(`certificate-background.png`)에 라벨이 그려져 있어 값만 얹는다.
 * - 강사·봉사자 활동인증서: 5줄 고정(CMS-FUNC-0265 — 이름·프로그램명·참여기간·활동시수 + 발급목적).
 *   줄 표시 여부는 운영자가 바꿀 수 없다(템플릿 체크 항목 없음, 기획 회신 261113 #5).
 *   기본 배경은 라벨 없는 배경이고 라벨은 시스템이 글자로 그린다(기획 회신 261113, 생년월일·소속 미표시).
 */
export const ACTIVITY_CERTIFICATE_PARTICIPANT_ROW_LABELS = [
  '성명',
  '프로그램명',
  '참여기간',
  '활동시수',
  '발급목적',
] as const

export type CertificateParticipantLayout = {
  /** 줄 라벨(순서 = `participantInfo` 줄·체크박스 인덱스) */
  rowLabels: readonly string[]
  /** 배경을 올리지 않았을 때 쓰는 기본 배경 */
  defaultBackgroundSrc: string
  /** 기본 배경에 라벨이 그려져 있으면 true — 이때는 라벨 열을 그리지 않는다 */
  defaultBackgroundHasParticipantLabels: boolean
  /** true면 줄을 항상 모두 표시한다(저장된 표시 여부·체크 항목 무시) */
  rowVisibilityLocked: boolean
}

export const DEFAULT_CERTIFICATE_PARTICIPANT_LAYOUT: CertificateParticipantLayout = {
  rowLabels: PARTICIPANT_INFO_ROW_LABELS,
  defaultBackgroundSrc: templateCertificateBg,
  defaultBackgroundHasParticipantLabels: true,
  rowVisibilityLocked: false,
}

export const ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT: CertificateParticipantLayout = {
  rowLabels: ACTIVITY_CERTIFICATE_PARTICIPANT_ROW_LABELS,
  defaultBackgroundSrc: activityCertificateBg,
  defaultBackgroundHasParticipantLabels: false,
  rowVisibilityLocked: true,
}

const ACTIVITY_CERTIFICATE_TEMPLATE_CODES: ReadonlySet<string> = new Set([
  INSTRUCTOR_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
  VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
])

export function resolveCertificateParticipantLayout(
  templateCode: string | null | undefined
): CertificateParticipantLayout {
  return templateCode != null && ACTIVITY_CERTIFICATE_TEMPLATE_CODES.has(templateCode)
    ? ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT
    : DEFAULT_CERTIFICATE_PARTICIPANT_LAYOUT
}

/**
 * 저장된 줄 표시 여부를 현재 줄 구성에 맞춘다.
 * 줄이 고정된 증명서(활동인증서)는 항상 모두 표시, 그 밖에 길이가 안 맞으면 모두 표시.
 */
export function normalizeParticipantRowVisibility(
  visibility: readonly boolean[] | null | undefined,
  layout: CertificateParticipantLayout
): boolean[] {
  const allVisible = () => layout.rowLabels.map(() => true)
  if (layout.rowVisibilityLocked || visibility == null) return allVisible()
  return visibility.length === layout.rowLabels.length ? [...visibility] : allVisible()
}
