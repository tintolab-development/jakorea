import dayjs from 'dayjs'
import { AdminEmptyState } from '@jakorea/admin-ui/empty'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui'
import {
  ALIMTALK_MESSAGE_TYPE_LABEL,
  type AlimtalkTemplateItem,
} from '@/features/notifications/model/alimtalk-template/types'

/** 시안 17119:169121 — 템플릿 미선택 빈 상태(아이콘 없음) */
const UNSELECTED_TITLE = '템플릿을 먼저 선택해 주세요.'
const UNSELECTED_DESCRIPTION = '항목이 선택되면 이곳에 목록이 표시됩니다.'

type DetailPanelProps = {
  template: AlimtalkTemplateItem | null
  categoryName: string
  onPreview: () => void
}

export function DetailPanel({ template, categoryName, onPreview }: DetailPanelProps) {
  /** 템플릿 미선택·빈 폴더 선택 모두 시안 빈 상태 */
  if (!template) {
    return (
      <div className="alimtalk-template-detail alimtalk-template-detail--empty">
        <AdminEmptyState title={UNSELECTED_TITLE} description={UNSELECTED_DESCRIPTION} />
      </div>
    )
  }

  return (
    <div className="alimtalk-template-detail">
      <DetailInfoForm title="등록·수정일시" hideHeader mode="view">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="등록일시"
            view={dayjs(template.registeredAt).format('YYYY.MM.DD HH:mm')}
          />
          <DetailInfoForm.Field
            label="수정일시"
            view={dayjs(template.updatedAt).format('YYYY.MM.DD HH:mm')}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm title="템플릿 상세" hideHeader mode="view">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="카테고리명" view={categoryName} />
          <DetailInfoForm.Field label="템플릿명" view={template.templateName} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="발신 프로필" view={template.senderProfile} />
          <DetailInfoForm.Field
            label="메시지 유형"
            view={ALIMTALK_MESSAGE_TYPE_LABEL[template.messageType]}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="템플릿 상세"
            fullRow
            view={
              <CmsButton
                variant="secondary"
                size="small"
                type="button"
                className="alimtalk-template-detail__preview-btn"
                onClick={onPreview}
              >
                미리보기
              </CmsButton>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
