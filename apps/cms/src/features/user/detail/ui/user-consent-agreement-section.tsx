/**
 * 회원 상세 — 정보 제공 동의 (DetailInfoForm)
 */

import { type ReactNode } from 'react'
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

export function UserConsentAgreementSection({
  preset = 'individual',
  caption,
  onOpenAgreementDocument,
}: UserConsentAgreementSectionProps) {
  const effectiveCaption = caption ?? DEFAULT_CAPTION

  const doc = onOpenAgreementDocument ?? (() => window.alert('준비 중입니다.'))

  return (
    <div className="user-consent-agreement-section">
      <DetailInfoForm
        title="정보 제공 동의"
        description={effectiveCaption}
        className="user-consent-agreement-section__form"
      >
        {preset === 'admin' || preset === 'individual' || preset === 'school_teacher' ? (
          <>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="개인정보 수집 동의"
                view={consentFieldContent(SAMPLE_CONSENT)}
              />
              <DetailInfoForm.Field
                label="마케팅 제공 동의"
                view={consentFieldContent(SAMPLE_CONSENT)}
              />
            </DetailInfoForm.Row>
            {(preset === 'individual' || preset === 'school_teacher') && (
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="초상권 수집·이용 동의"
                  view={
                    <ConsentDocumentRow
                      agreed
                      agreedAtDisplay={SAMPLE_AGREED_AT_DISPLAY}
                      onOpenDocument={doc}
                    />
                  }
                />
                <DetailInfoForm.Field
                  label="지급조서 작성 동의"
                  view={<ConsentDocumentRow agreed={false} />}
                />
              </DetailInfoForm.Row>
            )}
          </>
        ) : null}

        {preset === 'instructor_dual' ? (
          <>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="개인정보 수집 동의"
                labelWidth={240}
                view={consentFieldContent(SAMPLE_CONSENT)}
              />
              <DetailInfoForm.Field
                label="마케팅 제공 동의"
                labelWidth={240}
                view={consentFieldContent(SAMPLE_CONSENT)}
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="지급조서 작성 동의"
                labelWidth={240}
                fullRow
                view={
                  <ConsentDocumentRow
                    agreed
                    agreedAtDisplay={SAMPLE_AGREED_AT_DISPLAY}
                    onOpenDocument={doc}
                  />
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="성범죄 경력조회 동의"
                labelWidth={240}
                fullRow
                view={
                  <ConsentDocumentRow
                    agreed
                    agreedAtDisplay={SAMPLE_AGREED_AT_DISPLAY}
                    onOpenDocument={doc}
                  />
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="행정정보 공동이용 사전 동의"
                labelWidth={240}
                fullRow
                view={
                  <ConsentDocumentRow
                    agreed
                    agreedAtDisplay={SAMPLE_AGREED_AT_DISPLAY}
                    onOpenDocument={doc}
                  />
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="교육진행자 동의 서약"
                labelWidth={240}
                fullRow
                view={
                  <ConsentDocumentRow
                    agreed
                    agreedAtDisplay={SAMPLE_AGREED_AT_DISPLAY}
                    onOpenDocument={doc}
                  />
                }
              />
            </DetailInfoForm.Row>
          </>
        ) : null}

        {preset === 'instructor_only' ? (
          <>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="개인정보 수집 동의"
                view={consentFieldContent(SAMPLE_CONSENT)}
              />
              <DetailInfoForm.Field
                label="마케팅 제공 동의"
                view={consentFieldContent(SAMPLE_CONSENT)}
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="초상권 동의"
                fullRow
                view={
                  <ConsentDocumentRow
                    agreed
                    agreedAtDisplay={SAMPLE_AGREED_AT_DISPLAY}
                    onOpenDocument={doc}
                  />
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="지급조서 작성 동의"
                view={
                  <ConsentDocumentRow
                    agreed
                    agreedAtDisplay={SAMPLE_AGREED_AT_DISPLAY}
                    onOpenDocument={doc}
                  />
                }
              />
              <DetailInfoForm.Field
                label="교육진행자 동의 서약"
                view={
                  <ConsentDocumentRow
                    agreed
                    agreedAtDisplay={SAMPLE_AGREED_AT_DISPLAY}
                    onOpenDocument={doc}
                  />
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="성범죄 경력조회 동의"
                view={
                  <ConsentDocumentRow
                    agreed
                    agreedAtDisplay={SAMPLE_AGREED_AT_DISPLAY}
                    onOpenDocument={doc}
                  />
                }
              />
              <DetailInfoForm.Field
                label="행정정보 공동이용 사전 동의"
                view={
                  <ConsentDocumentRow
                    agreed
                    agreedAtDisplay={SAMPLE_AGREED_AT_DISPLAY}
                    onOpenDocument={doc}
                  />
                }
              />
            </DetailInfoForm.Row>
          </>
        ) : null}
      </DetailInfoForm>
    </div>
  )
}
