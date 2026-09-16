/**
 * 일반 프로그램 — 기관 유형 참여자 신청 상세 (신청 정보 탭)
 * 스크린샷 시안: 기본 정보 / 안내 사항 / 진행 희망 교육 일정
 */

import type { ReactNode } from 'react'
import type {
  ApplicantInstitutionDetailExtend,
  ApplicantSchoolRow,
} from '@/features/program/shared/model/applicant-institution'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { ApplicantAdminCommentSection } from './applicant-admin-comment-section'
import { ProgramApprovalStatusDetailValue } from './program-approval-status-detail-value'
import {
  formatCombinedClassDisplay,
  type ApplicantInstitutionEditDraft,
} from '@/features/program/general/lib/applicant-institution-detail-edit'
import { isCombinedClassProgramEligible } from '@/features/program/general/lib/combined-class-edit-policy'
import { InstitutionCombinedClassEditCell } from './institution-combined-class-edit-cell'
import type {
  SameSchoolGradeOption,
  TextbookSelectOption,
} from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import type { InstitutionAffiliatedTeacherOption } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  InstitutionAddressDetailEdit,
  InstitutionClassAndStudentCountEdit,
  InstitutionEducationFormatRadios,
  InstitutionGradeSelectEdit,
  InstitutionReadonlyInput,
  InstitutionTeacherEdit,
} from './institution-application-edit-fields'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { GeneralDetailSessionLine } from '@/features/program/shared/ui/program-detail/applicant-list/general-detail-session-line'
import { resolveInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import {
  formatInstitutionApplicationScheduleRowLabel,
  shouldShowInstitutionApplicationDetailScheduleSection,
} from '@/features/program/general/lib/institution-application-session-display'
import type { Program } from '@/types/domain'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import {
  INSTITUTION_APPLICATION_INFO_COLGROUP,
  INSTITUTION_APPLICATION_SCHEDULE_COLGROUP,
  InstitutionApplicationTableRowFullWidth,
  InstitutionApplicationTableRowSingleCol,
  InstitutionApplicationTableRowTwoCols,
  institutionApplicationTableLabelWithParenthesisHint,
  INSTITUTION_OTHER_NOTES_TABLE_LABEL,
} from './institution-application-info-table'
import './institution-basic-info.css'

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
  textbookDisplayLabel?: string
  isTextbookCatalogLoading?: boolean
  sameSchoolGradeOptions?: SameSchoolGradeOption[]
  classCountOptions?: Array<{ value: string; label: string }>
  teacherOptions?: InstitutionAffiliatedTeacherOption[]
  isTeacherOptionsLoading?: boolean
  showEducationFormatField?: boolean
  isCombinedClassProgramEligible?: boolean
  isCombinedClassApplyRadioDisabled?: boolean
  combinedClassReadOnly?: boolean
  /** 진행된 교육이 있을 때 합반 반영 시점 안내 */
  showCombinedClassScheduleNotice?: boolean
  hideCombinedClass?: boolean
  validationErrors?: Record<string, string>
  onResendNotificationClick?: () => void
  program?: Program | null
  /** 정보 수정과 분리 — 코멘트 작성 버튼으로만 편집 */
  isAdminCommentEditing?: boolean
  adminCommentDraft?: string
  onAdminCommentDraftChange?: (value: string) => void
  adminCommentError?: string
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
  detail: ApplicantInstitutionDetailExtend | undefined
): ReactNode {
  const raw = detail?.teacherInfo?.trim()
  if (raw) {
    const parts = raw
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

  const name = institution.teacherName?.trim()
  const contact = institution.contact?.trim()
  const segments: string[] = []
  if (name) segments.push(`담당 교사 : ${name}`)
  if (contact) {
    // contact가 이미 Tel/M/E-mail 조합이면 그대로, 아니면 Tel로 표기
    if (/Tel\s*:|M\s*:|E-mail\s*:/i.test(contact)) {
      segments.push(
        ...contact
          .split('|')
          .map(s => s.trim())
          .filter(Boolean)
      )
    } else {
      segments.push(`Tel : ${contact}`)
    }
  }
  if (segments.length === 0) return '-'
  if (segments.length === 1) return segments[0]
  return (
    <ProgramDetailTdSegmentWrap>{withProgramDetailTdDivider(segments)}</ProgramDetailTdSegmentWrap>
  )
}

function PreferredScheduleRow({
  rank,
  session,
  bridge,
}: {
  rank: number
  session: ParticipatingSchoolSession
  bridge?: ReturnType<typeof resolveInstitutionApplicationProgramBridge> | null
}) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {formatInstitutionApplicationScheduleRowLabel(rank, bridge)}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        <GeneralDetailSessionLine session={session} bridge={bridge} />
      </td>
    </tr>
  )
}

function buildCombinedClassViewValue(
  detail?: ApplicantInstitutionDetailExtend,
  programEligible = true
): ReactNode {
  if (!programEligible) return '해당 없음'
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

export function ApplicantGeneralInstitutionBasicInfo({
  institution,
  detail,
  maskSensitive = true,
  mode = 'view',
  draft,
  onDraftChange,
  textbookOptions = [],
  textbookDisplayLabel,
  isTextbookCatalogLoading = false,
  sameSchoolGradeOptions = [],
  classCountOptions = [],
  teacherOptions = [],
  isTeacherOptionsLoading = false,
  showEducationFormatField = false,
  isCombinedClassProgramEligible: isCombinedClassProgramEligibleProp,
  isCombinedClassApplyRadioDisabled = true,
  combinedClassReadOnly = false,
  showCombinedClassScheduleNotice = false,
  hideCombinedClass = false,
  validationErrors,
  onResendNotificationClick,
  program = null,
  isAdminCommentEditing = false,
  adminCommentDraft = '',
  onAdminCommentDraftChange,
  adminCommentError,
}: ApplicantGeneralInstitutionBasicInfoProps) {
  const isEditMode = mode === 'edit' && draft != null && onDraftChange != null
  const shouldMask = maskSensitive && institution.approvalStatus !== 'approved'
  const institutionApplicationBridge = program
    ? resolveInstitutionApplicationProgramBridge(program)
    : null
  const combinedClassProgramEligible =
    isCombinedClassProgramEligibleProp ?? isCombinedClassProgramEligible(program)
  const showScheduleSection = shouldShowInstitutionApplicationDetailScheduleSection(
    institutionApplicationBridge,
    institution
  )
  /** 승인 완료 시에만 교재명·합반 신청 노출 (스펙·스크린샷) */
  const showTextbookAndCombinedClass = institution.approvalStatus === 'approved'
  const classAndCount: ReactNode =
    isEditMode && draft && onDraftChange ? (
      <InstitutionClassAndStudentCountEdit
        classCount={draft.classCount}
        studentCount={draft.studentCount}
        classCountOptions={classCountOptions}
        onChange={patch => onDraftChange(patch)}
        errors={{
          classCount: validationErrors?.classCount,
          studentCount: validationErrors?.studentCount,
        }}
      />
    ) : institution.classCount != null && institution.studentCount != null ? (
      <ProgramDetailTdSegmentWrap>
        {withProgramDetailTdDivider([
          `${institution.classCount}개 학급`,
          `총 ${institution.studentCount}명`,
        ])}
      </ProgramDetailTdSegmentWrap>
    ) : (
      '-'
    )

  const teacherInfo =
    isEditMode && draft && onDraftChange ? (
      <InstitutionTeacherEdit
        name={draft.teacherName}
        phone={draft.teacherPhone}
        mobile={draft.teacherMobile}
        email={draft.teacherEmail}
        teacherOptions={teacherOptions}
        isTeacherOptionsLoading={isTeacherOptionsLoading}
        onChange={patch => onDraftChange(patch)}
        errors={{
          teacherName: validationErrors?.teacherName,
          teacherPhone: validationErrors?.teacherPhone,
          teacherMobile: validationErrors?.teacherMobile,
          teacherEmail: validationErrors?.teacherEmail,
        }}
      />
    ) : (
      buildTeacherInfoCell(institution, detail)
    )
  const sexOffenseRequestDisplay = buildSexOffenseRequestCell(detail, shouldMask)
  const sessions = institution.sessions ?? []

  const textbookViewValue =
    textbookDisplayLabel?.trim() ||
    detail?.textbookName?.trim() ||
    (hideCombinedClass ? '미정' : '-')
  const combinedClassViewValue = buildCombinedClassViewValue(detail, combinedClassProgramEligible)

  const addressDetailValue =
    isEditMode && draft && onDraftChange ? (
      <InstitutionAddressDetailEdit
        value={draft.addressDetail}
        onChange={value => onDraftChange({ addressDetail: value })}
        error={validationErrors?.addressDetail}
      />
    ) : (
      detail?.addressDetail ?? '-'
    )

  const educationTypeValue =
    showEducationFormatField && isEditMode && draft && onDraftChange ? (
      <InstitutionEducationFormatRadios
        value={draft.educationFormat}
        onChange={value => onDraftChange({ educationFormat: value })}
        error={validationErrors?.educationFormat}
      />
    ) : showEducationFormatField ? (
      detail?.educationType ?? '-'
    ) : (
      '-'
    )

  const applicationReasonValue = detail?.applicationReason ?? '-'
  const otherRequestsValue = detail?.otherRequests ?? '-'

  const schoolNameValue =
    isEditMode && draft ? (
      <InstitutionReadonlyInput value={institution.schoolName ?? ''} />
    ) : (
      institution.schoolName ?? '-'
    )

  const educationGradeValue =
    isEditMode && draft && onDraftChange ? (
      <InstitutionGradeSelectEdit
        value={draft.educationGrade}
        onChange={value => onDraftChange({ educationGrade: value })}
        error={validationErrors?.educationGrade}
      />
    ) : (
      institution.educationGrade ?? '-'
    )

  const regionValue =
    isEditMode && draft ? (
      <InstitutionReadonlyInput value={institution.region ?? ''} />
    ) : (
      institution.region ?? '-'
    )

  const computerValue = detail?.computerInSpace ?? '-'
  const waitingPlaceValue = detail?.waitingPlaceGuide ?? detail?.waitingRoom ?? '-'
  const mealValue = detail?.mealInfo ?? '-'
  const otherNotesValue = detail?.otherSpecialNotes ?? detail?.parkingInfo ?? '-'

  const textbookEditValue =
    isEditMode && draft && onDraftChange ? (
      <div className="institution-basic-info__field-stack">
        <CmsSelect
          className="institution-basic-info__full-width-control"
          inputSize="large"
          placeholder={isTextbookCatalogLoading ? '교재 목록 불러오는 중…' : '교재명 선택'}
          loading={isTextbookCatalogLoading}
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
      <InstitutionCombinedClassEditCell
        combinedClassApplication={draft.combinedClassApplication}
        partnerIds={draft.combinedClassPartnerApplicantIds}
        onCombinedClassApplicationChange={next =>
          onDraftChange({
            combinedClassApplication: next,
            combinedClassPartnerApplicantIds:
              next === '신청' ? draft.combinedClassPartnerApplicantIds : [],
          })
        }
        onPartnerIdsChange={partnerIds =>
          onDraftChange({ combinedClassPartnerApplicantIds: partnerIds })
        }
        sameSchoolGradeOptions={sameSchoolGradeOptions}
        isProgramEligible={combinedClassProgramEligible}
        isApplyRadioDisabled={isCombinedClassApplyRadioDisabled}
        readOnly={combinedClassReadOnly}
        showEffectiveFromNextScheduleNotice={showCombinedClassScheduleNotice}
        validationError={validationErrors?.combinedClassPartnerApplicantIds}
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
          adminComment={institution.adminComment}
          mode={isAdminCommentEditing ? 'edit' : 'view'}
          draftValue={adminCommentDraft}
          onDraftChange={isAdminCommentEditing ? onAdminCommentDraftChange : undefined}
          validationError={adminCommentError}
        />
      ) : null}
      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">기본 정보</h3>
        <div className="applicant-institution-basic-info__basic-info-fields">
          <div className="applicant-institution-basic-info__table-wrap">
            <table className="applicant-institution-basic-info__table">
              {INSTITUTION_APPLICATION_INFO_COLGROUP}
              <tbody>
                <InstitutionApplicationTableRowFullWidth
                  label="프로그램 승인 현황"
                  value={<ProgramApprovalStatusValue institution={institution} onResendNotificationClick={onResendNotificationClick} />}
                />
                {showTextbookAndCombinedClass ? (
                  hideCombinedClass ? (
                    <InstitutionApplicationTableRowFullWidth
                      label="교재명"
                      value={textbookEditValue}
                    />
                  ) : (
                    <InstitutionApplicationTableRowTwoCols
                      label1="교재명"
                      value1={textbookEditValue}
                      label2="합반 신청 여부"
                      value2={combinedClassEditValue}
                    />
                  )
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="applicant-institution-basic-info__table-wrap">
            <table className="applicant-institution-basic-info__table">
              {INSTITUTION_APPLICATION_INFO_COLGROUP}
              <tbody>
                <InstitutionApplicationTableRowTwoCols
                  label1="신청 기관명"
                  value1={schoolNameValue}
                  label2="신청 학년"
                  value2={educationGradeValue}
                />
                <InstitutionApplicationTableRowTwoCols
                  label1="기관 소재지"
                  value1={regionValue}
                  label2="상세 주소"
                  value2={addressDetailValue}
                />
                {showEducationFormatField ? (
                  <InstitutionApplicationTableRowTwoCols
                    label1="신청 학급 수 및 총 인원"
                    value1={classAndCount}
                    label2="희망 교육 형태"
                    value2={educationTypeValue}
                  />
                ) : (
                  <InstitutionApplicationTableRowSingleCol
                    label="신청 학급 수 및 총 인원"
                    value={classAndCount}
                  />
                )}
                <InstitutionApplicationTableRowFullWidth label="담당 교사 정보" value={teacherInfo} />
                <InstitutionApplicationTableRowFullWidth
                  label="신청 사유"
                  value={applicationReasonValue}
                  multiline
                />
                <InstitutionApplicationTableRowFullWidth
                  label="기타 요청사항"
                  value={otherRequestsValue}
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
            {INSTITUTION_APPLICATION_INFO_COLGROUP}
            <tbody>
              <InstitutionApplicationTableRowSingleCol
                label="강의 공간 내 컴퓨터 여부"
                value={computerValue}
              />
              <InstitutionApplicationTableRowSingleCol
                label="대기 장소 안내"
                value={waitingPlaceValue}
              />
              <InstitutionApplicationTableRowSingleCol
                label="식사 가능 여부 및 안내"
                value={mealValue}
              />
              <InstitutionApplicationTableRowSingleCol
                label={institutionApplicationTableLabelWithParenthesisHint(
                  INSTITUTION_OTHER_NOTES_TABLE_LABEL
                )}
                value={otherNotesValue}
              />
              <InstitutionApplicationTableRowSingleCol
                label="성범죄 경력 조회서 요청"
                value={sexOffenseRequestDisplay}
              />
            </tbody>
          </table>
        </div>
      </section>

      {showScheduleSection ? (
      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">진행 희망 교육 일정</h3>
        <div className="applicant-institution-basic-info__table-wrap">
          <table className="applicant-institution-basic-info__table">
            {INSTITUTION_APPLICATION_SCHEDULE_COLGROUP}
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
                  <PreferredScheduleRow
                    key={session.round}
                    rank={index + 1}
                    session={session}
                    bridge={institutionApplicationBridge}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}
    </div>
  )
}