import { CloseOutlined } from '@ant-design/icons'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import {
  CmsButton,
  CmsInput,
  CmsInputIconClick,
  ConfirmModal,
  useCmsAlert,
} from '@/shared/ui'
import { shouldUseMailTemplatesRemoteApi } from '@/features/notifications/api/mail-template-service'
import { useMailTemplateVariablesQuery } from '@/features/notifications/hooks/use-mail-send-queries'
import { groupMailTemplateVariablesFromCatalog } from '@/features/notifications/model/mail-template/variables'
import { MAIL_TEMPLATE_NAME_PLACEHOLDER } from '@/features/notifications/model/mail-template/template-name'
import type { MailTemplateItem } from '@/features/notifications/model/mail-template/types'
import type { MailPreviewAttachment } from '@/features/notifications/model/mail-template/preview'
import { ComposeFields } from './compose-fields'
import { PreviewModal } from './preview-modal'
import {
  useMailTemplateForm,
  type MailTemplateFormDraft,
  type MailTemplateFormMode,
} from './use-form'
import { VariablesPanel } from './variables-panel'
import './form-modal.css'

type BasicSettingsFieldsProps = {
  templateName: string
  senderName: string
  senderEmail: string
  onTemplateNameChange: (value: string, options?: { composing?: boolean }) => void
  onSenderNameChange: (value: string) => void
  onSenderEmailChange: (value: string) => void
}

const BasicSettingsFields = memo(function BasicSettingsFields({
  templateName,
  senderName,
  senderEmail,
  onTemplateNameChange,
  onSenderNameChange,
  onSenderEmailChange,
}: BasicSettingsFieldsProps) {
  const composingNameRef = useRef(false)

  return (
    <DetailInfoForm title="기본 설정" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="템플릿명"
          required
          fullRow
          view={templateName}
          edit={
            <CmsInput
              inputSize="large"
              width="100%"
              allowClear={false}
              placeholder={MAIL_TEMPLATE_NAME_PLACEHOLDER}
              value={templateName}
              onCompositionStart={() => {
                composingNameRef.current = true
              }}
              onCompositionEnd={event => {
                composingNameRef.current = false
                onTemplateNameChange(event.currentTarget.value)
              }}
              onChange={event => {
                const next = event.target.value
                const native = event.nativeEvent as InputEvent
                if (composingNameRef.current || native.isComposing) {
                  onTemplateNameChange(next, { composing: true })
                  return
                }
                onTemplateNameChange(next)
              }}
            />
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="발신자명"
          view={senderName}
          edit={
            <CmsInput
              inputSize="large"
              width="100%"
              allowClear={false}
              placeholder="발신자명을 입력하세요"
              value={senderName}
              onChange={event => onSenderNameChange(event.target.value)}
            />
          }
        />
        <DetailInfoForm.Field
          label="발신 메일"
          required
          view={senderEmail}
          edit={
            <CmsInput
              inputSize="large"
              width="100%"
              allowClear={false}
              placeholder="발신 메일을 입력하세요"
              value={senderEmail}
              onChange={event => onSenderEmailChange(event.target.value)}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
})

type PreviewDraft = MailTemplateFormDraft & {
  attachments: MailPreviewAttachment[]
  previewAt: string
}

type FormModalProps = {
  open: boolean
  mode: MailTemplateFormMode
  template: MailTemplateItem | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (draft: MailTemplateFormDraft) => void
  onDelete?: () => void
}

export function FormModal({
  open,
  mode,
  template,
  submitting = false,
  onClose,
  onSubmit,
  onDelete,
}: FormModalProps) {
  const { showAlert } = useCmsAlert()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [previewDraft, setPreviewDraft] = useState<PreviewDraft | null>(null)
  const form = useMailTemplateForm(open, mode, template)
  const remote = shouldUseMailTemplatesRemoteApi()
  const variablesQuery = useMailTemplateVariablesQuery({}, open && remote)
  const variableGroups = useMemo(
    () => groupMailTemplateVariablesFromCatalog(variablesQuery.data ?? []),
    [variablesQuery.data]
  )
  const isEdit = mode === 'edit'
  const headerTitle = form.templateName.trim() || MAIL_TEMPLATE_NAME_PLACEHOLDER
  const [titleEditing, setTitleEditing] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitleEditing(mode === 'create')
  }, [open, mode])

  const handlePreview = () => {
    const draft = form.getDraft()
    setPreviewDraft({
      ...draft,
      attachments: form.getPreviewAttachments(),
      previewAt: new Date().toISOString(),
    })
    setPreviewOpen(true)
  }

  const handleSubmit = () => {
    const error = form.validateRequired()
    if (error) {
      showAlert({ title: '필수 입력 안내', content: error })
      return
    }
    onSubmit(form.getDraft())
  }

  const handleAttachmentAdd = useCallback(
    (files: File[]) => {
      const result = form.handleAttachmentAdd(files)
      if (!result.ok) {
        showAlert({ title: '안내', content: result.message })
      }
    },
    [form.handleAttachmentAdd, showAlert]
  )

  return (
    <>
      <TealHeaderModal
        open={open}
        onCancel={onClose}
        title={headerTitle}
        size="full"
        hideHeader
        className="mail-template-form-modal teal-header-modal--full"
      >
        <div className="mail-template-form-modal__shell">
          <header className="mail-template-form-modal__title-row">
            <div className="mail-template-form-modal__title-edit">
              <CmsInputIconClick
                value={form.templateName}
                editing={titleEditing}
                placeholder={MAIL_TEMPLATE_NAME_PLACEHOLDER}
                onChange={form.setTemplateName}
                onRequestEdit={() => setTitleEditing(true)}
                onCommitEdit={() => setTitleEditing(false)}
                inputAriaLabel={MAIL_TEMPLATE_NAME_PLACEHOLDER}
                editButtonAriaLabel="템플릿명 수정"
                containerClassName="mail-template-form-modal__title-edit-row"
                inputClassName="mail-template-form-modal__title-input mail-template-form-modal__title-input--editing"
                textClassName="mail-template-form-modal__title-text"
                editButtonClassName="mail-template-form-modal__title-edit-btn"
              />
            </div>
            <button
              type="button"
              className="mail-template-form-modal__title-close"
              onClick={onClose}
              aria-label="닫기"
            >
              <CloseOutlined />
            </button>
          </header>

          <div className="mail-template-form-modal__body">
            <div className="mail-template-form-modal__notice">
              <div className="mail-template-form-modal__notice-actions">
                {isEdit ? (
                  <>
                    <CmsButton variant="cancel" size="large" width={140} type="button" onClick={onClose}>
                      닫기
                    </CmsButton>
                    <CmsButton
                      variant="delete"
                      size="large"
                      width={140}
                      type="button"
                      disabled={submitting}
                      onClick={() => setDeleteOpen(true)}
                    >
                      템플릿 삭제
                    </CmsButton>
                    <CmsButton
                      variant="secondary"
                      size="large"
                      width={140}
                      type="button"
                      disabled={submitting}
                      onClick={handlePreview}
                    >
                      미리보기
                    </CmsButton>
                    <CmsButton
                      variant="primary"
                      size="large"
                      width={140}
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmit}
                    >
                      수정
                    </CmsButton>
                  </>
                ) : (
                  <>
                    <CmsButton variant="cancel" size="large" width={140} type="button" onClick={onClose}>
                      취소
                    </CmsButton>
                    <CmsButton
                      variant="secondary"
                      size="large"
                      width={140}
                      type="button"
                      disabled={submitting}
                      onClick={handlePreview}
                    >
                      미리보기
                    </CmsButton>
                    <CmsButton
                      variant="primary"
                      size="large"
                      width={140}
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmit}
                    >
                      등록
                    </CmsButton>
                  </>
                )}
              </div>
            </div>

            <div className="mail-template-form-modal__layout">
              <div className="mail-template-form-modal__main">
                <section className="mail-template-form-modal__widget">
                  <div className="mail-template-form-modal__section-head">
                    <h3 className="mail-template-form-modal__section-title">기본 설정</h3>
                    <p className="mail-template-form-modal__section-hint">
                      발신자명 미기재 시, 이메일을 받는 사람에게 이메일 주소 형식만 표시됩니다.
                    </p>
                  </div>
                  <BasicSettingsFields
                    templateName={form.templateName}
                    senderName={form.senderName}
                    senderEmail={form.senderEmail}
                    onTemplateNameChange={form.setTemplateName}
                    onSenderNameChange={form.setSenderName}
                    onSenderEmailChange={form.setSenderEmail}
                  />
                </section>

                <section className="mail-template-form-modal__widget">
                  <h3 className="mail-template-form-modal__section-title">템플릿 작성</h3>
                  <DetailInfoForm
                    title="템플릿 작성"
                    hideHeader
                    mode="edit"
                    className="mail-template-form-modal__compose"
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
                groups={variableGroups.length > 0 ? variableGroups : undefined}
              />
            </div>
          </div>
        </div>
      </TealHeaderModal>

      <PreviewModal
        open={previewOpen}
        zIndex={1100}
        subject={previewDraft?.subject ?? ''}
        bodyHtml={previewDraft?.bodyHtml ?? ''}
        senderName={previewDraft?.senderName}
        senderEmail={previewDraft?.senderEmail}
        attachments={previewDraft?.attachments}
        previewAt={previewDraft?.previewAt}
        onClose={() => setPreviewOpen(false)}
      />
      <ConfirmModal
        open={deleteOpen}
        title="템플릿 삭제"
        content="템플릿을 삭제하시겠습니까?"
        warningMessage="삭제된 항목은 복구할 수 없습니다."
        danger
        confirmText="삭제"
        zIndex={1200}
        onConfirm={() => {
          setDeleteOpen(false)
          onDelete?.()
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  )
}
