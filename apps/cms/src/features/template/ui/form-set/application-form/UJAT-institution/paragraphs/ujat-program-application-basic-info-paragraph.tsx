import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsTextArea } from '@/shared/ui/cms-textarea'

const TEMPLATE_AUTO_USER_INFO_HINT = '로그인 사용자 정보가 자동으로 반영됩니다.'

/** 사용자 작성·미리보기 — 신청 교사/기관 자동 반영 예시 */
const WRITE_AUTO_USER_INFO_SAMPLE = {
  institutionName: '진해초등학교',
  institutionAddress: '광주광역시 남구 백운로4길 40',
  teacherName: '홍길동',
  mobile: '010-1234-0000',
  email: 'test@naver.com',
} as const

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
            isTemplateAuthoringMode ? (
              <span className="form-editor-template-field-hint-text">
                {TEMPLATE_AUTO_USER_INFO_HINT}
              </span>
            ) : (
              WRITE_AUTO_USER_INFO_SAMPLE.institutionName
            )
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="기관 소재지"
          readOnlyDisplay
          view={
            isTemplateAuthoringMode ? (
              <span className="form-editor-template-field-hint-text">
                {TEMPLATE_AUTO_USER_INFO_HINT}
              </span>
            ) : (
              WRITE_AUTO_USER_INFO_SAMPLE.institutionAddress
            )
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
                <CmsInput
                  inputSize="medium"
                  width={140}
                  value={WRITE_AUTO_USER_INFO_SAMPLE.teacherName}
                  disabled
                  readOnly
                />
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
                <CmsInput
                  inputSize="medium"
                  width={160}
                  value={WRITE_AUTO_USER_INFO_SAMPLE.mobile}
                  disabled
                  readOnly
                />
                <DetailInfoForm.InputsSeparator />
                <span>E-mail</span>
                <CmsInput
                  inputSize="medium"
                  width={200}
                  value={WRITE_AUTO_USER_INFO_SAMPLE.email}
                  disabled
                  readOnly
                />
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
                rows={1}
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
