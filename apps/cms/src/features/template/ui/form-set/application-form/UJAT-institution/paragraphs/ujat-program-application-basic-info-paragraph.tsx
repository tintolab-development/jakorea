import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsTextArea } from '@/shared/ui/cms-textarea'

/** 미리보기·프로그램 연동 — 신청 교사/기관 자동 반영 예시 */
const PREVIEW_AUTO_USER_INFO_SAMPLE = {
  institutionName: '진해초등학교',
  institutionAddress: '광주광역시 남구 백운로4길 40',
  teacherName: '홍길동',
  tel: '',
  mobile: '',
  email: '',
} as const

/** UJAT 프로그램 학교 신청 폼 — 기본 정보 */
export function UjatProgramApplicationBasicInfoParagraph({
  isTemplateAuthoringMode: _isTemplateAuthoringMode = false,
}: {
  isTemplateAuthoringMode?: boolean
}) {
  const [detailAddress, setDetailAddress] = useGeneralApplicationOverlayKv<string>(
    'application.ujat.inst.basicInfo.detailAddress',
    ''
  )
  const [teacherTel, setTeacherTel] = useGeneralApplicationOverlayKv<string>(
    'application.ujat.inst.basicInfo.teacherTel',
    PREVIEW_AUTO_USER_INFO_SAMPLE.tel
  )
  const [teacherMobile, setTeacherMobile] = useGeneralApplicationOverlayKv<string>(
    'application.ujat.inst.basicInfo.teacherMobile',
    PREVIEW_AUTO_USER_INFO_SAMPLE.mobile
  )
  const [teacherEmail, setTeacherEmail] = useGeneralApplicationOverlayKv<string>(
    'application.ujat.inst.basicInfo.teacherEmail',
    PREVIEW_AUTO_USER_INFO_SAMPLE.email
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

  const teacherInfoInputs = (
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

  return (
    <DetailInfoForm title="기본 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="신청 기관명"
          fullRow
          readOnlyDisplay
          view={autoFilledInstitutionName}
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

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field label="담당 교사 정보" fullRow edit={teacherInfoInputs} view="-" />
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
