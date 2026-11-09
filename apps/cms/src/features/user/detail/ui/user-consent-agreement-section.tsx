/**
 * 회원 상세 — 약관 및 동의 (DetailInfoForm)
 */

import { Spin } from 'antd'
import { useCallback, useState, type CSSProperties, type ReactNode } from 'react'
import { resolveConsentStatusDisplayLabel } from '@jakorea/domain/shared/required-consent-alert'
import type { User } from '@/types/user'
import type { TermsAgreementRequest } from '@/shared/api/generated/members/schemas/termsAgreementRequest'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsRadioGroup } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import {
  CONSENT_LABEL_TO_EDITABLE_TERMS_TYPE,
  isAdminDetailLockedConsentLabel,
  isMemberBasicInfoImmutableConsentLabel,
  resolveEditableConsentAgreedFromDraft,
} from '@/features/user/api/member-basic-info-terms-patch'
import { MemberConsentDocumentViewModal } from '@/features/user/shared/ui/member-consent-document-view-modal'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { isCmsViewerAdminRole } from '@/shared/lib/cms-global-role-code'
import { showAdminAccessDeniedAlert } from '@/shared/lib/admin-role-policy'
import { canDownloadSensitiveConsentFile } from '@/shared/lib/can-download-sensitive-consent-file'
import { MemberConsentAgreementModal } from '@/features/user/shared/ui/member-consent-agreement-modal'
import { MemberConsentCrimeModal } from '@/features/user/shared/ui/member-consent-crime-modal'
import { CONSENT_RADIO_OPTIONS } from '@/features/user/shared/ui/instructor-profile-form'
import {
  isMemberCrimeConsentField,
  isSensitiveConsentDocumentLabel,
  resolveMemberConsentTemplateByLabel,
  type MemberConsentTemplateEntry,
} from '@/features/user/shared/lib/member-consent-template-map'
import type {
  MemberConsentAgreementDraftSnapshot,
  MemberConsentCrimeDraftSnapshot,
  MemberRegisterConsentWriteSnapshots,
} from '@/features/user/shared/lib/member-register-consent-write-snapshot'
import './detail-info/user-detail-section-head.css'
import './user-consent-agreement-section.css'

export type UserConsentAgreementPreset =
  | 'individual'
  | 'school_teacher'
  | 'instructor_dual'
  | 'instructor_only'
  | 'admin'

export interface UserConsentAgreementSectionProps {
  preset?: UserConsentAgreementPreset
  viewVariant?: 'default' | 'permission_instructor'
  /** 상단 안내 — 미지정 시 프리셋별 기본값 */
  caption?: ReactNode
  /** 동의서 보기 — 필요한 항목에만 사용 */
  onOpenAgreementDocument?: () => void
  /** remote API 동의 레코드 오버레이 (미지정 시 mock 샘플) */
  remoteConsentRows?: ConsentRowSchema[]
  /** remote 모드에서 API 로딩 중 */
  remoteConsentLoading?: boolean
  /**
   * 관리자 등록 회원 기본정보 수정.
   * 선택 동의: 라디오 편집(관리자 회원은 마케팅 제외). 필수(서비스·개인정보·MFA): disabled.
   */
  editing?: boolean
  draftTermsAgreements?: TermsAgreementRequest[]
  onEditableConsentChange?: (label: string, agreed: boolean) => void
  consentWriteSnapshots?: MemberRegisterConsentWriteSnapshots
  onConsentAgreementSnapshotSave?: (
    label: string,
    snapshot: MemberConsentAgreementDraftSnapshot
  ) => void
  onConsentCrimeSnapshotSave?: (label: string, snapshot: MemberConsentCrimeDraftSnapshot) => void
  memberId?: number
  membersRemote?: boolean
  /** 동의-only 미리보기 — 회원 기본정보 PII 주입 */
  memberUser?: Omit<User, 'password'>
}

const DEFAULT_CAPTION =
  '초상권 및 교육진행자 관련 동의서에 동의하지 않은 경우 프로그램 신청·참여 또는 교육진행자 활동이 제한될 수 있습니다. 마케팅 정보 수신 동의 여부는 서비스 이용과 무관합니다.'

export function resolveUserConsentAgreementPreset(
  user: Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>
): UserConsentAgreementPreset {
  if (user.role === 'ADMIN') return 'admin'
  if (user.role === 'INDIVIDUAL') return 'individual'
  if (user.role === 'INSTRUCTOR') {
    const p = resolveInstructorMemberProfile(user) ?? 'instructor_only'
    if (p === 'school_teacher') return 'school_teacher'
    if (p === 'instructor_dual') return 'instructor_dual'
    return 'instructor_only'
  }
  return 'individual'
}

const SAMPLE_AGREED_AT_DISPLAY = '2026.01.15 09:15:42'

const CONSENT_LABEL_WIDTH = 180 as const

/**
 * 화면 표시용 라벨(시안). `field.label`은 동의 종류·동의서 양식 매핑 키로 쓰이므로 바꾸지 않는다
 * (`member-basic-info-terms-patch.ts`, `member-consent-template-map.ts`).
 */
const CONSENT_FIELD_DISPLAY_LABELS: Record<string, string> = {
  '서비스 이용약관': '서비스 이용약관 동의',
  '마케팅 제공 동의': '마케팅 정보 수신 동의',
  '초상권 수집·이용 동의': '초상권 수집·이용 동의서',
  '지급조서 사전 동의서': '지급조서 사전동의서',
  '2단계 인증(MFA) 설정 동의': '2단계 인증 설정 동의',
}

/** 수정 모드에서도 조회 표시만 하는 동의 (키 라벨) */
const CONSENT_VIEW_ONLY_IN_EDIT_LABELS = new Set(['마케팅 제공 동의', '초상권 수집·이용 동의'])

export function resolveConsentFieldDisplayLabel(label: string): string {
  return CONSENT_FIELD_DISPLAY_LABELS[label] ?? label
}

/** 단일 필드 값 — 동의 상태 또는 동의서 행 */
export type ConsentFieldValueSchema =
  | {
      type: 'remote_consent'
      agreed: boolean
      agreedAtDisplay?: string
      consentStatus?: string
      consentType?: string
      /** 초상권 동의/부분 동의 라벨 전용 (`resolveConsentStatusDisplayLabel`) */
      allItemsAgreed?: boolean | null
    }
  | {
      type: 'document'
      agreed: boolean
      agreedAtDisplay?: string
      consentStatus?: string
      /** 기간제 동의서 유효기간 경과 — 「동의 만료」 */
      expired?: boolean
      /** 만료일 (예: 2027.10.31) — `expired`일 때만 */
      expiredAtDisplay?: string
      formResponseId?: number
      consentRecordId?: number
      filledDocumentId?: number
      filledDocumentAvailable?: boolean
      filledDocumentRevealEndpoint?: string
      consentType?: string
      /** 초상권 동의/부분 동의 라벨 전용 (`resolveConsentStatusDisplayLabel`) */
      allItemsAgreed?: boolean | null
    }
  /** 더블 행 우측 빈 절반(격자·하단 보더만 유지) */
  | { type: 'empty_half' }

export interface ConsentFieldSchema {
  label: string
  labelWidth: typeof CONSENT_LABEL_WIDTH
  fullRow?: boolean
  value: ConsentFieldValueSchema
}

export interface ConsentRowSchema {
  rowType: 'single' | 'double'
  fields: ConsentFieldSchema[]
  /** 하단 동의서 블록(지급조서·서약·행정·성범죄) 행. 없으면 상단 약관 블록. */
  block?: 'documents'
}

export type ConsentPresetSchema = Record<UserConsentAgreementPreset, ConsentRowSchema[]>

const TERMS_AND_PRIVACY_ROW: ConsentRowSchema = {
  rowType: 'double',
  fields: [
    {
      label: '서비스 이용약관',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: {
        type: 'remote_consent',
        agreed: true,
        agreedAtDisplay: SAMPLE_AGREED_AT_DISPLAY,
      },
    },
    {
      label: '개인정보 수집·이용 동의',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: {
        type: 'remote_consent',
        agreed: true,
        agreedAtDisplay: SAMPLE_AGREED_AT_DISPLAY,
      },
    },
  ],
}

const MARKETING_AND_PORTRAIT_ROW: ConsentRowSchema = {
  rowType: 'double',
  fields: [
    {
      label: '마케팅 제공 동의',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: {
        type: 'remote_consent',
        agreed: false,
        agreedAtDisplay: SAMPLE_AGREED_AT_DISPLAY,
      },
    },
    {
      label: '초상권 수집·이용 동의',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: {
        type: 'document',
        agreed: true,
        agreedAtDisplay: SAMPLE_AGREED_AT_DISPLAY,
      },
    },
  ],
}

/** 교사·교사 겸 강사 — 「교사 및 기관 정보 동의 | 마케팅」 (TEACHER_INFO_COLLECTION) */
const TEACHER_INFO_AND_MARKETING_ROW: ConsentRowSchema = {
  rowType: 'double',
  fields: [
    {
      label: '교사 및 기관 정보 동의',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: {
        type: 'remote_consent',
        agreed: true,
        agreedAtDisplay: SAMPLE_AGREED_AT_DISPLAY,
      },
    },
    {
      label: '마케팅 제공 동의',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: {
        type: 'remote_consent',
        agreed: false,
        agreedAtDisplay: SAMPLE_AGREED_AT_DISPLAY,
      },
    },
  ],
}

/** 교사·교사 겸 강사 — 초상권 한 행 전체 */
const PORTRAIT_FULL_ROW: ConsentRowSchema = {
  rowType: 'single',
  fields: [
    {
      label: '초상권 수집·이용 동의',
      labelWidth: CONSENT_LABEL_WIDTH,
      fullRow: true,
      value: {
        type: 'document',
        agreed: true,
        agreedAtDisplay: SAMPLE_AGREED_AT_DISPLAY,
      },
    },
  ],
}

const PAYMENT_AND_EDUCATOR_ROW: ConsentRowSchema = {
  rowType: 'double',
  block: 'documents',
  fields: [
    {
      label: '지급조서 사전 동의서',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: { type: 'document', agreed: false },
    },
    {
      label: '교육진행자 서약서',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: { type: 'document', agreed: false },
    },
  ],
}

const ADMIN_AND_CRIME_ROW: ConsentRowSchema = {
  rowType: 'double',
  block: 'documents',
  fields: [
    {
      label: '행정정보 공동이용 동의서',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: { type: 'document', agreed: false },
    },
    {
      label: '성범죄경력 조회 동의서',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: { type: 'document', agreed: false },
    },
  ],
}

const MARKETING_AND_MFA_ROW: ConsentRowSchema = {
  rowType: 'double',
  fields: [
    {
      label: '마케팅 제공 동의',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: {
        type: 'remote_consent',
        agreed: false,
        agreedAtDisplay: SAMPLE_AGREED_AT_DISPLAY,
      },
    },
    {
      label: '2단계 인증(MFA) 설정 동의',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: {
        type: 'remote_consent',
        agreed: true,
        agreedAtDisplay: SAMPLE_AGREED_AT_DISPLAY,
      },
    },
  ],
}

/** 관리자 회원 — 약관·동의 4항목(2열×2행) */
export const CONSENT_ROWS_ADMIN: ConsentRowSchema[] = [TERMS_AND_PRIVACY_ROW, MARKETING_AND_MFA_ROW]

/**
 * 교사(4427:48695)·교사 겸 강사(4427:48874) 시안
 * — 서비스|개인정보 / 교사 및 기관 정보|마케팅 / 초상권(전체 행) + 동의서 4종
 */
const CONSENT_ROWS_TEACHER: ConsentRowSchema[] = [
  TERMS_AND_PRIVACY_ROW,
  TEACHER_INFO_AND_MARKETING_ROW,
  PORTRAIT_FULL_ROW,
  PAYMENT_AND_EDUCATOR_ROW,
  ADMIN_AND_CRIME_ROW,
]

/**
 * 개인 회원 — 등록(`add-user-individual`)과 동일 8항목
 * (서비스·개인정보·마케팅·초상권 + 지급조서·교육진행자·행정정보·성범죄)
 */
const CONSENT_ROWS_INDIVIDUAL: ConsentRowSchema[] = [
  TERMS_AND_PRIVACY_ROW,
  MARKETING_AND_PORTRAIT_ROW,
  PAYMENT_AND_EDUCATOR_ROW,
  ADMIN_AND_CRIME_ROW,
]

/** 강사(순수·겸직) — 개인과 동일 8항목 */
const CONSENT_ROWS_INSTRUCTOR: ConsentRowSchema[] = CONSENT_ROWS_INDIVIDUAL

/** 관리자 상세·관리자 권한 신청 상세 — 시안: 동의 현황 안내 */
const ADMIN_CONSENT_CAPTION =
  '각 항목의 동의 현황과 해당 일시를 확인할 수 있으며, 미동의 항목은 일시가 표시되지 않습니다.'

/** 프리셋별 행·필드 구조 (표시 데이터와 분리) */
export const CONSENT_PRESET_SCHEMA: ConsentPresetSchema = {
  admin: CONSENT_ROWS_ADMIN,
  individual: CONSENT_ROWS_INDIVIDUAL,
  school_teacher: CONSENT_ROWS_TEACHER,
  instructor_dual: CONSENT_ROWS_TEACHER,
  instructor_only: CONSENT_ROWS_INSTRUCTOR,
}

export const CONSENT_ROWS_PERMISSION_INSTRUCTOR: ConsentRowSchema[] = CONSENT_ROWS_INSTRUCTOR

export const GUARDIAN_CONSENT_LABEL = '법정대리인 동의'

/**
 * 만 14세 미만 개인 회원(본인 가입) — 상단 약관 블록 3행 (Figma 0-3 일반 회원 상세_14세 미만).
 * 서비스·개인정보 / 법정대리인·마케팅 / 초상권. 법정대리인 동의는 조회 전용(`GUARDIAN_CONSENT`).
 */
export function withGuardianConsentRows(schema: ConsentRowSchema[]): ConsentRowSchema[] {
  const index = schema.indexOf(MARKETING_AND_PORTRAIT_ROW)
  if (index < 0) return schema
  const [marketing, portrait] = MARKETING_AND_PORTRAIT_ROW.fields
  const guardianAndMarketing: ConsentRowSchema = {
    rowType: 'double',
    fields: [
      {
        label: GUARDIAN_CONSENT_LABEL,
        labelWidth: CONSENT_LABEL_WIDTH,
        value: { type: 'remote_consent', agreed: false },
      },
      marketing,
    ],
  }
  const portraitOnly: ConsentRowSchema = { rowType: 'single', fields: [portrait] }
  return [...schema.slice(0, index), guardianAndMarketing, portraitOnly, ...schema.slice(index + 1)]
}

export interface ConsentRenderCtx {
  openDocumentForLabel: (
    label: string,
    document: Extract<ConsentFieldValueSchema, { type: 'document' }>
  ) => void
  canOpenSensitiveConsentDocument: boolean
  onWriteConsentDocument?: (label: string) => void
  editing?: boolean
  preset?: UserConsentAgreementPreset
  draftTermsAgreements?: TermsAgreementRequest[]
  onEditableConsentChange?: (label: string, agreed: boolean) => void
}

/** `동의 | 2026.01.15 09:15:42` 형태면 상태·구분자·날짜시간으로 나누어 날짜에 전용 스타일 적용 */
function ConsentValueDisplay({ value }: { value: ReactNode }) {
  if (typeof value !== 'string') return value
  const idx = value.indexOf('|')
  if (idx === -1) return value
  const status = value.slice(0, idx).trim()
  const datetime = value.slice(idx + 1).trim()
  if (!datetime) return value
  return (
    <span className="user-consent-agreement-section__value-inner">
      <span className="user-consent-agreement-section__value-status">{status}</span>
      <span className="user-consent-agreement-section__value-sep" aria-hidden>
        |
      </span>
      <span className="user-consent-agreement-section__value-datetime">{datetime}</span>
    </span>
  )
}

const PORTRAIT_CONSENT_FIELD_LABEL = '초상권 수집·이용 동의'

/**
 * 동의 상태 라벨 — 공통 `resolveConsentStatusDisplayLabel`.
 * 초상권은 termsType 별칭(`PORTRAIT` 등)이 와도 라벨 기준으로 `PORTRAIT_RIGHTS` 분기를 탄다(allItemsAgreed 판정).
 */
function resolveConsentFieldStatusLabel(
  value: {
    agreed: boolean
    consentStatus?: string
    consentType?: string
    allItemsAgreed?: boolean | null
    expired?: boolean
  },
  fieldLabel: string
): string {
  return resolveConsentStatusDisplayLabel({
    agreed: value.agreed,
    consentStatus: value.consentStatus,
    consentType:
      fieldLabel.trim() === PORTRAIT_CONSENT_FIELD_LABEL ? 'PORTRAIT_RIGHTS' : value.consentType,
    allItemsAgreed: value.allItemsAgreed,
    expired: value.expired,
    agreedLabel: '동의',
  })
}

/** 초상권·지급조서 등 동의서 제출형 항목 — 동의 시 보기+일시, 미동의 시 비활성 보기 */
function ConsentDocumentRow({
  agreed,
  agreedAtDisplay,
  statusLabel,
  expired = false,
  expiredAtDisplay,
  onOpenDocument,
}: {
  agreed: boolean
  /** 동의한 경우에만 표시 (예: 2026.01.15 09:15:42) */
  agreedAtDisplay?: string
  statusLabel: string
  /** 유효기간 경과 — 「동의 만료」 + 만료일 */
  expired?: boolean
  expiredAtDisplay?: string
  onOpenDocument?: () => void
}) {
  const open = onOpenDocument
  /** 기존 일시 자리 — 만료면 만료일, 아니면 동의 일시 */
  const datetimeDisplay = expired ? expiredAtDisplay : agreedAtDisplay

  return (
    <span className="user-consent-agreement-section__value-inner">
      <span className="user-consent-agreement-section__value-status">
        {statusLabel}
      </span>
      {/* 시안: 미동의는 상태 문구만 — 구분선·동의서 보기 없음 */}
      {agreed ? (
        <>
          <span className="user-consent-agreement-section__value-sep" aria-hidden>
            |
          </span>
          <CmsButton variant="secondary" size="h32" onClick={open} disabled={!open}>
            동의서 보기
          </CmsButton>
          {datetimeDisplay ? (
            <span className="user-consent-agreement-section__value-datetime">
              {datetimeDisplay}
            </span>
          ) : null}
        </>
      ) : expired && datetimeDisplay ? (
        <span className="user-consent-agreement-section__value-datetime">
          {datetimeDisplay}
        </span>
      ) : null}
    </span>
  )
}

function consentFieldContent(value: ReactNode) {
  return (
    <span className="user-consent-agreement-section__value-inner">
      <ConsentValueDisplay value={value} />
    </span>
  )
}

function resolveConsentFieldView(
  value: ConsentFieldValueSchema,
  ctx: ConsentRenderCtx,
  fieldLabel: string
): ReactNode {
  switch (value.type) {
    case 'remote_consent': {
      const status = resolveConsentFieldStatusLabel(value, fieldLabel)
      const text = value.agreedAtDisplay ? `${status} | ${value.agreedAtDisplay}` : status
      return consentFieldContent(text)
    }
    case 'document': {
      /**
       * 권한 설정 V1.2 — 열람 권한이 없어도 「동의서 보기」는 숨기지 않고, 누르면 접근 불가 안내.
       * 민감 동의서(성범죄·행정정보, 원칙 9)는 열람 가능 역할이 아니면 같은 안내(ctx.openDocumentForLabel에서 판정).
       */
      return (
        <ConsentDocumentRow
          agreed={value.agreed}
          agreedAtDisplay={value.agreedAtDisplay}
          statusLabel={resolveConsentFieldStatusLabel(value, fieldLabel)}
          expired={value.expired}
          expiredAtDisplay={value.expiredAtDisplay}
          onOpenDocument={
            value.agreed ? () => ctx.openDocumentForLabel(fieldLabel, value) : undefined
          }
        />
      )
    }
    case 'empty_half':
      return null
    default: {
      const _exhaustive: never = value
      return _exhaustive
    }
  }
}

function ConsentDocumentFieldEdit({ agreed, onWrite }: { agreed: boolean; onWrite: () => void }) {
  return (
    <span className="user-consent-agreement-section__document-edit">
      <span className="user-consent-agreement-section__document-edit-status">
        {agreed ? '동의' : '미동의'}
      </span>
      <DetailInfoForm.TdDivider />
      <CmsButton variant="secondary" size="h32" type="button" onClick={onWrite}>
        동의서 작성
      </CmsButton>
    </span>
  )
}

function resolveConsentFieldEdit(
  field: ConsentFieldSchema,
  ctx: ConsentRenderCtx
): ReactNode | undefined {
  if (!ctx.editing) return undefined
  if (field.value.type === 'empty_half') return undefined
  // 시안(회원 상세_수정): 마케팅·초상권은 수정 모드에서도 조회와 같은 글자 표시 — 관리자가 바꾸지 않는다
  if (CONSENT_VIEW_ONLY_IN_EDIT_LABELS.has(field.label)) return undefined

  const fallbackAgreed =
    field.value.type === 'remote_consent' || field.value.type === 'document'
      ? field.value.agreed
      : false

  // 필수 약관·관리자 회원 마케팅: 수정 불가 — 라디오 노출 + disabled (FE/BE 공통)
  if (
    isMemberBasicInfoImmutableConsentLabel(field.label) ||
    (ctx.preset === 'admin' && isAdminDetailLockedConsentLabel(field.label))
  ) {
    return (
      <CmsRadioGroup
        options={CONSENT_RADIO_OPTIONS}
        size="medium"
        value={fallbackAgreed ? 'agree' : 'disagree'}
        disabled
      />
    )
  }

  if (!ctx.onEditableConsentChange) return undefined
  if (!(field.label in CONSENT_LABEL_TO_EDITABLE_TERMS_TYPE)) return undefined

  const agreed = resolveEditableConsentAgreedFromDraft(
    ctx.draftTermsAgreements,
    field.label,
    fallbackAgreed
  )

  const documentEntry = resolveMemberConsentTemplateByLabel(field.label)
  if (documentEntry && ctx.onWriteConsentDocument) {
    return (
      <ConsentDocumentFieldEdit
        agreed={agreed}
        onWrite={() => ctx.onWriteConsentDocument?.(field.label)}
      />
    )
  }

  return (
    <CmsRadioGroup
      options={CONSENT_RADIO_OPTIONS}
      size="medium"
      value={agreed ? 'agree' : 'disagree'}
      onChange={e => {
        const next = e.target.value === 'agree'
        ctx.onEditableConsentChange?.(field.label, next)
      }}
    />
  )
}

export function renderConsentField(
  field: ConsentFieldSchema,
  ctx: ConsentRenderCtx,
  fieldKey: string
): ReactNode {
  if (field.value.type === 'empty_half') {
    const emptyStyle = {
      '--detail-info-label-w': `${field.labelWidth}px`,
    } as CSSProperties
    return (
      <div
        key={fieldKey}
        className="detail-info-form__field user-consent-agreement-section__field--empty-half"
        style={emptyStyle}
        aria-hidden
      >
        <div className="detail-info-form__field-content detail-info-form__field-content--view" />
      </div>
    )
  }

  const view = resolveConsentFieldView(field.value, ctx, field.label)
  const edit = resolveConsentFieldEdit(field, ctx)
  return (
    <DetailInfoForm.Field
      key={fieldKey}
      label={resolveConsentFieldDisplayLabel(field.label)}
      labelWidth={field.labelWidth}
      {...(field.fullRow ? { fullRow: true } : {})}
      view={view}
      {...(edit != null ? { edit } : {})}
    />
  )
}

export function renderConsentRow(
  row: ConsentRowSchema,
  ctx: ConsentRenderCtx,
  rowIndex: number
): ReactNode {
  return (
    <DetailInfoForm.Row key={`consent-row-${rowIndex}`} type={row.rowType}>
      {row.fields.map((field, fieldIndex) =>
        renderConsentField(field, ctx, `${rowIndex}-${fieldIndex}`)
      )}
    </DetailInfoForm.Row>
  )
}

type ActiveConsentView = {
  entry: MemberConsentTemplateEntry
  consentType?: string
  documentAgreed?: boolean
  filledDocumentAvailable?: boolean
  formResponseId?: number
  consentRecordId?: number
  filledDocumentId?: number
  filledDocumentRevealEndpoint?: string
}

type ActiveConsentWrite = {
  label: string
  entry: MemberConsentTemplateEntry
}

export function UserConsentAgreementSection({
  preset = 'individual',
  viewVariant = 'default',
  caption,
  onOpenAgreementDocument,
  remoteConsentRows,
  remoteConsentLoading = false,
  editing = false,
  draftTermsAgreements,
  onEditableConsentChange,
  consentWriteSnapshots,
  onConsentAgreementSnapshotSave,
  onConsentCrimeSnapshotSave,
  memberId,
  membersRemote = false,
  memberUser,
}: UserConsentAgreementSectionProps) {
  const [activeView, setActiveView] = useState<ActiveConsentView | null>(null)
  const [activeWrite, setActiveWrite] = useState<ActiveConsentWrite | null>(null)
  const sessionUser = useAuthStore(state => state.user)
  const canOpenSensitiveConsentDocument = canDownloadSensitiveConsentFile({
    roleCode: sessionUser?.roleCode,
  })
  /** Program Viewer는 「약관 및 동의서 확인」(PII_CONSENT_DOCUMENT·PRIVACY_RAW_READ) 권한이 없다 */
  const isConsentDocumentViewDenied = isCmsViewerAdminRole(sessionUser?.roleCode)

  const effectiveCaption = caption ?? (preset === 'admin' ? ADMIN_CONSENT_CAPTION : DEFAULT_CAPTION)

  const openDocumentForLabel = useCallback(
    (label: string, document: Extract<ConsentFieldValueSchema, { type: 'document' }>) => {
      if (
        isConsentDocumentViewDenied ||
        (isSensitiveConsentDocumentLabel(label) && !canOpenSensitiveConsentDocument)
      ) {
        showAdminAccessDeniedAlert()
        return
      }
      if (onOpenAgreementDocument) {
        onOpenAgreementDocument()
        return
      }
      const entry = resolveMemberConsentTemplateByLabel(label)
      if (entry) {
        setActiveView({
          entry,
          consentType:
            document.consentType?.trim() || CONSENT_LABEL_TO_EDITABLE_TERMS_TYPE[label.trim()],
          documentAgreed: document.agreed,
          filledDocumentAvailable: document.filledDocumentAvailable,
          formResponseId: document.formResponseId,
          consentRecordId: document.consentRecordId,
          filledDocumentId: document.filledDocumentId,
          filledDocumentRevealEndpoint: document.filledDocumentRevealEndpoint,
        })
      }
    },
    [canOpenSensitiveConsentDocument, isConsentDocumentViewDenied, onOpenAgreementDocument]
  )

  const openWriteForLabel = useCallback((label: string) => {
    const entry = resolveMemberConsentTemplateByLabel(label)
    if (entry) setActiveWrite({ label, entry })
  }, [])

  const closeWrite = useCallback(() => setActiveWrite(null), [])

  const handleWriteComplete = useCallback(() => {
    if (activeWrite) {
      /** 스냅샷 저장과 동일 틱에서 동의 반영 — 부모 draft ref로 스냅샷 유실 방지 */
      onEditableConsentChange?.(activeWrite.label, true)
    }
    setActiveWrite(null)
  }, [activeWrite, onEditableConsentChange])

  const baseSchema =
    viewVariant === 'permission_instructor'
      ? CONSENT_ROWS_PERMISSION_INSTRUCTOR
      : CONSENT_PRESET_SCHEMA[preset]
  const schema = remoteConsentRows ?? baseSchema
  const upperRows = schema.filter(row => row.block !== 'documents')
  const lowerRows = schema.filter(row => row.block === 'documents')
  const ctx: ConsentRenderCtx = {
    openDocumentForLabel,
    canOpenSensitiveConsentDocument,
    onWriteConsentDocument: editing ? openWriteForLabel : undefined,
    editing,
    preset,
    draftTermsAgreements,
    onEditableConsentChange,
  }
  const formMode = editing ? 'edit' : 'view'
  const writingCrime = activeWrite != null && isMemberCrimeConsentField(activeWrite.entry.fieldKey)

  return (
    <div className="user-consent-agreement-section">
      <Spin spinning={remoteConsentLoading}>
        <div className="user-consent-agreement-section__forms">
          <DetailInfoForm
            title="약관 및 동의"
            description={effectiveCaption}
            className="user-consent-agreement-section__form"
            mode={formMode}
          >
            {upperRows.map((row, rowIndex) => renderConsentRow(row, ctx, rowIndex))}
          </DetailInfoForm>
          {lowerRows.length > 0 ? (
            <DetailInfoForm
              title="약관 및 동의 상세"
              hideHeader
              className="user-consent-agreement-section__form"
              mode={formMode}
            >
              {lowerRows.map((row, rowIndex) =>
                renderConsentRow(row, ctx, rowIndex + upperRows.length)
              )}
            </DetailInfoForm>
          ) : null}
        </div>
      </Spin>
      {activeView != null ? (
        <MemberConsentDocumentViewModal
          open
          templateId={activeView.entry.templateId}
          modalTitle={activeView.entry.modalTitle}
          memberId={memberId}
          consentType={activeView.consentType}
          membersRemote={membersRemote}
          filledDocumentAvailable={activeView.filledDocumentAvailable}
          formResponseId={activeView.formResponseId}
          consentRecordId={activeView.consentRecordId}
          filledDocumentId={activeView.filledDocumentId}
          filledDocumentRevealEndpoint={activeView.filledDocumentRevealEndpoint}
          documentAgreed={activeView.documentAgreed}
          memberUser={memberUser}
          onClose={() => setActiveView(null)}
        />
      ) : null}
      {activeWrite != null && !writingCrime ? (
        <MemberConsentAgreementModal
          open
          templateId={activeWrite.entry.templateId}
          modalTitle={activeWrite.entry.modalTitle}
          memberName={memberUser?.name}
          savedSnapshot={consentWriteSnapshots?.agreementByFieldKey[activeWrite.entry.fieldKey]}
          onSnapshotSave={snapshot => onConsentAgreementSnapshotSave?.(activeWrite.label, snapshot)}
          onClose={closeWrite}
          onComplete={handleWriteComplete}
        />
      ) : null}
      {activeWrite != null && writingCrime ? (
        <MemberConsentCrimeModal
          open
          memberId={memberId}
          savedSnapshot={consentWriteSnapshots?.crimeByFieldKey[activeWrite.entry.fieldKey]}
          onSnapshotSave={snapshot => onConsentCrimeSnapshotSave?.(activeWrite.label, snapshot)}
          onClose={closeWrite}
          onComplete={handleWriteComplete}
        />
      ) : null}
    </div>
  )
}
