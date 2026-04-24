import { CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { CmsButton } from '@/shared/ui/cms-button'

export function FormParagraphCardActions() {
  return (
    <div className="form-editor-card__actions">
      <CmsButton variant="primary" type="button" disabled>
        + 단락 추가
      </CmsButton>
      <CmsButton variant="secondary" type="button" icon={<CopyOutlined />} disabled>
        단락 복제
      </CmsButton>
      <CmsButton variant="secondary" type="button" icon={<DeleteOutlined />} disabled>
        단락 삭제
      </CmsButton>
    </div>
  )
}

/** 기본 양식 MVP — 단락 추가/복제/삭제는 추후 API 연동 시 활성화 */
export function FormParagraphCardActionsMinimal() {
  return (
    <div className="form-editor-card__actions form-editor-card__actions--minimal">
      <CmsButton variant="primary" type="button" disabled>
        + 단락 추가
      </CmsButton>
      <CmsButton variant="secondary" type="button" disabled>
        단락 복제
      </CmsButton>
      <CmsButton variant="secondary" type="button" icon={<DeleteOutlined />} disabled>
        단락 삭제
      </CmsButton>
    </div>
  )
}
