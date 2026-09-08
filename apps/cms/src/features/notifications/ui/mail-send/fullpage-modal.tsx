import { useCallback, useMemo, useState } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import {
  CmsButton,
  CmsDatePicker,
  CmsInput,
  CmsRadio,
  ConfirmModal,
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
import {
  groupMailTemplateVariablesFromCatalog,
} from '@/features/notifications/model/mail-template/variables'
import { MAIL_SEND_PROGRAM_MOCK } from '@/features/notifications/model/mail-send/mock'
import { type MailSendRecipientSearchParams } from '@/features/notifications/model/mail-send/types'
import { parseNotificationSendProgramId } from '@/features/notifications/model/send-program-id'
import { toMailSendParticipantTypeApi } from '@/features/notifications/model/mail-send/recipients'
import {
  shouldUseMailSendRemoteApi,
  submitMailSend,
  getMailRecipientCandidates,
} from '@/features/notifications/api/mail-send-service'
import { getNotificationsApiErrorMessage } from '@/features/notifications/api/get-notifications-api-error'
import { useInvalidateMailSendHistory } from '@/features/notifications/hooks/use-mail-send-history-query'
import {
  useMailRecipientCandidatesQuery,
  useMailSenderProfilesQuery,
  useMailTemplateVariablesQuery,
} from '@/features/notifications/hooks/use-mail-send-queries'
import { useMailSendTemplatePickerQuery } from '@/features/notifications/hooks/use-mail-template-tree-query'
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
  const invalidateHistory = useInvalidateMailSendHistory()
  const form = useMailSendForm(open)
  const remote = shouldUseMailSendRemoteApi()
  const templatesQuery = useMailSendTemplatePickerQuery(open)
  const templates = templatesQuery.data ?? MAIL_TEMPLATE_ITEM_MOCK
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
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState<MailSendRecipientSearchParams>({
    typeValue: '',
    keyword: '',
    page: 0,
  })

  const senderProfilesQuery = useMailSenderProfilesQuery(open && remote)
  const programNumericId = useMemo(
    () => parseNotificationSendProgramId(form.programId),
    [form.programId]
  )
  const candidatesQuery = useMailRecipientCandidatesQuery(
    {
      programId: programNumericId,
      keyword: recipientSearch.keyword || undefined,
      participantType: toMailSendParticipantTypeApi(recipientSearch.typeValue),
      page: recipientSearch.page,
      size: 50,
    },
    open && recipientSelectOpen
  )
  const variablesQuery = useMailTemplateVariablesQuery(
    {
      programId: programNumericId,
      participantType: toMailSendParticipantTypeApi(recipientSearch.typeValue),
    },
    open && remote
  )
  const variableGroups = useMemo(
    () => groupMailTemplateVariablesFromCatalog(variablesQuery.data ?? []),
    [variablesQuery.data]
  )
  const isCatalogItemDisabled = useCallback(
    (label: string) => {
      const catalog = variablesQuery.data ?? []
      const found = catalog.find(item => item.key === label)
      return found != null && found.enabled !== true
    },
    [variablesQuery.data]
  )

  const hasTemplates = templates.length > 0
  const composeReadOnly = Boolean(form.templateId)
  const resolvedSenderProfileId = useMemo(() => {
    const email = form.senderEmail.trim().toLowerCase()
    if (!email) return undefined
    return senderProfilesQuery.data?.find(
      profile => profile.senderKey.trim().toLowerCase() === email
    )?.profileId
  }, [form.senderEmail, senderProfilesQuery.data])
  const handleClose = () => {
    setPreviewOpen(false)
    setRecipientSelectOpen(false)
    setRecipientManualOpen(false)
    setSelectedRecipientIds([])
    setRecipientSearch({ typeValue: '', keyword: '', page: 0 })
    setSendConfirmOpen(false)
    onClose()
  }

  const handleAttachmentAdd = (files: File[]) => {
    const result = form.handleAttachmentAdd(files)
    if (!result.ok) {
      showAlert({ title: '안내', content: result.message })
    }
  }

  const handleOpenRecipientSelect = () => {
    if (programNumericId == null) {
      showAlert({ title: '안내', content: '프로그램을 먼저 선택하세요.' })
      return
    }
    setRecipientSearch({ typeValue: '', keyword: '', page: 0 })
    setRecipientSelectOpen(true)
  }

  const handleOpenRecipientManual = () => {
    if (programNumericId == null) {
      showAlert({ title: '안내', content: '프로그램을 먼저 선택하세요.' })
      return
    }
    setRecipientManualOpen(true)
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
    setSendConfirmOpen(true)
  }

  const handleConfirmSend = async () => {
    if (sending) return
    setSending(true)
    try {
      const draft = form.getDraft()
      const templateDisplayName = draft.templateId
        ? templates.find(item => item.id === draft.templateId)?.templateName
        : undefined
      await submitMailSend({
        draft,
        templateDisplayName,
        idempotencyKey: crypto.randomUUID(),
        senderProfileId: resolvedSenderProfileId,
      })
      setSendConfirmOpen(false)
      await invalidateHistory()
      showAlert({
        title: '메일 발송 완료',
        content: '메일 발송이 완료되었습니다.',
        confirmLabel: '닫기',
      })
      handleClose()
    } catch (error) {
      setSendConfirmOpen(false)
      showAlert({
        title: '메일 발송 실패',
        content: getNotificationsApiErrorMessage(error, '메일 발송에 실패했습니다.'),
      })
    } finally {
      setSending(false)
    }
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
                * 프로그램은 현재 운영 중인 프로그램만 선택 가능합니다. 발송·수신자 조회에는
                프로그램 선택이 필요합니다. 제목·본문·첨부는 선택한 템플릿 기준으로 발송됩니다.
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
                            templates={templates}
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
                        onClick={handleOpenRecipientManual}
                      >
                        수신자 직접 입력
                      </CmsButton>
                      <CmsButton
                        variant="secondary"
                        size="large"
                        type="button"
                        onClick={handleOpenRecipientSelect}
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
                      readOnly={composeReadOnly}
                    />
                  </DetailInfoForm>
                </section>
              </div>

              <VariablesPanel
                onInsert={form.insertVariable}
                groups={variableGroups.length > 0 ? variableGroups : undefined}
                disabled={composeReadOnly}
                disabledReason={
                  composeReadOnly
                    ? '발송 시 변수는 템플릿에 포함된 값만 사용됩니다. 변수 추가는 템플릿 등록에서 하세요.'
                    : undefined
                }
                onDisabledInsert={() =>
                  showAlert({
                    title: '안내',
                    content: composeReadOnly
                      ? '발송 시 변수는 템플릿에 포함된 값만 사용됩니다. 변수 추가는 템플릿 등록에서 하세요.'
                      : '현재 프로그램·수신자 유형에서 사용할 수 없는 변수입니다.',
                  })
                }
                isItemDisabled={isCatalogItemDisabled}
                itemDisabledReason="현재 프로그램·수신자 유형에서 사용할 수 없는 변수입니다."
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
        candidates={candidatesQuery.data?.items}
        selectedIds={form.recipients.map(item => item.id)}
        onSearch={remote ? params => setRecipientSearch(params) : undefined}
        totalCount={candidatesQuery.data?.total}
        totalPages={candidatesQuery.data?.totalPages}
        fetchAllCandidates={
          remote && programNumericId != null
            ? async () => {
                const total = Math.max(candidatesQuery.data?.total ?? 0, 1)
                const result = await getMailRecipientCandidates({
                  programId: programNumericId,
                  keyword: recipientSearch.keyword || undefined,
                  participantType: toMailSendParticipantTypeApi(recipientSearch.typeValue),
                  page: 0,
                  size: Math.min(Math.max(total, 50), 1000),
                })
                return result.items
              }
            : undefined
        }
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
      <ConfirmModal
        open={sendConfirmOpen}
        title="메일 발송"
        content="해당 내용으로 메일을 발송하시겠습니까?"
        confirmText="발송"
        cancelText="취소"
        onConfirm={() => void handleConfirmSend()}
        onCancel={() => {
          if (!sending) setSendConfirmOpen(false)
        }}
      />
    </>
  )
}
