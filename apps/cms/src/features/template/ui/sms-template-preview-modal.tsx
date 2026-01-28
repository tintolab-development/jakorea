import { Button, Card, Col, Divider, Modal, Row, Typography } from 'antd'
import type { SmsTemplate } from '@/types/template'
import { useClipboard } from '../hooks/use-clipboard'
import { applyTemplateVariables, estimateMessageBytes } from '@/data/mock/templates'
import { defaultSampleValues } from '@/features/template/constants'
import { LAYOUT_CONSTANTS } from '@/shared/constants'

const { Text } = Typography

function getMessageType(bytes: number) {
  return bytes <= 90 ? 'SMS(단문)' : 'LMS(장문)'
}

interface SmsTemplatePreviewModalProps {
  open: boolean
  previewTarget: SmsTemplate | null
  onClose: () => void
}

export function SmsTemplatePreviewModal({
  open,
  previewTarget,
  onClose,
}: SmsTemplatePreviewModalProps) {
  const { copyText } = useClipboard()

  return (
    <Modal
      title="문자 양식 미리보기"
      open={open}
      onCancel={onClose}
      footer={[
        <Button
          key="copy-original"
          onClick={() => previewTarget && copyText(previewTarget.content.text)}
          disabled={!previewTarget}
        >
          원문 복사
        </Button>,
        <Button
          key="copy-applied"
          type="primary"
          onClick={() =>
            previewTarget &&
            copyText(applyTemplateVariables(previewTarget.content.text, defaultSampleValues))
          }
          disabled={!previewTarget}
        >
          샘플 치환 복사
        </Button>,
        <Button key="close" onClick={onClose}>
          닫기
        </Button>,
      ]}
      width={900}
      destroyOnHidden
    >
      {previewTarget ? (
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="원문">
              <Text type="secondary" style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}>
                {estimateMessageBytes(previewTarget.content.text)} bytes ·{' '}
                {getMessageType(estimateMessageBytes(previewTarget.content.text))}
              </Text>
              <Divider style={{ margin: `${LAYOUT_CONSTANTS.margins.sm}px 0` }} />
              <div
                style={{
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: LAYOUT_CONSTANTS.spacing.md,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  minHeight: 220,
                }}
              >
                {previewTarget.content.text}
              </div>
              <Divider style={{ margin: `${LAYOUT_CONSTANTS.margins.md}px 0` }} />
              <Text type="secondary" style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}>
                변수: {previewTarget.content.variables.join(', ') || '-'}
              </Text>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="샘플 치환본">
              {(() => {
                const applied = applyTemplateVariables(previewTarget.content.text, defaultSampleValues)
                const bytes = estimateMessageBytes(applied)
                return (
                  <>
                    <Text type="secondary" style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}>
                      {bytes} bytes · {getMessageType(bytes)}
                    </Text>
                    <Divider style={{ margin: `${LAYOUT_CONSTANTS.margins.sm}px 0` }} />
                    <div
                      style={{
                        background: '#f6ffed',
                        border: '1px solid #b7eb8f',
                        borderRadius: 8,
                        padding: LAYOUT_CONSTANTS.spacing.md,
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                        minHeight: 220,
                      }}
                    >
                      {applied}
                    </div>
                  </>
                )
              })()}
              <Divider style={{ margin: `${LAYOUT_CONSTANTS.margins.md}px 0` }} />
              <Text type="secondary" style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}>
                샘플 값: {Object.entries(defaultSampleValues).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(', ')} ...
              </Text>
            </Card>
          </Col>
        </Row>
      ) : (
        <Text type="secondary">미리보기할 템플릿이 없습니다.</Text>
      )}
    </Modal>
  )
}
