import { useMemo, useState, useEffect } from 'react'
import { buildInstitutionClassCountOptions } from '@/features/template/lib/participant-recruitment-institution-limits'
import { useInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
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

/** 프로그램 참여자 신청 폼 (학교) — 기본 정보 단락 (`DetailInfoForm` 격자) */
export function ProgramApplicationFormInstitutionBasicInfoParagraph() {
  const bridge = useInstitutionApplicationProgramBridge()
  const classCountOptions = useMemo(
    () => buildInstitutionClassCountOptions(bridge.maxClassCount),
    [bridge.maxClassCount]
  )

  const [applicationGrade, setApplicationGrade] = useState<string>('')
  const [classCount, setClassCount] = useState<string>('')
  const [educationForm, setEducationForm] = useState<string>(
    EDUCATION_FORM_OPTIONS[0]?.value ?? 'online'
  )

  useEffect(() => {
    if (classCount === '') return
    const selected = parseInt(classCount, 10)
    const max = bridge.maxClassCount
    if (max != null && max > 0 && (Number.isNaN(selected) || selected > max)) {
      setClassCount('')
    }
  }, [bridge.maxClassCount, classCount])

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
              placeholder={DETAIL_ADDRESS_PLACEHOLDER}
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
              <CmsInput
                inputSize="medium"
                type="number"
                placeholder="총 학생 수"
                width={120}
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
              value={educationForm}
              onChange={e => setEducationForm(e.target.value)}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}
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

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="담당 교사 정보"
          fullRow
          readOnlyDisplay
          view={
            <span className="form-editor-template-field-hint-text">
              {TEMPLATE_AUTO_USER_INFO_HINT}
            </span>
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
