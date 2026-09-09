import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui'
import type { SmsTemplateItem } from '@/features/notifications/model/sms-template/types'

type DetailPanelProps = {
  template: SmsTemplateItem | null
  categoryName: string
  onPreview: () => void
  loading?: boolean
}

function attachmentView(template: SmsTemplateItem): string {
  if (template.messageType !== 'MMS') return 'MMS에서만 첨부할 수 있습니다.'
  if (template.attachmentFileNames.length === 0) return '첨부된 파일이 없습니다.'
  return template.attachmentFileNames.join(', ')
}

function subjectView(template: SmsTemplateItem): string {
  if (template.messageType === 'SMS') return '사용하지 않음'
  return template.subject?.trim() || '-'
}

export function DetailPanel({ template, categoryName, onPreview, loading }: DetailPanelProps) {
  if (loading) {
    return (
      <div className="sms-template-detail sms-template-detail--empty" aria-busy="true">
        불러오는 중…
      </div>
    )
  }
  if (!template) {
    return <div className="sms-template-detail sms-template-detail--empty" />
  }

  return (
    <div className="sms-template-detail">
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
          <DetailInfoForm.Field
            label="보낸사람(전화번호)"
            view={template.senderPhone.trim() || '-'}
          />
          <DetailInfoForm.Field label="메시지 유형" view={template.messageType} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="제목" view={subjectView(template)} />
          <DetailInfoForm.Field label="첨부" view={attachmentView(template)} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="미리보기"
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
