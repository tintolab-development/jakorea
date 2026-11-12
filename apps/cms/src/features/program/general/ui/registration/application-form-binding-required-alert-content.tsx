import { GENERAL_PROGRAM_APPLICATION_FORM_BINDING_REQUIRED_MESSAGE } from '@/features/program/general/api/get-general-program-api-error'

/** 템플릿 관리(신청 양식) — 작성 중인 등록을 잃지 않도록 새 탭으로 연다 */
const TEMPLATE_MANAGEMENT_PATH = '/templates/form-management'

/** 등록 실패: 발행된 신청 양식 미연결 (QA-0053) */
export function ApplicationFormBindingRequiredAlertContent() {
  return (
    <>
      {GENERAL_PROGRAM_APPLICATION_FORM_BINDING_REQUIRED_MESSAGE}
      {'\n'}
      <a href={TEMPLATE_MANAGEMENT_PATH} target="_blank" rel="noopener noreferrer">
        템플릿 관리 바로가기 (새 탭)
      </a>
    </>
  )
}
