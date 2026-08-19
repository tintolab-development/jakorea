import { CloseOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import {
  CmsButton,
  CmsInput,
  CmsInputIconClick,
  ConfirmModal,
  FileSelectField,
  useCmsAlert,
} from '@/shared/ui'
import { RichTextEditor } from '@/shared/rich-text'
import type { MailTemplateItem } from '@/features/notifications/model/mail-template/types'
import { MAIL_ATTACHMENT_GUIDE_LINES } from '@/features/notifications/model/mail-template/attachments'
import { PreviewModal } from './preview-modal'
import {
  useMailTemplateForm,
  type MailTemplateFormDraft,
  type MailTemplateFormMode,
} from './use-form'
import { VariablesPanel } from './variables-panel'
import './form-modal.css'

type FormModalProps = {
  open: boolean
  mode: MailTemplateFormMode
  template: MailTemplateItem | null
  onClose: () => void
  onSubmit: (draft: MailTemplateFormDraft) => void
  onDelete?: () => void
}

export function FormModal({ open, mode, template, onClose, onSubmit, onDelete }: FormModalProps) {
  const { showAlert } = useCmsAlert()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [previewDraft, setPreviewDraft] = useState<MailTemplateFormDraft | null>(null)
  const form = useMailTemplateForm(open, mode, template)
  const isEdit = mode === 'edit'
  const templateNamePlaceholder = '템플릿명을 입력하세요'
  const headerTitle = form.templateName.trim() || templateNamePlaceholder
  const [titleEditing, setTitleEditing] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitleEditing(mode === 'create')
  }, [open, mode])

  const handlePreview = () => {
    setPreviewDraft(form.getDraft())
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

  const handleAttachmentAdd = (files: File[]) => {
    const result = form.handleAttachmentAdd(files)
    if (!result.ok) {
      showAlert({ title: '안내', content: result.message })
    }
  }

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
                placeholder={templateNamePlaceholder}
                onChange={form.setTemplateName}
                onRequestEdit={() => setTitleEditing(true)}
                onCommitEdit={() => setTitleEditing(false)}
                inputAriaLabel={templateNamePlaceholder}
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
                      width="max-content"
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                    >
                      템플릿 삭제
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
                      onClick={handlePreview}
                    >
                      미리보기
                    </CmsButton>
                    <CmsButton
                      variant="primary"
                      size="large"
                      width={140}
                      type="button"
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
                  <DetailInfoForm title="기본 설정" hideHeader mode="edit">
                    <DetailInfoForm.Row type="single">
                      <DetailInfoForm.Field
                        label="템플릿명"
                        required
                        fullRow
                        view={form.templateName}
                        edit={
                          <CmsInput
                            inputSize="large"
                            width="100%"
                            allowClear={false}
                            placeholder="템플릿명을 입력하세요"
                            value={form.templateName}
                            onChange={event => form.setTemplateName(event.target.value)}
                          />
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

                <section className="mail-template-form-modal__widget">
                  <h3 className="mail-template-form-modal__section-title">템플릿 작성</h3>
                  <DetailInfoForm
                    title="템플릿 작성"
                    hideHeader
                    mode="edit"
                    className="mail-template-form-modal__compose"
                  >
                    <DetailInfoForm.Row type="single">
                      <DetailInfoForm.Field
                        label="제목"
                        required
                        fullRow
                        view={form.subject}
                        edit={
                          <div className="mail-template-form-modal__subject">
                            <CmsInput
                              ref={form.subjectInputRef}
                              inputSize="large"
                              width="100%"
                              allowClear={false}
                              maxLength={form.subjectMaxLength}
                              placeholder="제목을 작성하세요"
                              value={form.subject}
                              onChange={event => form.handleSubjectChange(event.target.value)}
                              onFocus={event => form.rememberSubjectRange(event.currentTarget)}
                              onBlur={event => form.rememberSubjectRange(event.currentTarget)}
                              onSelect={event => form.rememberSubjectRange(event.currentTarget)}
                              onClick={event => form.rememberSubjectRange(event.currentTarget)}
                              onKeyUp={event => form.rememberSubjectRange(event.currentTarget)}
                            />
                            <span className="mail-template-form-modal__subject-count">
                              {form.subject.length}/{form.subjectMaxLength}
                            </span>
                          </div>
                        }
                      />
                    </DetailInfoForm.Row>
                    <DetailInfoForm.Row type="single">
                      <DetailInfoForm.Field
                        label="내용"
                        required
                        fullRow
                        view=""
                        edit={
                          <div className="mail-template-form-modal__editor-host">
                            <RichTextEditor
                              editor={form.editor}
                              minHeight={form.editorMinHeight}
                            />
                          </div>
                        }
                      />
                    </DetailInfoForm.Row>
                    <DetailInfoForm.Row type="single">
                      <DetailInfoForm.Field
                        label="첨부파일"
                        fullRow
                        view=""
                        edit={
                          <FileSelectField
                            className="mail-template-form-modal__file-field"
                            multiple
                            maxTotalBytes={0}
                            buttonLabel="파일 추가"
                            fileNames={form.attachmentFileNames}
                            guideLines={MAIL_ATTACHMENT_GUIDE_LINES}
                            onFilesChange={handleAttachmentAdd}
                            onRemoveFile={form.handleAttachmentRemove}
                          />
                        }
                      />
                    </DetailInfoForm.Row>
                  </DetailInfoForm>
                </section>
              </div>
              <VariablesPanel onInsert={form.insertVariable} />
            </div>
          </div>
        </div>
      </TealHeaderModal>

      <PreviewModal
        open={previewOpen}
        subject={previewDraft?.subject ?? ''}
        bodyHtml={previewDraft?.bodyHtml ?? ''}
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
