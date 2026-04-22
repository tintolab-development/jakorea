/**
 * 회원 상세 — 정보 제공 동의 (DetailInfoForm)
 */

import { type CSSProperties, type ReactNode } from 'react'
import type { User } from '@/types/user'
import { CmsButton } from '@/shared/ui/cms-button'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
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
}

const DEFAULT_CAPTION = '*미동의 시 프로그램 신청 및 활동에 제한이 있을 수 있습니다.'

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

const SAMPLE_CONSENT = '동의 | 2026.01.15 09:15:42'
const SAMPLE_AGREED_AT_DISPLAY = '2026.01.15 09:15:42'

const CONSENT_LABEL_WIDTH = 240 as const

/** 단일 필드 값 — 샘플 텍스트 또는 동의서 행 */
export type ConsentFieldValueSchema =
  | { type: 'sample_consent' }
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

const CONSENT_ROW_DOUBLE_SAMPLE: ConsentRowSchema = {
  rowType: 'double',
  fields: [
    {
      label: '개인정보 수집 동의',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: { type: 'sample_consent' },
    },
    {
      label: '마케팅 제공 동의',
      labelWidth: CONSENT_LABEL_WIDTH,
      value: { type: 'sample_consent' },
    },
  ],
}

const CONSENT_ROWS_INDIVIDUAL_LIKE: ConsentRowSchema[] = [
  CONSENT_ROW_DOUBLE_SAMPLE,
  {
    rowType: 'double',
    fields: [
      {
        label: '초상권 수집·이용 동의',
        labelWidth: CONSENT_LABEL_WIDTH,
        value: {
          type: 'document',
          agreed: true,
          agreedAtDisplay: SAMPLE_AGREED_AT_DISPLAY,
        },
      },
      {
        label: '지급조서 작성 동의',
        labelWidth: CONSENT_LABEL_WIDTH,
        value: { type: 'document', agreed: false },
      },
    ],
  },
]

const DOCUMENT_AGREED: ConsentFieldValueSchema = {
  type: 'document',
  agreed: true,
  agreedAtDisplay: SAMPLE_AGREED_AT_DISPLAY,
}

/** 프리셋별 행·필드 구조 (표시 데이터와 분리) */
export const CONSENT_PRESET_SCHEMA: ConsentPresetSchema = {
  admin: [CONSENT_ROW_DOUBLE_SAMPLE],
  individual: CONSENT_ROWS_INDIVIDUAL_LIKE,
  school_teacher: CONSENT_ROWS_INDIVIDUAL_LIKE,
  instructor_dual: [
    CONSENT_ROW_DOUBLE_SAMPLE,
    {
      rowType: 'single',
      fields: [
        {
          label: '지급조서 작성 동의',
          labelWidth: CONSENT_LABEL_WIDTH,
          fullRow: true,
          value: DOCUMENT_AGREED,
        },
      ],
    },
    {
      rowType: 'single',
      fields: [
        {
          label: '성범죄 경력조회 동의',
          labelWidth: CONSENT_LABEL_WIDTH,
          fullRow: true,
          value: DOCUMENT_AGREED,
        },
      ],
    },
    {
      rowType: 'single',
      fields: [
        {
          label: '행정정보 공동이용 사전 동의',
          labelWidth: CONSENT_LABEL_WIDTH,
          fullRow: true,
          value: DOCUMENT_AGREED,
        },
      ],
    },
    {
      rowType: 'single',
      fields: [
        {
          label: '교육진행자 동의 서약',
          labelWidth: CONSENT_LABEL_WIDTH,
          fullRow: true,
          value: DOCUMENT_AGREED,
        },
      ],
    },
  ],
  instructor_only: [
    CONSENT_ROW_DOUBLE_SAMPLE,
    {
      rowType: 'double',
      fields: [
        {
          label: '초상권 수집·이용 동의',
          labelWidth: CONSENT_LABEL_WIDTH,
          value: DOCUMENT_AGREED,
        },
        {
          label: '지급조서 작성 동의',
          labelWidth: CONSENT_LABEL_WIDTH,
          value: DOCUMENT_AGREED,
        },
      ],
    },
    {
      rowType: 'double',
      fields: [
        {
          label: '성범죄 경력조회 동의',
          labelWidth: CONSENT_LABEL_WIDTH,
          value: DOCUMENT_AGREED,
        },
        {
          label: '행정정보 공동이용 사전 동의',
          labelWidth: CONSENT_LABEL_WIDTH,
          value: DOCUMENT_AGREED,
        },
      ],
    },
    {
      rowType: 'double',
      fields: [
        {
          label: '교육진행자 동의 서약',
          labelWidth: CONSENT_LABEL_WIDTH,
          value: DOCUMENT_AGREED,
        },
        {
          label: '',
          labelWidth: CONSENT_LABEL_WIDTH,
          value: { type: 'empty_half' },
        },
      ],
    },
  ],
}

const CONSENT_ROWS_PERMISSION_INSTRUCTOR: ConsentRowSchema[] = [
  {
    rowType: 'double',
    fields: [
      {
        label: '개인정보 수집 동의',
        labelWidth: CONSENT_LABEL_WIDTH,
        value: DOCUMENT_AGREED,
      },
      {
        label: '마케팅 제공 동의',
        labelWidth: CONSENT_LABEL_WIDTH,
        value: DOCUMENT_AGREED,
      },
    ],
  },
  {
    rowType: 'double',
    fields: [
      {
        label: '초상권 수집·이용 동의',
        labelWidth: CONSENT_LABEL_WIDTH,
        value: DOCUMENT_AGREED,
      },
      {
        label: '지급조서 작성 동의',
        labelWidth: CONSENT_LABEL_WIDTH,
        value: DOCUMENT_AGREED,
      },
    ],
  },
  {
    rowType: 'double',
    fields: [
      {
        label: '성범죄 경력조회 동의',
        labelWidth: CONSENT_LABEL_WIDTH,
        value: DOCUMENT_AGREED,
      },
      {
        label: '행정정보 공동이용 사전 동의',
        labelWidth: CONSENT_LABEL_WIDTH,
        value: DOCUMENT_AGREED,
      },
    ],
  },
  {
    rowType: 'double',
    fields: [
      {
        label: '교육진행자 동의 서약',
        labelWidth: CONSENT_LABEL_WIDTH,
        value: DOCUMENT_AGREED,
      },
      {
        label: '',
        labelWidth: CONSENT_LABEL_WIDTH,
        value: { type: 'empty_half' },
      },
    ],
  },
]

export interface ConsentRenderCtx {
  openDocument: () => void
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

/** 초상권·지급조서 등 동의서 제출형 항목 — 동의 시 [동의서 보기]+일시, 미동의 시 비활성 [동의서 미제출] */
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
  const open = onOpenDocument ?? (() => window.alert('준비 중입니다.'))

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
          <CmsButton variant="secondary" size="medium" width={120} onClick={open}>
            동의서 보기
          </CmsButton>
          {agreedAtDisplay ? (
            <>
              <span className="user-consent-agreement-section__value-sep" aria-hidden>
                |
              </span>
              <span className="user-consent-agreement-section__value-datetime">
                {agreedAtDisplay}
              </span>
            </>
          ) : null}
        </>
      ) : (
        <CmsButton variant="default" size="medium" width={120} disabled>
          동의서 미제출
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

function resolveConsentFieldView(value: ConsentFieldValueSchema, ctx: ConsentRenderCtx): ReactNode {
  switch (value.type) {
    case 'sample_consent':
      return consentFieldContent(SAMPLE_CONSENT)
    case 'document':
      return (
        <ConsentDocumentRow
          agreed={value.agreed}
          agreedAtDisplay={value.agreedAtDisplay}
          onOpenDocument={value.agreed ? ctx.openDocument : undefined}
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

  const view = resolveConsentFieldView(field.value, ctx)
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
}: UserConsentAgreementSectionProps) {
  const effectiveCaption = caption ?? DEFAULT_CAPTION

  const doc = onOpenAgreementDocument ?? (() => window.alert('준비 중입니다.'))

  const schema =
    viewVariant === 'permission_instructor'
      ? CONSENT_ROWS_PERMISSION_INSTRUCTOR
      : CONSENT_PRESET_SCHEMA[preset]
  const ctx: ConsentRenderCtx = { openDocument: doc }

  return (
    <div className="user-consent-agreement-section">
      <DetailInfoForm
        title="정보 제공 동의"
        description={effectiveCaption}
        className="user-consent-agreement-section__form"
      >
        {schema.map((row, rowIndex) => renderConsentRow(row, ctx, rowIndex))}
      </DetailInfoForm>
    </div>
  )
}
