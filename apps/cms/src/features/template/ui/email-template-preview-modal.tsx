import { Button, Card, Modal } from 'antd'
import type { EmailTemplate } from '@/types/template'
import { useTemplatePreview } from '../hooks/use-template-preview'
import { useClipboard } from '../hooks/use-clipboard'
import { applyTemplateVariables } from '@/data/mock/templates'
import { defaultSampleValues } from '@/features/template/constants'

interface EmailTemplatePreviewModalProps {
  open: boolean
  previewTarget: EmailTemplate | null
  onClose: () => void
}

export function EmailTemplatePreviewModal({
  open,
  previewTarget,
  onClose,
}: EmailTemplatePreviewModalProps) {
  const { copyText } = useClipboard()

  const getPreviewContent = (template: EmailTemplate) => {
    const appliedSubject = applyTemplateVariables(template.content.subject, defaultSampleValues)
    const appliedMarkdown = applyTemplateVariables(template.content.markdown, defaultSampleValues)
    return `# ${appliedSubject}\n\n${appliedMarkdown}`
  }

  const { viewerHostRef } = useTemplatePreview(open, previewTarget, getPreviewContent)

  return (
    <Modal
      title="메일 양식 미리보기"
      open={open}
      onCancel={onClose}
      footer={[
        <Button
          key="copy-subject"
          onClick={() =>
            previewTarget &&
            copyText(applyTemplateVariables(previewTarget.content.subject, defaultSampleValues))
          }
          disabled={!previewTarget}
        >
          Subject(치환) 복사
        </Button>,
        <Button
          key="copy-md"
          type="primary"
          onClick={() =>
            previewTarget &&
            copyText(applyTemplateVariables(previewTarget.content.markdown, defaultSampleValues))
          }
          disabled={!previewTarget}
        >
          본문(치환 md) 복사
        </Button>,
        <Button key="close" onClick={onClose}>
          닫기
        </Button>,
      ]}
      width={900}
      destroyOnHidden
    >
      <Card size="small" title="렌더링 미리보기">
        <div ref={viewerHostRef} />
      </Card>
    </Modal>
  )
}
