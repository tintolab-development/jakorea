import { memo, useEffect, useMemo, useSyncExternalStore } from 'react'
import {
  shouldShowInstitutionApplicationPreferredEducationForm,
  useInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import {
  isParticipantSelectionEducationFormInOverlay,
  PROGRAM_REGISTRATION_EDUCATION_FORM_BRIDGE_OVERLAY_KEYS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import {
  getProgramRegistrationOverlayRecord,
  subscribeProgramRegistrationOverlayKeys,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  DEFAULT_INSTITUTION_APPLICATION_MAX_CLASS_COUNT,
  buildInstitutionClassCountOptions,
} from '@/features/template/lib/participant-recruitment-institution-limits'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'

/** 신청 학년 — 1학년 ~ 6학년만 노출 */
const APPLICATION_GRADE_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}학년`,
}))

const EDUCATION_FORM_OPTIONS = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '온/오프라인' },
] as const

const DETAIL_ADDRESS_PLACEHOLDER = '교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요'

/** 플랫폼 로그인 자동 반영 필드 — CMS 미리보기·신청정보 노출용 플레이스홀더(필드명) */
const PREVIEW_AUTO_USER_INFO_SAMPLE = {
  institutionName: '신청 기관명',
  institutionAddress: '기관 소재지',
  teacherName: '담당 교사',
  tel: '',
  mobile: '',
  email: '',
} as const

const inlineChoiceStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 16 }

const InstitutionApplicationTeacherContactFields = memo(
  function InstitutionApplicationTeacherContactFields() {
    const [teacherTel, setTeacherTel] = useGeneralApplicationOverlayKv<string>(
      'application.institution.teacherTel',
      PREVIEW_AUTO_USER_INFO_SAMPLE.tel
    )
    const [teacherMobile, setTeacherMobile] = useGeneralApplicationOverlayKv<string>(
      'application.institution.teacherMobile',
      PREVIEW_AUTO_USER_INFO_SAMPLE.mobile
    )
    const [teacherEmail, setTeacherEmail] = useGeneralApplicationOverlayKv<string>(
      'application.institution.teacherEmail',
      PREVIEW_AUTO_USER_INFO_SAMPLE.email
    )
    return (
      <div className="detail-info-form-inputs-wrapper-no-gap">
        <span className="mr-6">담당 교사</span>
        <CmsInput
          inputSize="medium"
          width={120}
          value={PREVIEW_AUTO_USER_INFO_SAMPLE.teacherName}
          disabled
          readOnly
        />
        <DetailInfoForm.InputsSeparator />
        <span className="mr-6">Tel</span>
        <CmsInput
          inputSize="medium"
          width={240}
          placeholder="담당 교사의 내선 번호(직통 번호)"
          value={teacherTel}
          onChange={e => setTeacherTel(e.target.value)}
        />
        <DetailInfoForm.InputsSeparator />
        <span className="mr-6">M</span>
        <CmsInput
          inputSize="medium"
          width={240}
          placeholder="담당 교사의 휴대폰 번호"
          value={teacherMobile}
          onChange={e => setTeacherMobile(e.target.value)}
        />
        <DetailInfoForm.InputsSeparator />
        <span className="mr-6">E-mail</span>
        <CmsInput
          inputSize="medium"
          width={240}
          placeholder="담당 교사의 이메일"
          value={teacherEmail}
          onChange={e => setTeacherEmail(e.target.value)}
        />
      </div>
    )
  }
)

const InstitutionApplicationGradeField = memo(function InstitutionApplicationGradeField() {
  const [applicationGrade, setApplicationGrade] = useGeneralApplicationOverlayKv<string>(
    'application.institution.applicationGrade',
    ''
  )
  return (
    <DetailInfoForm.Field
      label="신청 학년"
      edit={
        <CmsSelect
          inputSize="medium"
          width="100%"
          withAllOption={false}
          placeholder="학년 선택"
          value={applicationGrade === '' ? undefined : applicationGrade}
          onChange={v => setApplicationGrade(String(v ?? ''))}
          options={APPLICATION_GRADE_OPTIONS}
        />
      }
      view="-"
    />
  )
})

const InstitutionApplicationEducationFormField = memo(function InstitutionApplicationEducationFormField() {
  const [educationForm, setEducationForm] = useGeneralApplicationOverlayKv<string>(
    'application.institution.educationForm',
    EDUCATION_FORM_OPTIONS[0]?.value ?? 'online'
  )
  return (
    <DetailInfoForm.Field
      label="희망 교육 형태"
      edit={
        <CmsRadioGroup
          size="large"
          value={educationForm}
          onChange={e => setEducationForm(e.target.value)}
          style={inlineChoiceStyle}
        >
          {EDUCATION_FORM_OPTIONS.map(o => (
            <CmsRadio key={o.value} value={o.value}>
              {o.label}
            </CmsRadio>
          ))}
        </CmsRadioGroup>
      }
      view="-"
    />
  )
})

/** 프로그램 참여자 신청 폼 (학교) — 기본 정보 단락 (`DetailInfoForm` 격자) */
export function ProgramApplicationFormInstitutionBasicInfoParagraph({
  isTemplateAuthoringMode: _isTemplateAuthoringMode = false,
}: {
  isTemplateAuthoringMode?: boolean
}) {
  const bridge = useInstitutionApplicationProgramBridge()
  const classCountOptions = useMemo(
    () =>
      buildInstitutionClassCountOptions(
        bridge.maxClassCount ?? DEFAULT_INSTITUTION_APPLICATION_MAX_CLASS_COUNT
      ),
    [bridge.maxClassCount]
  )
  const participantSelectionInRegistrationOverlay = useSyncExternalStore(
    listener =>
      subscribeProgramRegistrationOverlayKeys(
        PROGRAM_REGISTRATION_EDUCATION_FORM_BRIDGE_OVERLAY_KEYS,
        listener
      ),
    () => isParticipantSelectionEducationFormInOverlay(getProgramRegistrationOverlayRecord()),
    () => isParticipantSelectionEducationFormInOverlay(getProgramRegistrationOverlayRecord())
  )
  const showPreferredEducationForm =
    shouldShowInstitutionApplicationPreferredEducationForm(bridge) ||
    participantSelectionInRegistrationOverlay

  const [classCount, setClassCount] = useGeneralApplicationOverlayKv<string>(
    'application.institution.classCount',
    ''
  )

  useEffect(() => {
    if (classCount === '') return
    const selected = parseInt(classCount, 10)
    const max = bridge.maxClassCount
    if (max != null && max > 0 && (Number.isNaN(selected) || selected > max)) {
      setClassCount('')
    }
  }, [bridge.maxClassCount, classCount])

  /** 로그인 자동 반영 필드 — 템플릿 편집에서도 힌트 문구 대신 disabled 인풋 노출 */
  const autoFilledInstitutionName = (
    <CmsInput
      inputSize="medium"
      width="100%"
      value={PREVIEW_AUTO_USER_INFO_SAMPLE.institutionName}
      disabled
      readOnly
    />
  )

  const autoFilledInstitutionAddress = (
    <CmsInput
      inputSize="medium"
      width="100%"
      value={PREVIEW_AUTO_USER_INFO_SAMPLE.institutionAddress}
      disabled
      readOnly
    />
  )

  const classCountAndTotalField = (
    <DetailInfoForm.Field
      label="신청 학급 수 및 총 인원"
      fullRow={!showPreferredEducationForm}
      edit={
        <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
          <CmsSelect
            inputSize="medium"
            withAllOption={false}
            placeholder="신청 학급"
            width={120}
            value={classCount === '' ? undefined : classCount}
            onChange={v => setClassCount(String(v ?? ''))}
            options={classCountOptions}
          />
          <span>개 학급</span>
          <DetailInfoForm.InputsSeparator />
          <CmsNumericInput inputSize="medium" mode="integer" placeholder="총 학생 수" width={120} />
          <span>명</span>
        </div>
      }
      view="-"
    />
  )

  return (
    <DetailInfoForm title="기본 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="신청 기관명"
          readOnlyDisplay
          view={autoFilledInstitutionName}
        />
        <InstitutionApplicationGradeField />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="기관 소재지"
          readOnlyDisplay
          view={autoFilledInstitutionAddress}
        />
        <DetailInfoForm.Field
          label="상세 주소"
          edit={
            <CmsInput inputSize="medium" placeholder={DETAIL_ADDRESS_PLACEHOLDER} width="100%" />
          }
          view="-"
        />
      </DetailInfoForm.Row>

      {showPreferredEducationForm ? (
        <DetailInfoForm.Row type="double">
          {classCountAndTotalField}
          <InstitutionApplicationEducationFormField />
        </DetailInfoForm.Row>
      ) : (
        <DetailInfoForm.Row type="single">{classCountAndTotalField}</DetailInfoForm.Row>
      )}

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="담당 교사 정보"
          fullRow
          edit={<InstitutionApplicationTeacherContactFields />}
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="신청 사유"
          fullRow
          edit={
            <CmsInput inputSize="medium" placeholder="신청 사유를 입력해 주세요." width="100%" />
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="기타 요청사항"
          fullRow
          edit={
            <CmsInput
              inputSize="medium"
              placeholder="기타 요청사항을 입력해 주세요."
              width="100%"
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
