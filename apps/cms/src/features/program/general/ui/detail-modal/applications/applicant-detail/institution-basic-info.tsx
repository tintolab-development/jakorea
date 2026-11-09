/**
 * 일반 프로그램 — 기관 유형 참여자 신청 상세 (신청 정보 탭)
 * 스크린샷 시안: 기본 정보 / 안내 사항 / 진행 희망 교육 일정
 */

import { useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type {
  ApplicantInstitutionDetailExtend,
  ApplicantSchoolRow,
} from '@/features/program/shared/model/applicant-institution'
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
import {
  formatInstitutionApplicationGradeDisplay,
  type InstitutionAffiliatedTeacherOption,
} from '@/features/program/general/lib/institution-application-detail-edit-policy'
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
import { ApplicantPreferredScheduleDetailSection } from './applicant-preferred-schedule-detail-section'
import {
  resolveInstitutionApplicationProgramBridge,
  shouldShowInstitutionApplicationGuidanceParagraph,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { shouldShowInstitutionApplicationDetailScheduleSection } from '@/features/program/general/lib/institution-application-session-display'
import { institutionHopeScheduleEmptyMessage } from '@/features/program/general/lib/institution-hope-schedule-empty-message'
import { resolveOrganizationApplicationHopeSessions } from '@/features/program/general/api/adapters/general-applications-adapters'
import {
  prepareGeneralEducationScheduleSessions,
  readCurriculumSessionLabels,
  readProgramEducationScheduleLines,
  resolveScheduleDetailTimeSpan,
} from '@/features/program/general/lib/participating-school-session-display'
import { organizationRequestedSchedulesQueryOptions } from '@/features/program/general/api/organization-requested-schedules-query'
import { formatClassStudentCountSegments } from '@/features/program/general/lib/detail-value-helpers'
import type { Program } from '@/types/domain'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { resolveAffiliatedFinancialCompanyDisplay } from '@/features/program/1c-1s/lib/affiliated-financial-company-display'
import { SponsorNameById } from '@/features/sponsor/ui/sponsor-name-by-id'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  alignCompanySchoolScheduleDates,
  buildCompanySchoolPreferredScheduleBlocks,
} from '@/features/program/1c-1s/lib/company-school-preferred-schedule-blocks'
import { formatCompanySchoolSexOffenseParts } from '@/features/program/1c-1s/lib/company-school-sex-offense-display'
import { CompanySchoolPreferredScheduleSection } from '@/features/program/1c-1s/ui/applicant-detail/company-school-preferred-schedule-section'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import {
  institutionApplicationTableLabelWithParenthesisHint,
  INSTITUTION_OTHER_NOTES_TABLE_LABEL,
} from './institution-application-info-table'
import './institution-basic-info.css'

function shouldShowCompanySchoolEconomyFields(
  program: Program | null | undefined,
  detail: ApplicantInstitutionDetailExtend | undefined
): boolean {
  const type = program?.backendProgramType?.trim().toUpperCase()
  if (type === 'COMPANY_SCHOOL' || type === 'ONE_COMPANY_ONE_SCHOOL') return true
  if (isCompanySchoolProgram(program)) return true
  return Boolean(
    detail?.previousYearParticipation?.trim() || detail?.affiliatedFinancialCompany?.trim()
  )
}

function resolveInstitutionTextbookSelectValue(
  draft: ApplicantInstitutionEditDraft,
  textbookOptions: TextbookSelectOption[]
): string | undefined {
  const textbookId = draft.textbookId.trim()
  if (
    textbookId &&
    textbookId !== TEXTBOOK_NOT_USED_OPTION_VALUE &&
    textbookOptions.some(option => option.value === textbookId)
  ) {
    return textbookId
  }
  const textbookName = draft.textbookName.trim()
  if (textbookName && textbookName !== '해당 없음') {
    const matched = textbookOptions.find(
      option => option.textbookName.trim() === textbookName || option.label === textbookName
    )
    return matched?.value
  }
  return TEXTBOOK_NOT_USED_OPTION_VALUE
}

export interface ApplicantGeneralInstitutionBasicInfoProps {
  institution: ApplicantSchoolRow
  detail?: ApplicantInstitutionDetailExtend
  maskSensitive?: boolean
  mode?: 'view' | 'edit'
  draft?: ApplicantInstitutionEditDraft
  onDraftChange?: (partial: Partial<ApplicantInstitutionEditDraft>) => void
  sameSchoolGradeOptions?: SameSchoolGradeOption[]
  classCountOptions?: Array<{ value: string; label: string }>
  teacherOptions?: InstitutionAffiliatedTeacherOption[]
  isTeacherOptionsLoading?: boolean
  showEducationFormatField?: boolean
  isCombinedClassProgramEligible?: boolean
  isCombinedClassApplyRadioDisabled?: boolean
  combinedClassReadOnly?: boolean
  hideCombinedClass?: boolean
  textbookOptions?: TextbookSelectOption[]
  textbookDisplayLabel?: string
  isTextbookCatalogLoading?: boolean
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

/** 1사1교 결연 금융 회사 — 신청 폼 객체 값을 라디오 옵션 기준 라벨로 */
function buildAffiliatedFinancialCompanyCell(
  detail: ApplicantInstitutionDetailExtend | undefined,
  program: Program | null | undefined
): ReactNode {
  const display = resolveAffiliatedFinancialCompanyDisplay(detail?.affiliatedFinancialCompany)
  if (display.kind === 'text') return display.text
  if (display.kind === 'partner' && program?.sponsorId) {
    return <SponsorNameById sponsorId={program.sponsorId} />
  }
  return '-'
}

function buildSexOffenseRequestCell(
  detail: ApplicantInstitutionDetailExtend | undefined,
  isCompanySchool = false
): ReactNode {
  const raw = detail?.sexOffenseCheckRequest?.trim()
  if (!raw) return '-'
  /** 1사1교: 시안 형식 `온라인 제출 | ID : … | 검증번호 : …` */
  const parts = isCompanySchool
    ? formatCompanySchoolSexOffenseParts(raw)
    : raw
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
  const name = institution.teacherName?.trim()
  const hasCanonicalTeacherTel =
    detail != null && Object.prototype.hasOwnProperty.call(detail, 'teacherTel')
  const phone = hasCanonicalTeacherTel
    ? detail?.teacherTel?.trim()
    : detail?.teacherPhone?.trim() || detail?.teacherMobile?.trim() || institution.contact?.trim()
  const mobile = hasCanonicalTeacherTel
    ? detail?.teacherPhone?.trim() || detail?.teacherMobile?.trim()
    : detail?.teacherMobile?.trim() && detail.teacherMobile.trim() !== phone
      ? detail.teacherMobile.trim()
      : undefined
  const email = detail?.teacherEmail?.trim()

  const segments: string[] = []
  if (name) segments.push(`담당 교사 : ${name}`)
  if (phone) {
    if (/Tel\s*:|M\s*:|E-mail\s*:/i.test(phone)) {
      segments.push(
        ...phone
          .split('|')
          .map(s => s.trim())
          .filter(Boolean)
      )
    } else {
      segments.push(`Tel : ${phone}`)
    }
  }
  if (mobile) segments.push(`M : ${mobile}`)
  if (email) {
    segments.push(/E-mail\s*:/i.test(email) ? email : `E-mail : ${email}`)
  }

  if (segments.length === 0) {
    const raw = detail?.teacherInfo?.trim()
    if (!raw) return '-'
    const parts = raw
      .split('|')
      .map(s => s.trim())
      .filter(Boolean)
    if (parts.length === 0) return '-'
    if (parts.length === 1) return parts[0]
    return (
      <ProgramDetailTdSegmentWrap>{withProgramDetailTdDivider(parts)}</ProgramDetailTdSegmentWrap>
    )
  }
  if (segments.length === 1) return segments[0]
  return (
    <ProgramDetailTdSegmentWrap>{withProgramDetailTdDivider(segments)}</ProgramDetailTdSegmentWrap>
  )
}

function buildCombinedClassViewValue(
  detail?: ApplicantInstitutionDetailExtend,
  programEligible = true
): ReactNode {
  if (!programEligible) return '해당 없음'
  const display = formatCombinedClassDisplay(detail)
  if (display === '미신청') return display
  const parts = display
    .split(' | ')
    .map(part => part.trim())
    .filter(Boolean)
  if (parts.length <= 1) return parts[0] ?? display
  return (
    <ProgramDetailTdSegmentWrap>{withProgramDetailTdDivider(parts)}</ProgramDetailTdSegmentWrap>
  )
}

export function ApplicantGeneralInstitutionBasicInfo({
  institution,
  detail,
  maskSensitive: _maskSensitive = true,
  mode = 'view',
  draft,
  onDraftChange,
  sameSchoolGradeOptions = [],
  classCountOptions = [],
  teacherOptions = [],
  isTeacherOptionsLoading = false,
  showEducationFormatField = false,
  isCombinedClassProgramEligible: isCombinedClassProgramEligibleProp,
  isCombinedClassApplyRadioDisabled = true,
  combinedClassReadOnly = false,
  hideCombinedClass = false,
  textbookOptions = [],
  textbookDisplayLabel,
  isTextbookCatalogLoading = false,
  validationErrors,
  onResendNotificationClick,
  program = null,
  isAdminCommentEditing = false,
  adminCommentDraft = '',
  onAdminCommentDraftChange,
  adminCommentError,
}: ApplicantGeneralInstitutionBasicInfoProps) {
  const isEditMode = mode === 'edit' && draft != null && onDraftChange != null
  const isCompanySchool = isCompanySchoolProgram(program)
  const institutionApplicationBridge = program
    ? resolveInstitutionApplicationProgramBridge(program)
    : null
  const combinedClassProgramEligible =
    isCombinedClassProgramEligibleProp ?? isCombinedClassProgramEligible(program)
  const detailScheduleTimeSpan = useMemo(
    () => resolveScheduleDetailTimeSpan(program?.generalCommonInfo?.scheduleDetails),
    [program]
  )
  const curriculumSessionLabels = useMemo(() => readCurriculumSessionLabels(program), [program])
  const educationScheduleLines = useMemo(
    () => readProgramEducationScheduleLines(program),
    [program]
  )
  const showGuidanceSection =
    institutionApplicationBridge == null ||
    shouldShowInstitutionApplicationGuidanceParagraph(institutionApplicationBridge)
  /** 합반 신청 — 승인 완료 시 노출 (교재명은 참여 기관 상세에서만 노출) */
  const showCombinedClass = institution.approvalStatus === 'approved' && !hideCombinedClass
  const classAndCount: ReactNode =
    isEditMode && draft && onDraftChange ? (
      <InstitutionClassAndStudentCountEdit
        classCount={draft.classCount}
        studentCount={draft.studentCount}
        classCountOptions={classCountOptions}
        numericClassCount={isCompanySchool}
        onChange={patch => onDraftChange(patch)}
        errors={{
          classCount: validationErrors?.classCount,
          studentCount: validationErrors?.studentCount,
        }}
      />
    ) : institution.classCount != null && institution.studentCount != null ? (
      <ProgramDetailTdSegmentWrap>
        {withProgramDetailTdDivider(
          formatClassStudentCountSegments(institution.classCount, institution.studentCount)
        )}
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
  const sexOffenseRequestDisplay = buildSexOffenseRequestCell(detail, isCompanySchool)
  /** 1사1교도 requested-schedules 를 조회한다. 로딩 중 data는 undefined이며 빈 배열로 덮지 않는다. */
  const requestedHopeSchedulesQuery = useQuery({
    ...organizationRequestedSchedulesQueryOptions(institution.id),
    enabled: institution.id.trim().length > 0,
  })
  const companySchoolScheduleBlocks = useMemo(
    () =>
      isCompanySchool
        ? buildCompanySchoolPreferredScheduleBlocks(
            /**
             * 교시·시간: requested-schedules GET. 빈 배열은 일정 없음(메모로 채우지 않음).
             * 날짜: `preferredEducationSchedules[].educationDate`(상세 GET)로 맞춘다.
             */
            alignCompanySchoolScheduleDates(
              requestedHopeSchedulesQuery.data ?? [],
              institution.preferredEducationSchedules
            )
          )
        : [],
    [isCompanySchool, requestedHopeSchedulesQuery.data, institution.preferredEducationSchedules]
  )
  const sessions = useMemo(() => {
    const preferred = institution.preferredEducationSchedules ?? []
    const fromHope = resolveOrganizationApplicationHopeSessions(
      {
        programType: isCompanySchool
          ? program?.backendProgramType?.trim() || 'COMPANY_SCHOOL'
          : program?.backendProgramType?.trim() || 'GENERAL_ORGANIZATION',
        availableActions: [],
        sessions: [],
        preferredEducationSchedules: [],
      },
      preferred,
      requestedHopeSchedulesQuery.data
    )
    const source = fromHope.length > 0 ? fromHope : (institution.sessions ?? [])
    return prepareGeneralEducationScheduleSessions(
      source,
      institutionApplicationBridge
        ? {
            educationStructure: institutionApplicationBridge.educationStructure,
            sessionRound: institutionApplicationBridge.sessionRound,
            educationScheduleMode: institutionApplicationBridge.educationScheduleMode,
            curriculumSessionCount: institutionApplicationBridge.curriculumChartSessionCount,
            curriculumSessionLabels,
          }
        : null,
      { detailScheduleTimeSpan, educationScheduleLines }
    )
  }, [
    curriculumSessionLabels,
    detailScheduleTimeSpan,
    educationScheduleLines,
    institution,
    institutionApplicationBridge,
    isCompanySchool,
    program?.backendProgramType,
    requestedHopeSchedulesQuery.data,
  ])
  const showScheduleSection =
    sessions.length > 0 ||
    (institution.preferredEducationSchedules?.length ?? 0) > 0 ||
    shouldShowInstitutionApplicationDetailScheduleSection(institutionApplicationBridge, institution)

  const combinedClassViewValue = buildCombinedClassViewValue(detail, combinedClassProgramEligible)

  const addressDetailValue =
    isEditMode && draft && onDraftChange ? (
      <InstitutionAddressDetailEdit
        value={draft.addressDetail}
        onChange={value => onDraftChange({ addressDetail: value })}
        error={validationErrors?.addressDetail}
      />
    ) : (
      (detail?.addressDetail ?? '-')
    )

  const educationTypeValue =
    (showEducationFormatField || isCompanySchool) && isEditMode && draft && onDraftChange ? (
      <InstitutionEducationFormatRadios
        value={draft.educationFormat}
        onChange={value => onDraftChange({ educationFormat: value })}
        error={validationErrors?.educationFormat}
      />
    ) : showEducationFormatField || isCompanySchool ? (
      (detail?.educationType ?? '-')
    ) : (
      '-'
    )

  const applicationReasonValue = detail?.applicationReason ?? '-'
  const otherRequestsValue = detail?.otherRequests ?? '-'

  const schoolNameValue =
    isEditMode && draft ? (
      <InstitutionReadonlyInput width={240} value={institution.schoolName ?? ''} />
    ) : (
      (institution.schoolName ?? '-')
    )

  const educationGradeValue =
    isEditMode && draft && onDraftChange ? (
      <InstitutionGradeSelectEdit
        value={draft.educationGrade}
        onChange={value => onDraftChange({ educationGrade: value })}
        error={validationErrors?.educationGrade}
      />
    ) : (
      formatInstitutionApplicationGradeDisplay(institution.educationGrade ?? '') || '-'
    )

  const regionValue =
    isEditMode && draft ? (
      <InstitutionReadonlyInput value={institution.region ?? ''} />
    ) : (
      (institution.region ?? '-')
    )

  const computerValue = detail?.computerInSpace ?? '-'
  const waitingPlaceValue = detail?.waitingPlaceGuide ?? detail?.waitingRoom ?? '-'
  const mealValue = detail?.mealInfo ?? '-'
  const otherNotesValue = detail?.parkingInfo ?? detail?.otherSpecialNotes ?? '-'
  const showCompanySchoolEconomyFields = shouldShowCompanySchoolEconomyFields(program, detail)
  /** 1사1교 시안 — 결연 금융 회사·전년도 진행 여부를 학급 수 행 아래로, 일부 라벨만 시안 표기 */
  const isCompanySchoolLayout = showCompanySchoolEconomyFields && isCompanySchoolProgram(program)
  const affiliatedFinancialCompanyValue = buildAffiliatedFinancialCompanyCell(detail, program)

  const textbookViewValue =
    (detail?.textbookDisplayLabel?.trim() &&
    detail.textbookDisplayLabel.trim() !== '해당 없음'
      ? detail.textbookDisplayLabel.trim()
      : textbookDisplayLabel?.trim() && textbookDisplayLabel.trim() !== '해당 없음'
        ? textbookDisplayLabel.trim()
        : (detail?.textbookName ?? institution.textbookName)?.trim()) || '해당 없음'

  const textbookEditValue =
    isEditMode && draft && onDraftChange ? (
      <div className="institution-basic-info__field-stack">
        <CmsSelect
          className="institution-basic-info__full-width-control"
          inputSize="small"
          width="100%"
          placeholder="교재명 선택"
          withAllOption={false}
          loading={isTextbookCatalogLoading}
          value={resolveInstitutionTextbookSelectValue(draft, textbookOptions ?? [])}
          options={textbookOptions.map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={value => {
            const selected = textbookOptions.find(option => option.value === value)
            const isNotUsed = value === TEXTBOOK_NOT_USED_OPTION_VALUE
            onDraftChange({
              textbookId: isNotUsed ? TEXTBOOK_NOT_USED_OPTION_VALUE : String(value ?? ''),
              textbookName: isNotUsed ? '해당 없음' : (selected?.textbookName ?? ''),
            })
          }}
          error={Boolean(validationErrors?.textbookId || validationErrors?.textbookName)}
          message={validationErrors?.textbookId ?? validationErrors?.textbookName}
        />
      </div>
    ) : null

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
        validationError={validationErrors?.combinedClassPartnerApplicantIds}
      />
    ) : (
      combinedClassViewValue
    )

  const showAdminComment = institution.approvalStatus === 'approved'
  const basicInfoFormMode = isEditMode ? 'edit' : 'view'

  const classAndCountView =
    institution.classCount != null && institution.studentCount != null ? (
      <ProgramDetailTdSegmentWrap>
        {withProgramDetailTdDivider(
          formatClassStudentCountSegments(institution.classCount, institution.studentCount)
        )}
      </ProgramDetailTdSegmentWrap>
    ) : (
      '-'
    )

  return (
    <div className="institution-basic-info applicant-institution-basic-info">
      {showAdminComment ? (
        <ApplicantAdminCommentSection
          adminComment={institution.adminComment}
          mode={isAdminCommentEditing ? 'edit' : 'view'}
          draftValue={adminCommentDraft}
          onDraftChange={isAdminCommentEditing ? onAdminCommentDraftChange : undefined}
          validationError={adminCommentError}
        />
      ) : null}
      <section className="applicant-institution-basic-info__section applicant-instructor-basic-info">
        <DetailInfoForm title="기본 정보" mode={basicInfoFormMode}>
          <DetailInfoForm.Row type={isCompanySchool ? 'double' : 'single'}>
            <DetailInfoForm.Field
              label="프로그램 승인 현황"
              fullRow={!isCompanySchool}
              readOnlyDisplay
              view={
                <ProgramApprovalStatusValue
                  institution={institution}
                  onResendNotificationClick={onResendNotificationClick}
                />
              }
            />
            {isCompanySchool ? (
              <DetailInfoForm.Field
                label="교재명"
                readOnlyDisplay={!isEditMode}
                view={textbookViewValue}
                edit={textbookEditValue}
              />
            ) : null}
          </DetailInfoForm.Row>
          {showCombinedClass ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="합반 신청 여부"
                fullRow
                readOnlyDisplay={!isEditMode || combinedClassReadOnly}
                view={combinedClassViewValue}
                edit={combinedClassEditValue}
              />
            </DetailInfoForm.Row>
          ) : null}
        </DetailInfoForm>
        <DetailInfoForm title="기본 정보" hideHeader mode={basicInfoFormMode}>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="신청 기관명"
              readOnlyDisplay={!isEditMode}
              view={institution.schoolName ?? '-'}
              edit={schoolNameValue}
            />
            <DetailInfoForm.Field
              label="신청 학년"
              readOnlyDisplay={!isEditMode}
              view={
                formatInstitutionApplicationGradeDisplay(institution.educationGrade ?? '') || '-'
              }
              edit={educationGradeValue}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="기관 소재지"
              readOnlyDisplay={!isEditMode}
              view={institution.region ?? '-'}
              edit={regionValue}
            />
            <DetailInfoForm.Field
              label="상세 주소"
              readOnlyDisplay={!isEditMode}
              view={detail?.addressDetail ?? '-'}
              edit={addressDetailValue}
            />
          </DetailInfoForm.Row>
          {showEducationFormatField || isCompanySchool ? (
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="신청 학급 수 및 총 인원"
                readOnlyDisplay={!isEditMode}
                view={classAndCountView}
                edit={classAndCount}
              />
              <DetailInfoForm.Field
                label="희망 교육 형태"
                readOnlyDisplay={!isEditMode}
                view={detail?.educationType ?? '-'}
                edit={educationTypeValue}
              />
            </DetailInfoForm.Row>
          ) : (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="신청 학급 수 및 총 인원"
                fullRow
                readOnlyDisplay={!isEditMode}
                view={classAndCountView}
                edit={classAndCount}
              />
            </DetailInfoForm.Row>
          )}
          {isCompanySchoolLayout ? (
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="결연 금융 회사"
                readOnlyDisplay
                view={affiliatedFinancialCompanyValue}
              />
              <DetailInfoForm.Field
                label="전년도 진행 여부"
                readOnlyDisplay
                view={detail?.previousYearParticipation ?? '-'}
              />
            </DetailInfoForm.Row>
          ) : null}
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="담당 교사 정보"
              fullRow
              readOnlyDisplay={!isEditMode}
              view={buildTeacherInfoCell(institution, detail)}
              edit={teacherInfo}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="신청 사유"
              fullRow
              readOnlyDisplay
              view={applicationReasonValue}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="기타 요청사항"
              fullRow
              readOnlyDisplay
              view={otherRequestsValue}
            />
          </DetailInfoForm.Row>
          {showCompanySchoolEconomyFields && !isCompanySchoolLayout ? (
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="전년도 참여 여부"
                readOnlyDisplay
                view={detail?.previousYearParticipation ?? '-'}
              />
              <DetailInfoForm.Field
                label="결연 금융회사명"
                readOnlyDisplay
                view={affiliatedFinancialCompanyValue}
              />
            </DetailInfoForm.Row>
          ) : null}
        </DetailInfoForm>
      </section>

      {showGuidanceSection ? (
        <DetailInfoForm
          title={isCompanySchoolLayout ? '안내사항' : '안내 사항'}
          mode={basicInfoFormMode}
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="강의 공간 내 컴퓨터 여부"
              fullRow
              readOnlyDisplay
              view={computerValue}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="대기 장소 안내"
              fullRow
              readOnlyDisplay
              view={waitingPlaceValue}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="식사 가능 여부 및 안내"
              fullRow
              readOnlyDisplay
              view={mealValue}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label={institutionApplicationTableLabelWithParenthesisHint(
                INSTITUTION_OTHER_NOTES_TABLE_LABEL
              )}
              fullRow
              readOnlyDisplay
              view={otherNotesValue}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="성범죄경력 조회서 요청"
              fullRow
              readOnlyDisplay
              view={sexOffenseRequestDisplay}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      ) : null}

      {isCompanySchool ? (
        companySchoolScheduleBlocks.length > 0 ? (
          <CompanySchoolPreferredScheduleSection blocks={companySchoolScheduleBlocks} />
        ) : null
      ) : showScheduleSection ? (
        <ApplicantPreferredScheduleDetailSection
          sessions={sessions}
          bridge={institutionApplicationBridge}
          detailScheduleTimeSpan={detailScheduleTimeSpan}
          curriculumSessionLabels={curriculumSessionLabels}
          emptyMessage={institutionHopeScheduleEmptyMessage(institution)}
        />
      ) : null}
    </div>
  )
}
