import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui'
import { CmsTableEmptyState } from '@/shared/ui/cms-table-empty-state'
import {
  ALIMTALK_MESSAGE_TYPE_LABEL,
  type AlimtalkTemplateItem,
} from '@/features/notifications/model/alimtalk-template/types'

type DetailPanelProps = {
  template: AlimtalkTemplateItem | null
  categoryName: string
  onPreview: () => void
  /** 선택한 폴더 안에 템플릿이 없을 때 — 공통 빈 상태(등록된 데이터 없음) */
  emptyFolder?: boolean
}

export function DetailPanel({
  template,
  categoryName,
  onPreview,
  emptyFolder = false,
}: DetailPanelProps) {
  if (!template) {
    return (
      <div className="alimtalk-template-detail alimtalk-template-detail--empty">
        {emptyFolder ? <CmsTableEmptyState variant="no-data" /> : null}
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
