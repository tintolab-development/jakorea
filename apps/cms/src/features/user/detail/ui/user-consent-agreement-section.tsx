/**
 * 회원 상세 — 약관 및 동의 (DetailInfoForm)
 */

import { Spin } from 'antd'
import { useCallback, useState, type CSSProperties, type ReactNode } from 'react'
import type { User } from '@/types/user'
import { CmsButton } from '@/shared/ui/cms-button'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import {
  type MemberConsentMemberContext,
} from '@/features/user/shared/lib/build-member-portrait-consent-draft'
import {
  resolveMemberConsentTemplateByLabel,
  type MemberConsentTemplateEntry,
} from '@/features/user/shared/lib/member-consent-template-map'
import { MemberConsentDocumentViewModal } from '@/features/user/shared/ui/member-consent-document-view-modal'
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
  /** 동의서 보기 — 회원 정보 프리필(미지정 시 member 미전달) */
  memberConsentContext?: MemberConsentMemberContext
}

const DEFAULT_CAPTION = '*미동의 시 서비스 가입 및 프로그램 참여에 제한이 있을 수 있습니다.'

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

const CONSENT_LABEL_WIDTH = 240 as const

/** 단일 필드 값 — 동의 상태 또는 동의서 행 */
export type ConsentFieldValueSchema =
  | {
      type: 'remote_consent'
      agreed: boolean
      agreedAtDisplay?: string
    }
  | {
      type: 'document'
      agreed: boolean
      agreedAtDisplay?: string
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

const PAYMENT_AND_EDUCATOR_ROW: ConsentRowSchema = {
  rowType: 'double',
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
  fields: [
    {
      label: '행정정보 공동이용 사전동의서',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: { type: 'document', agreed: false },
    },
    {
      label: '성범죄 경력 조회 동의서',
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
export const CONSENT_ROWS_ADMIN: ConsentRowSchema[] = [
  TERMS_AND_PRIVACY_ROW,
  MARKETING_AND_MFA_ROW,
]

/** 회원 상세 약관·동의 — 스크린샷 기준 8항목(2열×4행) */
const CONSENT_ROWS_FULL: ConsentRowSchema[] = [
  TERMS_AND_PRIVACY_ROW,
  MARKETING_AND_PORTRAIT_ROW,
  PAYMENT_AND_EDUCATOR_ROW,
  ADMIN_AND_CRIME_ROW,
]

const ADMIN_CONSENT_CAPTION =
  '* 미동의 시 서비스 가입 및 관리자 활동에 제한이 있을 수 있습니다.'

/** 프리셋별 행·필드 구조 (표시 데이터와 분리) */
export const CONSENT_PRESET_SCHEMA: ConsentPresetSchema = {
  admin: CONSENT_ROWS_ADMIN,
  individual: CONSENT_ROWS_FULL,
  school_teacher: CONSENT_ROWS_FULL,
  instructor_dual: CONSENT_ROWS_FULL,
  instructor_only: CONSENT_ROWS_FULL,
}

export const CONSENT_ROWS_PERMISSION_INSTRUCTOR: ConsentRowSchema[] = CONSENT_ROWS_FULL

export interface ConsentRenderCtx {
  openDocumentForLabel: (label: string) => void
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

/** 초상권·지급조서 등 동의서 제출형 항목 — 동의 시 보기+일시, 미동의 시 비활성 보기 */
function ConsentDocumentRow({
  agreed,
  agreedAtDisplay,
  onOpenDocument,
}: {
  agreed: boolean
  /** 동의한 경우에만 표시 (예: 2026.01.15 09:15:42) */
  agreedAtDisplay?: string
  onOpenDocument?: () => void
}) {
  const open = onOpenDocument

  return (
    <span className="user-consent-agreement-section__value-inner">
      <span className="user-consent-agreement-section__value-status">
        {agreed ? '동의' : '미동의'}
      </span>
      <span className="user-consent-agreement-section__value-sep" aria-hidden>
        |
      </span>
      {agreed ? (
        <>
          <CmsButton variant="secondary" size="medium" width={120} onClick={open} disabled={!open}>
            동의서 보기
          </CmsButton>
          {agreedAtDisplay ? (
            <span className="user-consent-agreement-section__value-datetime">
              {agreedAtDisplay}
            </span>
          ) : null}
        </>
      ) : (
        <CmsButton variant="default" size="medium" width={120} disabled>
          동의서 보기
        </CmsButton>
      )}
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
      const status = value.agreed ? '동의' : '미동의'
      const text = value.agreedAtDisplay
        ? `${status} | ${value.agreedAtDisplay}`
        : status
      return consentFieldContent(text)
    }
    case 'document':
      return (
        <ConsentDocumentRow
          agreed={value.agreed}
          agreedAtDisplay={value.agreedAtDisplay}
          onOpenDocument={
            value.agreed ? () => ctx.openDocumentForLabel(fieldLabel) : undefined
          }
        />
      )
    case 'empty_half':
      return null
    default: {
      const _exhaustive: never = value
      return _exhaustive
    }
  }
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
  return (
    <DetailInfoForm.Field
      key={fieldKey}
      label={field.label}
      labelWidth={field.labelWidth}
      {...(field.fullRow ? { fullRow: true } : {})}
      view={view}
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

export function UserConsentAgreementSection({
  preset = 'individual',
  viewVariant = 'default',
  caption,
  onOpenAgreementDocument,
  remoteConsentRows,
  remoteConsentLoading = false,
  memberConsentContext,
}: UserConsentAgreementSectionProps) {
  const [activeViewEntry, setActiveViewEntry] = useState<MemberConsentTemplateEntry | null>(null)

  const effectiveCaption =
    caption ??
    (preset === 'admin' ? ADMIN_CONSENT_CAPTION : DEFAULT_CAPTION)

  const openDocumentForLabel = useCallback(
    (label: string) => {
      if (onOpenAgreementDocument) {
        onOpenAgreementDocument()
        return
      }
      const entry = resolveMemberConsentTemplateByLabel(label)
      if (entry) {
        setActiveViewEntry(entry)
      }
    },
    [onOpenAgreementDocument]
  )

  const baseSchema =
    viewVariant === 'permission_instructor'
      ? CONSENT_ROWS_PERMISSION_INSTRUCTOR
      : CONSENT_PRESET_SCHEMA[preset]
  const schema = remoteConsentRows ?? baseSchema
  const upperRows = schema.slice(0, 2)
  const lowerRows = schema.slice(2)
  const ctx: ConsentRenderCtx = { openDocumentForLabel }

  return (
    <div className="user-consent-agreement-section">
      <Spin spinning={remoteConsentLoading}>
        <div className="user-consent-agreement-section__forms">
          <DetailInfoForm
            title="약관 및 동의"
            description={effectiveCaption}
            className="user-consent-agreement-section__form"
          >
            {upperRows.map((row, rowIndex) => renderConsentRow(row, ctx, rowIndex))}
          </DetailInfoForm>
          {lowerRows.length > 0 ? (
            <DetailInfoForm
              title="약관 및 동의 상세"
              hideHeader
              className="user-consent-agreement-section__form"
            >
              {lowerRows.map((row, rowIndex) => renderConsentRow(row, ctx, rowIndex + 2))}
            </DetailInfoForm>
          ) : null}
        </div>
      </Spin>
      {activeViewEntry != null && memberConsentContext != null ? (
        <MemberConsentDocumentViewModal
          open
          templateId={activeViewEntry.templateId}
          modalTitle={activeViewEntry.modalTitle}
          memberContext={memberConsentContext}
          onClose={() => setActiveViewEntry(null)}
        />
      ) : null}
    </div>
  )
}
