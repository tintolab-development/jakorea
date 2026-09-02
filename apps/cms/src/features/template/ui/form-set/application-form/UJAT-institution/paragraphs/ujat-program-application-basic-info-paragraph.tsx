import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsTextArea } from '@/shared/ui/cms-textarea'

const TEMPLATE_AUTO_USER_INFO_HINT = '로그인 사용자 정보가 자동으로 반영됩니다.'

/** UJAT 프로그램 학교 신청 폼 — 기본 정보 */
export function UjatProgramApplicationBasicInfoParagraph({
  isTemplateAuthoringMode = false,
}: {
  isTemplateAuthoringMode?: boolean
}) {
  const [detailAddress, setDetailAddress] = useGeneralApplicationOverlayKv<string>(
    'application.ujat.inst.basicInfo.detailAddress',
    ''
  )
  const [teacherTel, setTeacherTel] = useGeneralApplicationOverlayKv<string>(
    'application.ujat.inst.basicInfo.teacherTel',
    ''
  )
  const [otherRequestsNotApplicable, setOtherRequestsNotApplicable] =
    useGeneralApplicationOverlayKv<boolean>(
      'application.ujat.inst.basicInfo.otherRequestsNotApplicable',
      false
    )
  const [otherRequests, setOtherRequests] = useGeneralApplicationOverlayKv<string>(
    'application.ujat.inst.basicInfo.otherRequests',
    ''
  )

  return (
    <DetailInfoForm title="기본 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="신청 기관명"
          fullRow
          readOnlyDisplay
          view={
            <span className="form-editor-template-field-hint-text">
              {TEMPLATE_AUTO_USER_INFO_HINT}
            </span>
          }
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
              value={detailAddress}
              onChange={e => setDetailAddress(e.target.value)}
            />
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
                <CmsInput inputSize="medium" width={140} placeholder="홍길동" disabled readOnly />
                <DetailInfoForm.InputsSeparator />
                <span>Tel</span>
                <CmsInput
                  inputSize="medium"
                  width={220}
                  placeholder="담당 교사의 내선 번호(직통 번호)"
                  value={teacherTel}
                  onChange={e => setTeacherTel(e.target.value)}
                />
                <DetailInfoForm.InputsSeparator />
                <span>M</span>
                <CmsInput inputSize="medium" width={160} placeholder="010-1234-0000" disabled readOnly />
                <DetailInfoForm.InputsSeparator />
                <span>E-mail</span>
                <CmsInput inputSize="medium" width={200} placeholder="id***@naver.com" disabled readOnly />
              </div>
            )
          }
          view={
            <span className="form-editor-template-field-hint-text">
              {TEMPLATE_AUTO_USER_INFO_HINT}
            </span>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="기타 요청사항"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsCheckbox
                checked={otherRequestsNotApplicable}
                onChange={e => setOtherRequestsNotApplicable(e.target.checked)}
              >
                해당 없음
              </CmsCheckbox>
              <DetailInfoForm.InputsSeparator />
              <CmsTextArea
                inputSize="medium"
                rows={2}
                placeholder="기타 요청사항을 입력해 주세요."
                width="100%"
                value={otherRequests}
                onChange={e => setOtherRequests(e.target.value)}
                disabled={otherRequestsNotApplicable}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
