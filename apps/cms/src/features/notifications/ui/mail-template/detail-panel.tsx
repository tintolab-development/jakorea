import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui'
import type { MailTemplateItem } from '@/features/notifications/model/mail-template/types'

type DetailPanelProps = {
  template: MailTemplateItem | null
  categoryName: string
  onPreview: () => void
}

export function DetailPanel({ template, categoryName, onPreview }: DetailPanelProps) {
  if (!template) {
    return <div className="mail-template-detail mail-template-detail--empty" />
  }

  const senderView = `${template.senderName} | ${template.senderEmail}`

  return (
    <div className="mail-template-detail">
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
          <DetailInfoForm.Field label="발신 메일" view={senderView} />
          <DetailInfoForm.Field label="첨부 파일" view={template.attachmentFileName || '-'} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="템플릿 상세"
            fullRow
            view={
              <CmsButton variant="secondary" size="medium" type="button" onClick={onPreview}>
                미리보기
              </CmsButton>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
