import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsTextArea } from '@/shared/ui/cms-textarea'

const TEACHER_INFO_HINT = '로그인 사용자 정보가 자동으로 반영됩니다.'

/** UJAT 프로그램 학교 신청 폼 — 기본 정보 */
export function UjatProgramApplicationBasicInfoParagraph() {
  return (
    <DetailInfoForm title="기본 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="신청 기관명"
          fullRow
          readOnlyDisplay
          view={<span className="form-editor-template-field-hint-text">진월초등학교</span>}
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="기관 소재지"
          readOnlyDisplay
          view={<span className="form-editor-template-field-hint-text">광주광역시 남구 광복마을4길 40</span>}
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

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="담당 교사 정보"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <span>담당 교사</span>
              <CmsInput inputSize="medium" width={140} placeholder="홍길동" />
              <DetailInfoForm.InputsSeparator />
              <span>Tel</span>
              <CmsInput inputSize="medium" width={220} placeholder="담당 교사의 내선 번호(직통 번호)" />
              <DetailInfoForm.InputsSeparator />
              <span>M</span>
              <CmsInput inputSize="medium" width={160} placeholder="010-1234-0000" />
              <DetailInfoForm.InputsSeparator />
              <span>E-mail</span>
              <CmsInput inputSize="medium" width={200} placeholder="id***@naver.com" />
            </div>
          }
          view={<span className="form-editor-template-field-hint-text">{TEACHER_INFO_HINT}</span>}
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="기타 요청사항"
          fullRow
          edit={
            <CmsTextArea
              inputSize="medium"
              rows={2}
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
