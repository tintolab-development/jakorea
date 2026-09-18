import { useEffect, useMemo } from 'react'
import {
  shouldShowInstitutionApplicationPreferredEducationForm,
  useInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import {
  DEFAULT_INSTITUTION_APPLICATION_MAX_CLASS_COUNT,
  buildInstitutionClassCountOptions,
} from '@/features/template/lib/participant-recruitment-institution-limits'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'

const APPLICATION_GRADE_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}학년`,
}))

const EDUCATION_FORMAT_OPTIONS = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '온/오프라인' },
] as const

const EDUCATION_PLACE_OPTIONS = [
  { value: 'inside', label: '기관 안' },
  { value: 'outside', label: '기관 밖' },
  { value: 'custom', label: '기타(직접입력)' },
] as const

const inlineChoiceStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 16 }

/** 교육받은 교사 프로그램 참여자 신청 폼 — 기본 정보 */
export function TrainedTeachersProgramApplicationBasicInfoParagraph({
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
  const showPreferredEducationForm = shouldShowInstitutionApplicationPreferredEducationForm(bridge)

  const [applicationGrade, setApplicationGrade] = useGeneralApplicationOverlayKv<string>(
    'application.trainedTeachers.basicInfo.applicationGrade',
    ''
  )
  const [classCount, setClassCount] = useGeneralApplicationOverlayKv<string>(
    'application.trainedTeachers.basicInfo.classCount',
    ''
  )
  const [educationFormat, setEducationFormat] = useGeneralApplicationOverlayKv<string>(
    'application.trainedTeachers.basicInfo.educationFormat',
    'online'
  )
  const [educationPlace, setEducationPlace] = useGeneralApplicationOverlayKv<string>(
    'application.trainedTeachers.basicInfo.educationPlace',
    'inside'
  )
  const [detailAddress, setDetailAddress] = useGeneralApplicationOverlayKv<string>(
    'application.trainedTeachers.basicInfo.detailAddress',
    ''
  )
  const [totalStudents, setTotalStudents] = useGeneralApplicationOverlayKv<string>(
    'application.trainedTeachers.basicInfo.totalStudents',
    ''
  )
  const [educationPlaceDetail, setEducationPlaceDetail] = useGeneralApplicationOverlayKv<string>(
    'application.trainedTeachers.basicInfo.educationPlaceDetail',
    ''
  )
  const [teacherTel, setTeacherTel] = useGeneralApplicationOverlayKv<string>(
    'application.trainedTeachers.basicInfo.teacherTel',
    ''
  )
  const [teacherMobile, setTeacherMobile] = useGeneralApplicationOverlayKv<string>(
    'application.trainedTeachers.basicInfo.teacherMobile',
    ''
  )
  const [teacherEmail, setTeacherEmail] = useGeneralApplicationOverlayKv<string>(
    'application.trainedTeachers.basicInfo.teacherEmail',
    ''
  )
  const [applicationReason, setApplicationReason] = useGeneralApplicationOverlayKv<string>(
    'application.trainedTeachers.basicInfo.applicationReason',
    ''
  )
  const [otherRequests, setOtherRequests] = useGeneralApplicationOverlayKv<string>(
    'application.trainedTeachers.basicInfo.otherRequests',
    ''
  )

  useEffect(() => {
    if (classCount === '') return
    const selected = parseInt(classCount, 10)
    const max = bridge.maxClassCount
    if (max != null && max > 0 && (Number.isNaN(selected) || selected > max)) {
      setClassCount('')
    }
  }, [bridge.maxClassCount, classCount, setClassCount])

  /** 로그인·소속 기관 자동 반영 — 값 없으면 placeholder (샘플 학교명 금지) */
  const autoFilledInstitutionName = (
    <CmsInput
      inputSize="medium"
      width="100%"
      value=""
      placeholder="로그인 교사의 소속 학교"
      disabled
      readOnly
    />
  )

  const autoFilledInstitutionAddress = (
    <CmsInput
      inputSize="medium"
      width="100%"
      value=""
      placeholder="기관 등록 주소"
      disabled
      readOnly
    />
  )

  const teacherInfoInputs = (
    <div className="detail-info-form-inputs-wrapper-no-gap">
      <span className="mr-6">담당 교사</span>
      <CmsInput
        inputSize="medium"
        width={120}
        value=""
        placeholder="교사명"
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

  return (
    <DetailInfoForm title="기본 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="신청 기관명"
          readOnlyDisplay
          view={autoFilledInstitutionName}
        />
        <DetailInfoForm.Field
          label="신청 학년"
          edit={
            <CmsSelect
              inputSize="medium"
              width={140}
              withAllOption={false}
              placeholder="학년 선택"
              value={applicationGrade === '' ? undefined : applicationGrade}
              onChange={value => setApplicationGrade(String(value ?? ''))}
              options={APPLICATION_GRADE_OPTIONS}
            />
          }
          view="-"
        />
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
            <CmsInput
              inputSize="medium"
              placeholder="교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요"
              width="100%"
              value={detailAddress}
              onChange={e => setDetailAddress(e.target.value)}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type={showPreferredEducationForm ? 'double' : 'single'}>
        <DetailInfoForm.Field
          label="신청 학급 수 및 총 인원"
          fullRow={!showPreferredEducationForm}
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsSelect
                inputSize="medium"
                width={120}
                withAllOption={false}
                placeholder="신청 학급"
                value={classCount === '' ? undefined : classCount}
                onChange={value => setClassCount(String(value ?? ''))}
                options={classCountOptions}
              />
              <span>개 학급</span>
              <DetailInfoForm.InputsSeparator />
              <CmsNumericInput
                inputSize="medium"
                width={120}
                mode="integer"
                placeholder="총 학생 수"
                value={totalStudents}
                onValueChange={setTotalStudents}
              />
              <span>명</span>
            </div>
          }
          view="-"
        />
        {showPreferredEducationForm ? (
          <DetailInfoForm.Field
            label="희망 교육 형태"
            edit={
              <CmsRadioGroup
                size="large"
                value={educationFormat}
                onChange={event => setEducationFormat(event.target.value)}
                style={inlineChoiceStyle}
              >
                {EDUCATION_FORMAT_OPTIONS.map(option => (
                  <CmsRadio key={option.value} value={option.value}>
                    {option.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
            }
            view="-"
          />
        ) : null}
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교육 장소"
          fullRow
          edit={
            <div
              className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
              style={{ alignItems: 'center', flexWrap: 'wrap', gap: 8, width: '100%' }}
            >
              <CmsRadioGroup
                size="large"
                value={educationPlace}
                onChange={event => setEducationPlace(event.target.value)}
                style={inlineChoiceStyle}
              >
                {EDUCATION_PLACE_OPTIONS.map(option => (
                  <CmsRadio key={option.value} value={option.value}>
                    {option.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                inputSize="medium"
                placeholder="교육이 진행될 상세 장소를 입력해 주세요"
                width="100%"
                style={{ flex: '1 1 280px', minWidth: 180 }}
                value={educationPlaceDetail}
                onChange={e => setEducationPlaceDetail(e.target.value)}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field label="담당 교사 정보" fullRow edit={teacherInfoInputs} view="-" />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="신청 사유"
          fullRow
          edit={
            <CmsInput
              inputSize="medium"
              placeholder="신청 사유를 입력해 주세요."
              width="100%"
              value={applicationReason}
              onChange={e => setApplicationReason(e.target.value)}
            />
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
              value={otherRequests}
              onChange={e => setOtherRequests(e.target.value)}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
