/**
 * 일반 프로그램 — 기관 유형 참여자 신청 상세 (신청 정보 탭)
 * 스크린샷 시안: 기본 정보 / 안내 사항 / 진행 희망 교육 일정
 */

import type { ReactNode } from 'react'
import { Radio } from 'antd'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import type {
  ApplicantInstitutionDetailExtend,
  ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import { ApplicantAdminCommentSection } from './applicant-admin-comment-section'
import { ProgramApprovalStatusDetailValue } from './program-approval-status-detail-value'
import {
  formatCombinedClassDisplay,
  type ApplicantInstitutionEditDraft,
} from '@/features/program/general/lib/applicant-institution-detail-edit'
import type {
  SameSchoolGradeOption,
  TextbookSelectOption,
} from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { GeneralDetailSessionLine } from '@/features/program/shared/ui/program-detail/applicant-list/general-detail-session-line'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import './institution-basic-info.css'

function maskInstitutionTeacherInfoLine(text: string): string {
  return text
    .replace(/(Tel\s*:\s*)([\d-]+)/gi, (_, prefix: string, num: string) => {
      const cleaned = num.replace(/\s/g, '')
      const masked = MASKING_POLICY.phone(cleaned)
      return prefix + (masked || num)
    })
    .replace(/(^|\s|\|)(M\s*:\s*)([\d-]+)/g, (_, lead: string, prefix: string, num: string) => {
      const cleaned = num.replace(/\s/g, '')
      const masked = MASKING_POLICY.phone(cleaned)
      return lead + prefix + (masked || num)
    })
    .replace(
      /(E-mail\s*:\s*)(\S+)/gi,
      (_, prefix: string, em: string) => prefix + MASKING_POLICY.email(em)
    )
}

/** 라벨 문자열을 본문 + `(…)` 보조 문구 두 줄로 표시 (th 중앙 정렬 유지) */
function tableLabelWithParenthesisHint(label: string): ReactNode {
  const open = label.indexOf('(')
  if (open <= 0) return label
  const main = label.slice(0, open).trim()
  const hint = label.slice(open).trim()
  if (!hint.startsWith('(') || !hint.endsWith(')')) return label
  return (
    <>
      {main}
      <br />
      {hint}
    </>
  )
}

function maskSexOffenseCheckRequestLine(text: string): string {
  return text
    .replace(/\bID\s*:\s*(\S+)/gi, (_, id: string) => {
      if (id.length <= 1) return 'ID : *'
      return `ID : ${id[0]}***`
    })
    .replace(/\b검증번호\s*:\s*(\d+)/gi, (_, n: string) => {
      if (n.length <= 2) return '검증번호 : **'
      return `검증번호 : ${n[0]}${'*'.repeat(Math.max(0, n.length - 2))}${n[n.length - 1]}`
    })
}

export interface ApplicantGeneralInstitutionBasicInfoProps {
  institution: ApplicantSchoolRow
  detail?: ApplicantInstitutionDetailExtend
  maskSensitive?: boolean
  mode?: 'view' | 'edit'
  draft?: ApplicantInstitutionEditDraft
  onDraftChange?: (partial: Partial<ApplicantInstitutionEditDraft>) => void
  textbookOptions?: TextbookSelectOption[]
  sameSchoolGradeOptions?: SameSchoolGradeOption[]
  canApplyCombinedClass?: boolean
  validationErrors?: Record<string, string>
  onResendNotificationClick?: () => void
}

function TableRowTwoCols({
  label1,
  value1,
  label2,
  value2,
}: {
  label1: string
  value1: ReactNode
  label2: string
  value2: ReactNode
}) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label1}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        {value1}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label2}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        {value2}
      </td>
    </tr>
  )
}

function TableRowFullWidth({ label, value, multiline }: { label: string; value: ReactNode; multiline?: boolean }) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label}
      </td>
      <td
        colSpan={3}
        className={`applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value${
          multiline ? ' applicant-institution-basic-info__cell--value--multiline' : ''
        }`}
      >
        {value}
      </td>
    </tr>
  )
}

function TableRowSingleCol({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label}
      </td>
      <td
        colSpan={3}
        className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value"
      >
        {value}
      </td>
    </tr>
  )
}

function ProgramApprovalStatusValue({
  institution,
  onResendNotificationClick,
}: {
  institution: ApplicantSchoolRow
  onResendNotificationClick?: () => void
}) {
  return (
    <ProgramApprovalStatusDetailValue
      status={institution.approvalStatus}
      participationRejectionReason={institution.participationRejectionReason}
      approvalNotificationSentAt={institution.approvalNotificationSentAt}
      onResendNotificationClick={onResendNotificationClick}
    />
  )
}

function buildSexOffenseRequestCell(
  detail: ApplicantInstitutionDetailExtend | undefined,
  shouldMask: boolean
): ReactNode {
  const raw = detail?.sexOffenseCheckRequest?.trim()
  if (!raw) return '-'
  const text = shouldMask ? maskSexOffenseCheckRequestLine(raw) : raw
  const parts = text
    .split(' | ')
    .map(s => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return '-'
  return (
    <ProgramDetailTdSegmentWrap>
      {parts.length === 1 ? parts[0] : withProgramDetailTdDivider(parts)}
    </ProgramDetailTdSegmentWrap>
  )
}

function buildTeacherInfoCell(
  institution: ApplicantSchoolRow,
  detail: ApplicantInstitutionDetailExtend | undefined,
  shouldMask: boolean
): ReactNode {
  const raw = detail?.teacherInfo?.trim()
  if (raw) {
    const text = shouldMask ? maskInstitutionTeacherInfoLine(raw) : raw
    const parts = text
      .split(' | ')
      .map(s => s.trim())
      .filter(Boolean)
    if (parts.length === 0) return '-'
    return (
      <ProgramDetailTdSegmentWrap>
        {parts.length === 1 ? parts[0] : withProgramDetailTdDivider(parts)}
      </ProgramDetailTdSegmentWrap>
    )
  }
  const parts = [institution.teacherName, institution.contact].filter(Boolean) as string[]
  if (parts.length === 0) return '-'
  if (parts.length === 1) return parts[0]
  const name = parts[0]!
  const phone = parts[1]!
  const phoneShown = shouldMask ? MASKING_POLICY.phone(phone.replace(/\s/g, '')) || phone : phone
  return (
    <ProgramDetailTdSegmentWrap>
      {withProgramDetailTdDivider([name, phoneShown])}
    </ProgramDetailTdSegmentWrap>
  )
}

function PreferredScheduleRow({ rank, session }: { rank: number; session: ParticipatingSchoolSession }) {
  const label = `${rank}지망`
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        <GeneralDetailSessionLine session={session} />
      </td>
    </tr>
  )
}

function buildCombinedClassViewValue(detail?: ApplicantInstitutionDetailExtend): ReactNode {
  const display = formatCombinedClassDisplay(detail)
  if (display === '미신청') return display
  const parts = display.split(' | ').map(part => part.trim()).filter(Boolean)
  if (parts.length <= 1) return parts[0] ?? display
  return (
    <ProgramDetailTdSegmentWrap>
      {withProgramDetailTdDivider(parts)}
    </ProgramDetailTdSegmentWrap>
  )
}

function CombinedClassEditCell({
  draft,
  onDraftChange,
  sameSchoolGradeOptions,
  canApplyCombinedClass,
  validationErrors,
}: {
  draft: ApplicantInstitutionEditDraft
  onDraftChange: (partial: Partial<ApplicantInstitutionEditDraft>) => void
  sameSchoolGradeOptions: SameSchoolGradeOption[]
  canApplyCombinedClass: boolean
  validationErrors?: Record<string, string>
}) {
  const isApplied = draft.combinedClassApplication === '신청'

  return (
    <div className="institution-basic-info__combined-class-edit">
      <Radio.Group
        className="institution-basic-info__combined-class-radios"
        value={draft.combinedClassApplication}
        onChange={event => {
          const next = event.target.value as ApplicantInstitutionEditDraft['combinedClassApplication']
          onDraftChange({
            combinedClassApplication: next,
            combinedClassPartnerApplicantIds:
              next === '신청' ? draft.combinedClassPartnerApplicantIds : [],
          })
        }}
      >
        <Radio value="신청" disabled={!canApplyCombinedClass}>
          신청
        </Radio>
        <Radio value="미신청">미신청</Radio>
      </Radio.Group>
      <CmsSelect
        className="institution-basic-info__combined-class-select"
        inputSize="large"
        mode="multiple"
        disabled={!isApplied}
        placeholder={isApplied ? '합반 대상 학년 선택' : '해당 없음'}
        value={isApplied ? draft.combinedClassPartnerApplicantIds : []}
        options={sameSchoolGradeOptions.map(option => ({
          label: option.label,
          value: option.value,
        }))}
        onChange={value => {
          onDraftChange({
            combinedClassPartnerApplicantIds: Array.isArray(value) ? value.map(String) : [],
          })
        }}
      />
      {validationErrors?.combinedClassPartnerApplicantIds ? (
        <span className="institution-basic-info__field-error">
          {validationErrors.combinedClassPartnerApplicantIds}
        </span>
      ) : null}
    </div>
  )
}

export function ApplicantGeneralInstitutionBasicInfo({
  institution,
  detail,
  maskSensitive = true,
  mode = 'view',
  draft,
  onDraftChange,
  textbookOptions = [],
  sameSchoolGradeOptions = [],
  canApplyCombinedClass = false,
  validationErrors,
  onResendNotificationClick,
}: ApplicantGeneralInstitutionBasicInfoProps) {
  const isEditMode = mode === 'edit' && draft != null && onDraftChange != null
  const shouldMask = maskSensitive && institution.approvalStatus !== 'approved'

  const classAndCount: ReactNode =
    institution.classCount != null && institution.studentCount != null ? (
      <ProgramDetailTdSegmentWrap>
        {withProgramDetailTdDivider([
          `${institution.classCount}개 학급`,
          `총 ${institution.studentCount}명`,
        ])}
      </ProgramDetailTdSegmentWrap>
    ) : (
      '-'
    )

  const teacherInfo = buildTeacherInfoCell(institution, detail, shouldMask)
  const sexOffenseRequestDisplay = buildSexOffenseRequestCell(detail, shouldMask)
  const sessions = institution.sessions ?? []

  const textbookViewValue = detail?.textbookName ?? '-'
  const combinedClassViewValue = buildCombinedClassViewValue(detail)

  const colgroup = (
    <colgroup>
      <col style={{ width: '200px' }} />
      <col />
      <col style={{ width: '200px' }} />
      <col />
    </colgroup>
  )

  const textbookEditValue =
    isEditMode && draft && onDraftChange ? (
      <div className="institution-basic-info__field-stack">
        <CmsSelect
          className="institution-basic-info__full-width-control"
          inputSize="large"
          placeholder="교재명 선택"
          value={draft.textbookId || undefined}
          options={textbookOptions.map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={value => {
            const selected = textbookOptions.find(option => option.value === value)
            onDraftChange({
              textbookId: selected?.value ?? String(value ?? ''),
              textbookName: selected?.textbookName ?? '',
            })
          }}
        />
        {validationErrors?.textbookId || validationErrors?.textbookName ? (
          <span className="institution-basic-info__field-error">
            {validationErrors.textbookId ?? validationErrors.textbookName}
          </span>
        ) : null}
      </div>
    ) : (
      textbookViewValue
    )

  const combinedClassEditValue =
    isEditMode && draft && onDraftChange ? (
      <CombinedClassEditCell
        draft={draft}
        onDraftChange={onDraftChange}
        sameSchoolGradeOptions={sameSchoolGradeOptions}
        canApplyCombinedClass={canApplyCombinedClass}
        validationErrors={validationErrors}
      />
    ) : (
      combinedClassViewValue
    )

  const showAdminComment = institution.approvalStatus === 'approved'

  return (
    <div className="institution-basic-info applicant-institution-basic-info">
      {validationErrors?.form ? (
        <div className="institution-basic-info__form-error">{validationErrors.form}</div>
      ) : null}
      {showAdminComment ? (
        <ApplicantAdminCommentSection
          adminComment={isEditMode && draft ? draft.adminComment : institution.adminComment}
          mode={isEditMode ? 'edit' : 'view'}
          draftValue={draft?.adminComment ?? ''}
          onDraftChange={
            isEditMode && onDraftChange
              ? value => onDraftChange({ adminComment: value })
              : undefined
          }
          validationError={validationErrors?.adminComment}
        />
      ) : null}
      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">기본 정보</h3>
        <div className="applicant-institution-basic-info__basic-info-fields">
          <div className="applicant-institution-basic-info__table-wrap">
            <table className="applicant-institution-basic-info__table">
              {colgroup}
              <tbody>
                <TableRowFullWidth
                  label="프로그램 승인 현황"
                  value={<ProgramApprovalStatusValue institution={institution} onResendNotificationClick={onResendNotificationClick} />}
                />
                <TableRowTwoCols
                  label1="교재명"
                  value1={textbookEditValue}
                  label2="합반 신청 여부"
                  value2={combinedClassEditValue}
                />
              </tbody>
            </table>
          </div>
          <div className="applicant-institution-basic-info__table-wrap">
            <table className="applicant-institution-basic-info__table">
              {colgroup}
              <tbody>
                <TableRowTwoCols
                  label1="신청 기관명"
                  value1={institution.schoolName ?? '-'}
                  label2="신청 학년"
                  value2={institution.educationGrade ?? '-'}
                />
                <TableRowTwoCols
                  label1="기관 소재지"
                  value1={institution.region ?? '-'}
                  label2="상세 주소"
                  value2={detail?.addressDetail ?? '-'}
                />
                <TableRowTwoCols
                  label1="신청 학급 수 및 총 인원"
                  value1={classAndCount}
                  label2="희망 교육 형태"
                  value2={detail?.educationType ?? '-'}
                />
                <TableRowFullWidth label="담당 교사 정보" value={teacherInfo} />
                <TableRowFullWidth
                  label="신청 사유"
                  value={detail?.applicationReason ?? '-'}
                  multiline
                />
                <TableRowFullWidth
                  label="기타 요청사항"
                  value={detail?.otherRequests ?? '-'}
                  multiline
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">안내 사항</h3>
        <div className="applicant-institution-basic-info__table-wrap">
          <table className="applicant-institution-basic-info__table">
            {colgroup}
            <tbody>
              <TableRowSingleCol
                label="강의 공간 내 컴퓨터 여부"
                value={detail?.computerInSpace ?? '-'}
              />
              <TableRowSingleCol
                label="대기 장소 안내"
                value={detail?.waitingPlaceGuide ?? detail?.waitingRoom ?? '-'}
              />
              <TableRowSingleCol
                label="식사 가능 여부 및 안내"
                value={detail?.mealInfo ?? '-'}
              />
              <TableRowSingleCol
                label={tableLabelWithParenthesisHint('기타 특이사항 (주차, 전달사항 등)')}
                value={detail?.otherSpecialNotes ?? detail?.parkingInfo ?? '-'}
              />
              <TableRowSingleCol
                label="성범죄 경력 조회서 요청"
                value={sexOffenseRequestDisplay}
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">진행 희망 교육 일정</h3>
        <div className="applicant-institution-basic-info__table-wrap">
          <table className="applicant-institution-basic-info__table">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value"
                  >
                    등록된 교육 일정이 없습니다.
                  </td>
                </tr>
              ) : (
                sessions.map((session, index) => (
                  <PreferredScheduleRow key={session.round} rank={index + 1} session={session} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
