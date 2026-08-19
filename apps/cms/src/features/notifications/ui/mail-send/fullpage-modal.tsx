import { useState } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import {
  CmsButton,
  CmsDatePicker,
  CmsInput,
  CmsRadio,
  useCmsAlert,
} from '@/shared/ui'
import { ComposeFields } from '@/features/notifications/ui/mail-template/compose-fields'
import { PreviewModal } from '@/features/notifications/ui/mail-template/preview-modal'
import type {
  MailPreviewAttachment,
  MailPreviewRecipient,
} from '@/features/notifications/model/mail-template/preview'
import { VariablesPanel } from '@/features/notifications/ui/mail-template/variables-panel'
import { MAIL_TEMPLATE_ITEM_MOCK } from '@/features/notifications/model/mail-template/mock'
import { isMailSendVariableLocked } from '@/features/notifications/model/mail-send/flags'
import { MAIL_SEND_PROGRAM_MOCK } from '@/features/notifications/model/mail-send/mock'
import { useMailSendForm } from './use-form'
import { ProgramSelectField } from './program-select-field'
import { TemplateSelectField } from './template-select-field'
import { RecipientTable } from './recipient-table'
import { RecipientSelectModal } from './recipient-select-modal'
import { RecipientManualModal } from './recipient-manual-modal'
import './fullpage-modal.css'

type SendFullpageModalProps = {
  open: boolean
  onClose: () => void
}

export function SendFullpageModal({ open, onClose }: SendFullpageModalProps) {
  const { showAlert } = useCmsAlert()
  const form = useMailSendForm(open)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewBodyHtml, setPreviewBodyHtml] = useState('')
  const [previewSenderName, setPreviewSenderName] = useState('')
  const [previewSenderEmail, setPreviewSenderEmail] = useState('')
  const [previewAttachments, setPreviewAttachments] = useState<MailPreviewAttachment[]>([])
  const [previewRecipient, setPreviewRecipient] = useState<MailPreviewRecipient | undefined>()
  const [previewAt, setPreviewAt] = useState<string | undefined>()
  const [recipientSelectOpen, setRecipientSelectOpen] = useState(false)
  const [recipientManualOpen, setRecipientManualOpen] = useState(false)
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([])
  const variableLocked = isMailSendVariableLocked(form.programId)
  const hasTemplates = MAIL_TEMPLATE_ITEM_MOCK.length > 0

  const handleClose = () => {
    setPreviewOpen(false)
    setRecipientSelectOpen(false)
    setRecipientManualOpen(false)
    setSelectedRecipientIds([])
    onClose()
  }

  const handleAttachmentAdd = (files: File[]) => {
    const result = form.handleAttachmentAdd(files)
    if (!result.ok) {
      showAlert({ title: '안내', content: result.message })
    }
  }

  const handleDeleteSelected = () => {
    if (selectedRecipientIds.length === 0) {
      showAlert({ title: '안내', content: '삭제할 수신자를 선택하세요.' })
      return
    }
    form.removeRecipients(selectedRecipientIds)
    setSelectedRecipientIds([])
  }

  const handlePreview = () => {
    const draft = form.getDraft()
    setPreviewSubject(draft.subject)
    setPreviewBodyHtml(draft.bodyHtml)
    setPreviewSenderName(draft.senderName)
    setPreviewSenderEmail(draft.senderEmail)
    setPreviewAttachments(form.getPreviewAttachments())
    setPreviewRecipient(form.getPreviewRecipient())
    setPreviewAt(form.getPreviewAt())
    setPreviewOpen(true)
  }

  const handleSend = () => {
    const error = form.validateRequired()
    if (error) {
      showAlert({ title: '필수 입력 안내', content: error })
      return
    }
    showAlert({ title: '안내', content: '메일을 발송했습니다.' })
    handleClose()
  }

  return (
    <>
      <TealHeaderModal
        open={open}
        onCancel={handleClose}
        title="메일 발송"
        size="full"
        hideHeader
        className="mail-send-fullpage-modal teal-header-modal--full"
      >
        <div className="mail-send-fullpage-modal__shell">
          <header className="mail-send-fullpage-modal__title-row">
            <span className="mail-send-fullpage-modal__title-text">메일 발송</span>
            <button
              type="button"
              className="mail-send-fullpage-modal__title-close"
              onClick={handleClose}
              aria-label="닫기"
            >
              <CloseOutlined />
            </button>
          </header>

          <div className="mail-send-fullpage-modal__body">
            <div className="mail-send-fullpage-modal__notice">
              <p className="mail-send-fullpage-modal__notice-text">
                * 프로그램은 현재 운영 중인 프로그램만 선택 가능하며, 전체 선택 시 변수값 사용이
                불가합니다.
              </p>
              <div className="mail-send-fullpage-modal__notice-actions">
                <CmsButton variant="cancel" size="large" width={140} type="button" onClick={handleClose}>
                  취소
                </CmsButton>
                <CmsButton
                  variant="secondary"
                  size="large"
                  width={140}
                  type="button"
                  onClick={handlePreview}
                >
                  미리보기
                </CmsButton>
                <CmsButton
                  variant="primary"
                  size="large"
                  width={140}
                  type="button"
                  onClick={handleSend}
                >
                  메일 발송
                </CmsButton>
              </div>
            </div>

            <div className="mail-send-fullpage-modal__layout">
              <div className="mail-send-fullpage-modal__main">
                <section className="mail-send-fullpage__widget">
                  <h3 className="mail-send-fullpage__section-title">1. 기본 설정</h3>
                  <DetailInfoForm title="기본 설정" hideHeader mode="edit">
                    <DetailInfoForm.Row type="single">
                      <DetailInfoForm.Field
                        label="대상 프로그램"
                        fullRow
                        view=""
                        edit={
                          <ProgramSelectField
                            value={form.programId}
                            programs={MAIL_SEND_PROGRAM_MOCK}
                            onSelect={program => form.setProgramId(program.id)}
                          />
                        }
                      />
                    </DetailInfoForm.Row>
                    <DetailInfoForm.Row type="double">
                      <DetailInfoForm.Field
                        label="템플릿"
                        view=""
                        edit={
                          <TemplateSelectField
                            value={form.templateId}
                            templates={MAIL_TEMPLATE_ITEM_MOCK}
                            disabled={!hasTemplates}
                            onSelect={form.applyTemplate}
                          />
                        }
                      />
                      <DetailInfoForm.Field
                        label="발송 시점"
                        required
                        view={form.sendTiming === 'immediate' ? '즉시 발송' : '예약 발송'}
                        edit={
                          <div className="mail-send-fullpage__timing">
                            <CmsRadio.Group
                              value={form.sendTiming}
                              onChange={event => {
                                const next = event.target.value
                                if (next === 'immediate' || next === 'scheduled') {
                                  form.setSendTiming(next)
                                }
                              }}
                            >
                              <CmsRadio value="immediate">즉시 발송</CmsRadio>
                              <CmsRadio value="scheduled">예약 발송</CmsRadio>
                            </CmsRadio.Group>
                            <span className="mail-send-fullpage__timing-divider" aria-hidden />
                            <CmsDatePicker
                              showTime
                              inputSize="large"
                              placeholder="날짜를 선택하세요"
                              disabled={form.sendTiming !== 'scheduled'}
                              value={form.scheduledAt}
                              onChange={value => form.setScheduledAt(value)}
                            />
                          </div>
                        }
                      />
                    </DetailInfoForm.Row>
                    <DetailInfoForm.Row type="double">
                      <DetailInfoForm.Field
                        label="발신자명"
                        view={form.senderName}
                        edit={
                          <CmsInput
                            inputSize="large"
                            width="100%"
                            allowClear={false}
                            placeholder="발신자명을 입력하세요"
                            value={form.senderName}
                            onChange={event => form.setSenderName(event.target.value)}
                          />
                        }
                      />
                      <DetailInfoForm.Field
                        label="발신 메일"
                        required
                        view={form.senderEmail}
                        edit={
                          <CmsInput
                            inputSize="large"
                            width="100%"
                            allowClear={false}
                            placeholder="발신 메일을 입력하세요"
                            value={form.senderEmail}
                            onChange={event => form.setSenderEmail(event.target.value)}
                          />
                        }
                      />
                    </DetailInfoForm.Row>
                  </DetailInfoForm>
                </section>

                <section className="mail-send-fullpage__widget mail-send-fullpage__widget--recipients">
                  <div className="mail-send-fullpage__section-head">
                    <h3 className="mail-send-fullpage__section-title">
                      2. 수신자 설정
                      <span className="mail-send-fullpage__required">*</span>
                    </h3>
                    <div className="mail-send-fullpage__section-actions">
                      <CmsButton
                        variant="delete"
                        size="large"
                        type="button"
                        onClick={handleDeleteSelected}
                      >
                        선택 삭제
                      </CmsButton>
                      <CmsButton
                        variant="secondary"
                        size="large"
                        type="button"
                        onClick={() => setRecipientManualOpen(true)}
                      >
                        수신자 직접 입력
                      </CmsButton>
                      <CmsButton
                        variant="secondary"
                        size="large"
                        type="button"
                        onClick={() => setRecipientSelectOpen(true)}
                      >
                        수신자 설정
                      </CmsButton>
                    </div>
                  </div>
                  <RecipientTable
                    recipients={form.recipients}
                    selectedIds={selectedRecipientIds}
                    onSelectedIdsChange={setSelectedRecipientIds}
                  />
                </section>

                <section className="mail-send-fullpage__widget">
                  <h3 className="mail-send-fullpage__section-title">3. 메일 작성</h3>
                  <DetailInfoForm
                    title="메일 작성"
                    hideHeader
                    mode="edit"
                    className="mail-send-fullpage__compose"
                  >
                    <ComposeFields
                      editor={form.editor}
                      editorMinHeight={form.editorMinHeight}
                      subject={form.subject}
                      subjectMaxLength={form.subjectMaxLength}
                      subjectInputRef={form.subjectInputRef}
                      attachmentFileNames={form.attachmentFileNames}
                      onSubjectChange={form.handleSubjectChange}
                      onRememberSubjectRange={form.rememberSubjectRange}
                      onAttachmentAdd={handleAttachmentAdd}
                      onAttachmentRemove={form.handleAttachmentRemove}
                    />
                  </DetailInfoForm>
                </section>
              </div>

              <VariablesPanel
                onInsert={form.insertVariable}
                disabled={variableLocked}
                disabledReason={form.variableLockedMessage}
                onDisabledInsert={() =>
                  showAlert({ title: '안내', content: form.variableLockedMessage })
                }
              />
            </div>
          </div>
        </div>
      </TealHeaderModal>

      <PreviewModal
        open={open && previewOpen}
        zIndex={1100}
        subject={previewSubject}
        bodyHtml={previewBodyHtml}
        senderName={previewSenderName}
        senderEmail={previewSenderEmail}
        attachments={previewAttachments}
        recipient={previewRecipient}
        previewAt={previewAt}
        onClose={() => setPreviewOpen(false)}
      />
      <RecipientSelectModal
        key={recipientSelectOpen ? 'recipient-select-open' : 'recipient-select-closed'}
        open={open && recipientSelectOpen}
        selectedIds={form.recipients.map(item => item.id)}
        onClose={() => setRecipientSelectOpen(false)}
        onConfirm={recipients => {
          form.addRecipients(recipients)
          setRecipientSelectOpen(false)
        }}
      />
      <RecipientManualModal
        key={recipientManualOpen ? 'recipient-manual-open' : 'recipient-manual-closed'}
        open={open && recipientManualOpen}
        emails={form.recipients.filter(item => item.source === 'manual').map(item => item.email)}
        onClose={() => setRecipientManualOpen(false)}
        onConfirm={emails => {
          form.addManualEmails(emails)
          setRecipientManualOpen(false)
        }}
      />
    </>
  )
}
