import templateCertificateBg from '@/assets/images/template/certificate-background.png'
import { PARTICIPANT_INFO_ROW_LABELS } from '@/features/template/ui/template-management/template-custom-fields-form'
import {
  INSTRUCTOR_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
  VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
} from '@/features/template/lib/certificate-form-settings'

/**
 * 증명서 「참여자 정보」 줄 구성 — 템플릿(증명서 종류)별. 다섯째 줄(기간) 라벨만 증명서마다 다르다.
 *
 * - 수료증: 시안 5767:47724 「프로그램 기간」
 * - 참가인증서: 시안 5767:46804·5767:47559 「참여기간」
 * - 강사·봉사자 활동인증서: 6줄 고정 — 시안(5767:46959·5767:47403)대로 성명·생년월일·소속·프로그램명·활동기간·발급목적
 *   (사용자 결정 261113 「시안대로」, 기존 5줄·활동시수 줄 폐기).
 *   줄 표시 여부는 운영자가 바꿀 수 없다(템플릿 체크 항목 없음).
 *
 * 기본 배경(`certificate-background.png`)은 모든 증명서 공통이며 라벨이 없다 — 라벨은 늘 시스템이 글자로 그린다
 * (사용자 결정 261113, 시안처럼 라벨이 글자 레이어). 운영자가 올린 배경에서도 같은 라벨이 그려진다.
 */
export const ACTIVITY_CERTIFICATE_PARTICIPANT_ROW_LABELS = [
  '성명',
  '생년월일',
  '소속',
  '프로그램명',
  '활동기간',
  '발급목적',
] as const

/** 수료증(`document-3`) — 시안 5767:47724 */
export const COMPLETION_CERTIFICATE_PARTICIPANT_ROW_LABELS = [
  '성명',
  '생년월일',
  '소속',
  '프로그램명',
  '프로그램 기간',
  '발급목적',
] as const

/** 참가인증서(`document-participation-certificate`) — 시안 5767:46804·5767:47559 */
export const PARTICIPATION_CERTIFICATE_PARTICIPANT_ROW_LABELS = [
  '성명',
  '생년월일',
  '소속',
  '프로그램명',
  '참여기간',
  '발급목적',
] as const

export type CertificateParticipantLayout = {
  /** 줄 라벨(순서 = `participantInfo` 줄·체크박스 인덱스) */
  rowLabels: readonly string[]
  /** 배경을 올리지 않았을 때 쓰는 기본 배경 */
  defaultBackgroundSrc: string
  /** true면 줄을 항상 모두 표시한다(저장된 표시 여부·체크 항목 무시) */
  rowVisibilityLocked: boolean
}

/** 템플릿 코드를 모를 때(휴가 인증서 등 목록 비노출·레거시) — 줄 라벨은 예전 기본값 */
export const DEFAULT_CERTIFICATE_PARTICIPANT_LAYOUT: CertificateParticipantLayout = {
  rowLabels: PARTICIPANT_INFO_ROW_LABELS,
  defaultBackgroundSrc: templateCertificateBg,
  rowVisibilityLocked: false,
}

export const COMPLETION_CERTIFICATE_PARTICIPANT_LAYOUT: CertificateParticipantLayout = {
  rowLabels: COMPLETION_CERTIFICATE_PARTICIPANT_ROW_LABELS,
  defaultBackgroundSrc: templateCertificateBg,
  rowVisibilityLocked: false,
}

export const PARTICIPATION_CERTIFICATE_PARTICIPANT_LAYOUT: CertificateParticipantLayout = {
  rowLabels: PARTICIPATION_CERTIFICATE_PARTICIPANT_ROW_LABELS,
  defaultBackgroundSrc: templateCertificateBg,
  rowVisibilityLocked: false,
}

export const ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT: CertificateParticipantLayout = {
  rowLabels: ACTIVITY_CERTIFICATE_PARTICIPANT_ROW_LABELS,
  defaultBackgroundSrc: templateCertificateBg,
  rowVisibilityLocked: true,
}

/** 수료증·참가인증서 템플릿 코드 — 기간 줄 라벨이 다르고, 수료증은 변수 칩 기간 문구도 다르다 */
const COMPLETION_CERTIFICATE_TEMPLATE_CODE = 'document-3'
const PARTICIPATION_CERTIFICATE_TEMPLATE_CODE = 'document-participation-certificate'

const ACTIVITY_CERTIFICATE_TEMPLATE_CODES: ReadonlySet<string> = new Set([
  INSTRUCTOR_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
  VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
])

export function resolveCertificateParticipantLayout(
  templateCode: string | null | undefined
): CertificateParticipantLayout {
  if (templateCode == null) return DEFAULT_CERTIFICATE_PARTICIPANT_LAYOUT
  if (ACTIVITY_CERTIFICATE_TEMPLATE_CODES.has(templateCode))
    return ACTIVITY_CERTIFICATE_PARTICIPANT_LAYOUT
  if (templateCode === COMPLETION_CERTIFICATE_TEMPLATE_CODE)
    return COMPLETION_CERTIFICATE_PARTICIPANT_LAYOUT
  if (templateCode === PARTICIPATION_CERTIFICATE_TEMPLATE_CODE) {
    return PARTICIPATION_CERTIFICATE_PARTICIPANT_LAYOUT
  }
  return DEFAULT_CERTIFICATE_PARTICIPANT_LAYOUT
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

/**
 * 템플릿 관리 인증서 편집 캔버스에만 보이는 변수 칩(시안 5767:46804·46959·47403·47724).
 * 줄 순서 = `rowLabels`(6줄). 실제 발급 PDF·프로그램 발급 화면·미리보기 팝업에는 쓰지 않는다.
 */
export type CertificateVariableChip = {
  text: string
  /** true면 값 열 폭(451px)을 다 채운다 — 시안의 기간 칩 */
  fullWidth?: boolean
}

export type CertificateVariableChips = {
  /** 참여자 정보 값 열 — 줄마다 한 칩 */
  participantRows: readonly CertificateVariableChip[]
  /** 발급일자 자리 */
  issueDate: string
}

const CERTIFICATE_VARIABLE_CHIP_ROWS_BEFORE_PERIOD: readonly CertificateVariableChip[] = [
  { text: '@성명' },
  { text: '@생년월일' },
  { text: '@소속처' },
  { text: '@프로그램명' },
]
const CERTIFICATE_VARIABLE_CHIP_ISSUANCE_PURPOSE = '기관 및 학교 제출용'
export const CERTIFICATE_VARIABLE_CHIP_ISSUE_DATE = '@발급일자'

export function resolveCertificateVariableChips(
  templateCode: string | null | undefined
): CertificateVariableChips {
  const period =
    templateCode === COMPLETION_CERTIFICATE_TEMPLATE_CODE
      ? '@프로그램 시작일 ~ @프로그램 종료일'
      : '@프로그램 참여일 ~ @프로그램 종료일'
  return {
    participantRows: [
      ...CERTIFICATE_VARIABLE_CHIP_ROWS_BEFORE_PERIOD,
      { text: period, fullWidth: true },
      { text: CERTIFICATE_VARIABLE_CHIP_ISSUANCE_PURPOSE },
    ],
    issueDate: CERTIFICATE_VARIABLE_CHIP_ISSUE_DATE,
  }
}
