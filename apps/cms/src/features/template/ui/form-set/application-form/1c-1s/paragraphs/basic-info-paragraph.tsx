import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import '@/features/template/ui/form-editor/form-editor.css'

const APPLICATION_GRADE_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}학년`,
}))

const CLASS_COUNT_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
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

const TEMPLATE_AUTO_USER_INFO_HINT = '로그인 사용자 정보가 자동으로 반영됩니다.'

const inlineChoiceStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 16 }

/** 1사1교 프로그램 참여자 신청 폼 — 기본 정보 */
export function EconomyProgramApplicationBasicInfoParagraph({
  isTemplateAuthoringMode = false,
}: {
  isTemplateAuthoringMode?: boolean
}) {
  const [applicationGrade, setApplicationGrade] = useState<string>('')
  const [classCount, setClassCount] = useState<string>('')
  const [educationFormat, setEducationFormat] = useState<string>('online')
  const [educationPlace, setEducationPlace] = useState<string>('inside')

  return (
    <DetailInfoForm title="기본 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="신청 기관명"
          readOnlyDisplay
          view={
            <span className="form-editor-template-field-hint-text">
              {TEMPLATE_AUTO_USER_INFO_HINT}
            </span>
          }
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
          view={
            <span className="form-editor-template-field-hint-text">
              {TEMPLATE_AUTO_USER_INFO_HINT}
            </span>
          }
        />
        <DetailInfoForm.Field
          label="상세 주소"
          edit={
            <CmsInput
              inputSize="medium"
              placeholder="교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요"
              width="100%"
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="신청 학급 수 및 총 인원"
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsSelect
                inputSize="medium"
                width={120}
                withAllOption={false}
                placeholder="신청 학급"
                value={classCount === '' ? undefined : classCount}
                onChange={value => setClassCount(String(value ?? ''))}
                options={CLASS_COUNT_OPTIONS}
              />
              <span>개 학급</span>
              <span style={{ color: '#9ca3af' }}>|</span>
              <CmsNumericInput
                inputSize="medium"
                width={120}
                mode="integer"
                placeholder="총 학생 수"
              />
              <span>명</span>
            </div>
          }
          view="-"
        />
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
              <span style={{ color: '#9ca3af' }}>|</span>
              <CmsInput
                inputSize="medium"
                placeholder="교육이 진행될 상세 장소를 입력해 주세요"
                width="100%"
                style={{ flex: '1 1 280px', minWidth: 180 }}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="담당 교사 정보"
          fullRow
          readOnlyDisplay={isTemplateAuthoringMode}
          edit={
            isTemplateAuthoringMode ? undefined : (
              <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
                <span>담당 교사</span>
                <span className="form-editor-template-field-hint-text">
                  {TEMPLATE_AUTO_USER_INFO_HINT}
                </span>
                <span style={{ color: '#9ca3af' }}>|</span>
                <span>Tel</span>
                <CmsInput
                  inputSize="medium"
                  width={170}
                  placeholder="담당 교사의 내선 번호(직통 번호)"
                />
                <span style={{ color: '#9ca3af' }}>|</span>
                <span>M</span>
                <CmsInput inputSize="medium" width={160} placeholder="휴대폰" />
                <span style={{ color: '#9ca3af' }}>|</span>
                <span>E-mail</span>
                <CmsInput inputSize="medium" width={180} placeholder="이메일" />
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
