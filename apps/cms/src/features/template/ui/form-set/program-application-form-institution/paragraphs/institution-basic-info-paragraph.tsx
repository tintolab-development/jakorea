import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextArea } from '@/shared/ui/cms-textarea'

/** 신청 학년 — 1학년 ~ 6학년만 노출 */
const APPLICATION_GRADE_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}학년`,
}))

/** 신청 학급 수(개) — 스크린: 드롭다운 + 「개 학급」 */
const CLASS_COUNT_OPTIONS = Array.from({ length: 40 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

const EDUCATION_FORM_OPTIONS = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '온/오프라인' },
] as const

/** 데모: 기관·소재지·교사 성명 등은 회원 연동 등으로 비활성(스크린샷과 동일 톤) */
const MOCK_INSTITUTION_NAME = '진월초등학교'
const MOCK_INSTITUTION_ADDRESS = '광주광역시 남구 광복마을4길 40'
const MOCK_TEACHER_NAME = '홍길동'

const DETAIL_ADDRESS_PLACEHOLDER = '교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요'

/** 프로그램 참여자 신청 폼 (학교) — 기본 정보 단락 (`DetailInfoForm` 격자) */
export function ProgramApplicationFormInstitutionBasicInfoParagraph() {
  const [applicationGrade, setApplicationGrade] = useState<string>('')
  const [classCount, setClassCount] = useState<string>('')
  const [educationForm, setEducationForm] = useState<string>(
    EDUCATION_FORM_OPTIONS[0]?.value ?? 'online'
  )

  return (
    <DetailInfoForm title="기본 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="신청 기관명"
          edit={<CmsInput inputSize="medium" disabled value={MOCK_INSTITUTION_NAME} width="100%" />}
          view="-"
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
          edit={
            <CmsInput inputSize="medium" disabled value={MOCK_INSTITUTION_ADDRESS} width="100%" />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="상세 주소"
          edit={
            <CmsInput inputSize="medium" placeholder={DETAIL_ADDRESS_PLACEHOLDER} width="100%" />
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
                placeholder="신청 학급"
                width={120}
                value={classCount === '' ? undefined : classCount}
                onChange={v => setClassCount(String(v ?? ''))}
                options={CLASS_COUNT_OPTIONS}
              />
              <span>개 학급</span>
              <DetailInfoForm.InputsSeparator />
              <CmsInput inputSize="medium" type="number" placeholder="총 학생 수" width={120} />
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
          edit={
            <div
              className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
              style={{ flexWrap: 'nowrap', alignItems: 'center', minWidth: 0 }}
            >
              <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>담당 교사</span>
              <CmsInput inputSize="medium" disabled value={MOCK_TEACHER_NAME} width="100%" />
              <DetailInfoForm.InputsSeparator />
              <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>Tel</span>
              <CmsInput
                inputSize="medium"
                placeholder="담당 교사의 내선 번호(직통 번호)"
                width="100%"
              />
              <DetailInfoForm.InputsSeparator />
              <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>M</span>
              <CmsInput inputSize="medium" defaultValue="010-1234-0000" width="100%" />
              <DetailInfoForm.InputsSeparator />
              <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>E-mail</span>
              <CmsInput inputSize="medium" defaultValue="ti***@naver.com" width="100%" />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="신청 사유"
          fullRow
          edit={
            <CmsTextArea
              inputSize="medium"
              rows={4}
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
              rows={4}
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
