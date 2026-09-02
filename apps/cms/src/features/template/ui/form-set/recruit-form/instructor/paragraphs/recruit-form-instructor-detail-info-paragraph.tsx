import { RecruitDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-paragraph'
import { FILE_SELECT_TOTAL_SIZE_GUIDE_LINE } from '@/shared/ui/file-select-field-limits'

const INSTRUCTOR_ATTACHMENT_ACCEPT = '.jpg,.jpeg,.png,.xls,.xlsx,.pdf,.doc,.docx'
const INSTRUCTOR_ATTACHMENT_GUIDE_LINES = [
  FILE_SELECT_TOTAL_SIZE_GUIDE_LINE,
  '- JPG, PNG, Excel, PDF, Word 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

/** 프로그램 강사 모집 폼 — 상세 정보 */
export function RecruitFormInstructorDetailInfoParagraph() {
  return (
    <RecruitDetailInfoParagraph
      wysiwygResetKey="recruit-form-instructor-extra-body"
      overlayKeyPrefix="recruitInstructor.detailInfo"
      textFields={[
        { label: '프로그램 설명', placeholder: '프로그램 설명을 작성하세요' },
        { label: '모집 안내', placeholder: '모집 안내를 작성하세요' },
        { label: '지원 방법', placeholder: '지원 방법을 작성하세요' },
      ]}
      afterEditorFields={[{ label: '기타사항', placeholder: '기타 안내 사항을 작성하세요' }]}
      attachmentAccept={INSTRUCTOR_ATTACHMENT_ACCEPT}
      attachmentGuideLines={INSTRUCTOR_ATTACHMENT_GUIDE_LINES}
    />
  )
}
