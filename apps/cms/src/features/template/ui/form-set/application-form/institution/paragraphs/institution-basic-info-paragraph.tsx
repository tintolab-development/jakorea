import { useEffect, useMemo, useState } from 'react'
import {
  shouldShowInstitutionApplicationPreferredEducationForm,
  useInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { buildInstitutionClassCountOptions } from '@/features/template/lib/participant-recruitment-institution-limits'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import '@/features/template/ui/form-editor/form-editor.css'

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

const TEMPLATE_AUTO_USER_INFO_HINT = '로그인 사용자 정보가 자동으로 반영됩니다.'

const DETAIL_ADDRESS_PLACEHOLDER = '교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요'

/** 미리보기·프로그램 연동 — 신청 교사/기관 자동 반영 예시 (진월초 mock) */
const PREVIEW_AUTO_USER_INFO_SAMPLE = {
  institutionName: '진월초등학교',
  institutionAddress: '광주광역시 남구 광복마을4길 40',
  teacherName: '최강사',
  mobile: '010-1234-5678',
  email: 'instructor1@example.com',
} as const

const inlineChoiceStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 16 }

/** 프로그램 참여자 신청 폼 (학교) — 기본 정보 단락 (`DetailInfoForm` 격자) */
export function ProgramApplicationFormInstitutionBasicInfoParagraph({
  isTemplateAuthoringMode = false,
}: {
  isTemplateAuthoringMode?: boolean
}) {
  const bridge = useInstitutionApplicationProgramBridge()
  const classCountOptions = useMemo(
    () => buildInstitutionClassCountOptions(bridge.maxClassCount),
    [bridge.maxClassCount]
  )
  const showPreferredEducationForm =
    shouldShowInstitutionApplicationPreferredEducationForm(bridge)

  const [applicationGrade, setApplicationGrade] = useState<string>('')
  const [classCount, setClassCount] = useState<string>('')
  const [educationForm, setEducationForm] = useState<string>(
    EDUCATION_FORM_OPTIONS[0]?.value ?? 'online'
  )
  const [teacherMobile, setTeacherMobile] = useState<string>(PREVIEW_AUTO_USER_INFO_SAMPLE.mobile)
  const [teacherEmail, setTeacherEmail] = useState<string>(PREVIEW_AUTO_USER_INFO_SAMPLE.email)

  useEffect(() => {
    if (classCount === '') return
    const selected = parseInt(classCount, 10)
    const max = bridge.maxClassCount
    if (max != null && max > 0 && (Number.isNaN(selected) || selected > max)) {
      setClassCount('')
    }
  }, [bridge.maxClassCount, classCount])

  const autoFilledInstitutionName = isTemplateAuthoringMode ? (
    <span className="form-editor-template-field-hint-text">{TEMPLATE_AUTO_USER_INFO_HINT}</span>
  ) : (
    <CmsInput
      inputSize="medium"
      width="100%"
      value={PREVIEW_AUTO_USER_INFO_SAMPLE.institutionName}
      disabled
      readOnly
    />
  )

  const autoFilledInstitutionAddress = isTemplateAuthoringMode ? (
    <span className="form-editor-template-field-hint-text">{TEMPLATE_AUTO_USER_INFO_HINT}</span>
  ) : (
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
            disabled={classCountOptions.length === 0}
            placeholder="신청 학급 수"
            width={120}
            value={classCount === '' ? undefined : classCount}
            onChange={v => setClassCount(String(v ?? ''))}
            options={classCountOptions}
          />
          <span>개 학급</span>
          <DetailInfoForm.InputsSeparator />
          <CmsNumericInput
            inputSize="medium"
            mode="integer"
            placeholder="총 학생 수"
            width={120}
          />
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
              placeholder={DETAIL_ADDRESS_PLACEHOLDER}
              width="100%"
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>

      {showPreferredEducationForm ? (
        <DetailInfoForm.Row type="double">
          {classCountAndTotalField}
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
        </DetailInfoForm.Row>
      ) : (
        <DetailInfoForm.Row type="single">{classCountAndTotalField}</DetailInfoForm.Row>
      )}

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="담당 교사 정보"
          fullRow
          readOnlyDisplay={isTemplateAuthoringMode}
          edit={
            isTemplateAuthoringMode ? undefined : (
              <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
                <span>담당 교사</span>
                <CmsInput
                  inputSize="medium"
                  width={120}
                  value={PREVIEW_AUTO_USER_INFO_SAMPLE.teacherName}
                  disabled
                  readOnly
                />
                <DetailInfoForm.InputsSeparator />
                <span>Tel</span>
                <CmsInput
                  inputSize="medium"
                  width={170}
                  placeholder="담당 교사의 내선 번호(직통 번호)"
                />
                <DetailInfoForm.InputsSeparator />
                <span>M</span>
                <CmsInput
                  inputSize="medium"
                  width={160}
                  placeholder="휴대폰"
                  value={teacherMobile}
                  onChange={e => setTeacherMobile(e.target.value)}
                />
                <DetailInfoForm.InputsSeparator />
                <span>E-mail</span>
                <CmsInput
                  inputSize="medium"
                  width={180}
                  placeholder="이메일"
                  value={teacherEmail}
                  onChange={e => setTeacherEmail(e.target.value)}
                />
              </div>
            )
          }
          view={
            isTemplateAuthoringMode ? (
              <span className="form-editor-template-field-hint-text">
                {TEMPLATE_AUTO_USER_INFO_HINT}
              </span>
            ) : (
              '-'
            )
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="신청 사유"
          fullRow
          edit={
            <CmsTextArea
              inputSize="medium"
              rows={1}
              expandableFromSingleRow
              placeholder="신청 사유를 입력해 주세요."
              width="100%"
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
            <CmsTextArea
              inputSize="medium"
              rows={1}
              expandableFromSingleRow
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
