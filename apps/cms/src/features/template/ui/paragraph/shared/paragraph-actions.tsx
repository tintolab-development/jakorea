import { CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { CmsButton } from '@/shared/ui/cms-button'

export function SurveyParagraphCardActions() {
  return (
    <div className="survey-editor-card__actions">
      <CmsButton variant="primary" size="small" type="button" disabled>
        + 단락 추가
      </CmsButton>
      <CmsButton variant="secondary" size="small" type="button" icon={<CopyOutlined />} disabled>
        단락 복제
      </CmsButton>
      <CmsButton variant="secondary" size="small" type="button" icon={<DeleteOutlined />} disabled>
        단락 삭제
      </CmsButton>
    </div>
  )
}

/** 고정 기본 양식 MVP — 단락 추가/복제/삭제는 추후 API 연동 시 활성화 */
export function SurveyParagraphCardActionsMinimal() {
  return (
    <div className="survey-editor-card__actions survey-editor-card__actions--minimal">
      <CmsButton variant="primary" size="small" type="button" disabled>
        + 단락 추가
      </CmsButton>
      <CmsButton variant="secondary" size="small" type="button" disabled>
        단락 복제
      </CmsButton>
      <CmsButton variant="secondary" size="small" type="button" icon={<DeleteOutlined />} disabled>
        단락 삭제
      </CmsButton>
    </div>
  )
}
