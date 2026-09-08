import { useMemo, useState } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import {
  CmsButton,
  CmsDatePicker,
  CmsInput,
  CmsPhoneInput,
  CmsRadio,
  CmsTextArea,
  ConfirmModal,
  useCmsAlert,
} from '@/shared/ui'
import { getNotificationsApiErrorMessage } from '@/features/notifications/api/get-notifications-api-error'
import {
  getSmsRecipientCandidates,
  resolveSmsSenderProfileId,
  shouldUseSmsSendRemoteApi,
  submitSmsSend,
} from '@/features/notifications/api/sms-send-service'
import { SMS_TEMPLATE_ITEM_MOCK } from '@/features/notifications/model/sms-template/mock'
import { useInvalidateSmsSendHistory } from '@/features/notifications/hooks/use-sms-send-history-query'
import {
  useSmsRecipientCandidatesQuery,
  useSmsSendTemplatePickerQuery,
  useSmsSenderProfilesQuery,
} from '@/features/notifications/hooks/use-sms-send-queries'
import { SMS_SEND_PROGRAM_MOCK } from '@/features/notifications/model/sms-send/mock'
import { parseNotificationSendProgramId } from '@/features/notifications/model/send-program-id'
import {
  createManualRecipient,
  resolveSmsSendRecipientTypeMode,
  smsSendRecipientTypeColumnTitle,
  toSmsSendMemberTypeApi,
  toSmsSendParticipantTypeApi,
} from '@/features/notifications/model/sms-send/recipients'
import { type SmsSendRecipientSearchParams } from '@/features/notifications/model/sms-send/types'
import { PreviewModal } from '@/features/notifications/ui/sms-template/preview-modal'
import { ProgramSelectField } from '@/features/notifications/ui/mail-send/program-select-field'
import { RecipientManualModal } from './recipient-manual-modal'
import { RecipientSelectModal } from './recipient-select-modal'
import { RecipientTable } from './recipient-table'
import { TemplateSelectField } from './template-select-field'
import { useSmsSendForm } from './use-form'
import '@/features/notifications/ui/mail-send/fullpage-modal.css'
import './fullpage-modal.css'

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `sms-batch-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function recipientTotalPages(total: number, size: number, totalPages?: number): number {
  if (totalPages != null && totalPages > 0) return totalPages
  return Math.max(Math.ceil((total || 0) / (size || 50)), 1)
}

type SendFullpageModalProps = {
  open: boolean
  onClose: () => void
  initialTemplateId?: string
}

export function SendFullpageModal({
  open,
  onClose,
  initialTemplateId,
}: SendFullpageModalProps) {
  const { showAlert } = useCmsAlert()
  const invalidateHistory = useInvalidateSmsSendHistory()
  const form = useSmsSendForm(open, initialTemplateId)
  const remote = shouldUseSmsSendRemoteApi()
  const templatesQuery = useSmsSendTemplatePickerQuery(open)
  const templates = templatesQuery.data ?? SMS_TEMPLATE_ITEM_MOCK
  const [previewOpen, setPreviewOpen] = useState(false)
  const [recipientSelectOpen, setRecipientSelectOpen] = useState(false)
  const [recipientManualOpen, setRecipientManualOpen] = useState(false)
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([])
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState<SmsSendRecipientSearchParams>({
    typeValue: '',
    keyword: '',
    page: 0,
  })

  const selectedTemplate = useMemo(
    () => templates.find(item => item.id === form.templateId) ?? null,
    [form.templateId, templates]
  )
  const senderProfilesQuery = useSmsSenderProfilesQuery(open && remote)
  const resolvedSenderProfileId = useMemo(() => {
    return resolveSmsSenderProfileId(senderProfilesQuery.data ?? [], form.senderPhone)
  }, [form.senderPhone, senderProfilesQuery.data])
  const programNumericId = parseNotificationSendProgramId(form.programId)
  const recipientTypeMode = resolveSmsSendRecipientTypeMode(form.programId)
  const typeColumnTitle = smsSendRecipientTypeColumnTitle(recipientTypeMode)
  const candidatesQuery = useSmsRecipientCandidatesQuery(
    {
      programId: programNumericId,
      keyword: recipientSearch.keyword || undefined,
      participantType:
        recipientTypeMode === 'participation'
          ? toSmsSendParticipantTypeApi(recipientSearch.typeValue)
          : undefined,
      memberType:
        recipientTypeMode === 'member' ? toSmsSendMemberTypeApi(recipientSearch.typeValue) : undefined,
      page: recipientSearch.page,
      size: 50,
    },
    open && recipientSelectOpen
  )
  const hasTemplates = templates.length > 0

  function handleClose() {
    setPreviewOpen(false)
    setRecipientSelectOpen(false)
    setRecipientManualOpen(false)
    setSelectedRecipientIds([])
    setSendConfirmOpen(false)
    onClose()
  }

  function handleDeleteSelected() {
    if (selectedRecipientIds.length === 0) {
      showAlert({ title: '안내', content: '삭제할 수신자를 선택하세요.' })
      return
    }
    form.removeRecipients(selectedRecipientIds)
    setSelectedRecipientIds([])
  }

  function handleOpenRecipientSelect() {
    if (programNumericId == null) {
      showAlert({ title: '안내', content: '프로그램을 먼저 선택하세요.' })
      return
    }
    setRecipientSearch({ typeValue: '', keyword: '', page: 0 })
    setRecipientSelectOpen(true)
  }

  function handleOpenRecipientManual() {
    if (programNumericId == null) {
      showAlert({ title: '안내', content: '프로그램을 먼저 선택하세요.' })
      return
    }
    setRecipientManualOpen(true)
  }

  function handlePreview() {
    setPreviewOpen(true)
  }

  function handleSend() {
    const error = form.validateRequired()
    if (error) {
      showAlert({ title: '필수 입력 안내', content: error })
      return
    }

    if (remote && senderProfilesQuery.data && senderProfilesQuery.data.length > 0) {
      if (!resolvedSenderProfileId) {
        showAlert({
          title: '필수 입력 안내',
          content: 'NHN에 등록된 발신 번호를 입력하세요.',
        })
        return
      }
    }

    setSendConfirmOpen(true)
  }

  async function handleConfirmSend() {
    if (sending) return
    setSending(true)
    try {
      const draft = form.getDraft()
      await submitSmsSend({
        draft,
        templateDisplayName: selectedTemplate?.templateName,
        idempotencyKey: createIdempotencyKey(),
        senderProfileId: resolvedSenderProfileId,
      })
      setSendConfirmOpen(false)
      await invalidateHistory()
      showAlert({
        title: '문자 발송 완료',
        content: '문자 발송이 완료되었습니다.',
        confirmLabel: '닫기',
      })
      handleClose()
    } catch (error) {
      setSendConfirmOpen(false)
      showAlert({
        title: '문자 발송 실패',
        content: getNotificationsApiErrorMessage(error, '문자 발송에 실패했습니다.'),
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
        title="문자 발송"
        size="full"
        hideHeader
        className="mail-send-fullpage-modal teal-header-modal--full"
      >
        <div className="mail-send-fullpage-modal__shell">
          <header className="mail-send-fullpage-modal__title-row">
            <span className="mail-send-fullpage-modal__title-text">문자 발송</span>
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
                프로그램 선택이 필요합니다. 템플릿을 선택하면 메시지 유형, 발신 번호,
                제목/내용이 자동 반영됩니다.
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
                  disabled={sending}
                  onClick={handleSend}
                >
                  문자 발송
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
                            value={form.programId || undefined}
                            programs={SMS_SEND_PROGRAM_MOCK}
                            onSelect={program => form.setProgramId(program.id)}
                          />
                        }
                      />
                    </DetailInfoForm.Row>
                    <DetailInfoForm.Row type="double">
                      <DetailInfoForm.Field
                        label="템플릿"
                        required
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
                        label="메시지 유형"
                        view={form.messageType}
                        edit={
                          <CmsInput
                            inputSize="large"
                            width="100%"
                            allowClear={false}
                            value={form.messageType}
                            disabled
                          />
                        }
                      />
                    </DetailInfoForm.Row>
                    <DetailInfoForm.Row type="double">
                      <DetailInfoForm.Field
                        label="발신 번호"
                        required
                        view={form.senderPhone}
                        edit={
                          <CmsPhoneInput
                            inputSize="large"
                            width="100%"
                            allowClear={false}
                            placeholder="발신 번호를 입력하세요"
                            value={form.senderPhone}
                            onChange={event => form.setSenderPhone(event.target.value)}
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
                    typeColumnTitle={typeColumnTitle}
                  />
                </section>

                <section className="mail-send-fullpage__widget">
                  <h3 className="mail-send-fullpage__section-title">3. 문자 작성</h3>
                  <DetailInfoForm
                    title="문자 작성"
                    hideHeader
                    mode="edit"
                    className="mail-send-fullpage__compose"
                  >
                    {form.showSubject ? (
                      <DetailInfoForm.Row type="single">
                        <DetailInfoForm.Field
                          label="제목"
                          required
                          fullRow
                          view={form.subject}
                          edit={
                            <CmsInput
                              inputSize="large"
                              width="100%"
                              allowClear={false}
                              maxLength={1000}
                              placeholder="제목을 작성하세요"
                              value={form.subject}
                              onChange={event => form.setSubject(event.target.value)}
                            />
                          }
                        />
                      </DetailInfoForm.Row>
                    ) : null}
                    <DetailInfoForm.Row type="single">
                      <DetailInfoForm.Field
                        label="내용"
                        required
                        fullRow
                        view={form.bodyText}
                        edit={
                          <div className="sms-send-fullpage__body-field">
                            <CmsTextArea
                              inputSize="large"
                              width="100%"
                              rows={12}
                              placeholder="내용을 작성하세요"
                              value={form.bodyText}
                              onChange={event => form.setBodyText(event.target.value)}
                            />
                            <div className="sms-send-fullpage__byte-row">
                              <span>SMS는 90byte, LMS/MMS는 2000byte까지 작성할 수 있습니다.</span>
                              <span
                                className={
                                  form.bodyByteLength > form.bodyByteLimit
                                    ? 'sms-send-fullpage__byte-count sms-send-fullpage__byte-count--danger'
                                    : 'sms-send-fullpage__byte-count'
                                }
                              >
                                {form.bodyByteLength}/{form.bodyByteLimit} byte
                              </span>
                            </div>
                          </div>
                        }
                      />
                    </DetailInfoForm.Row>
                  </DetailInfoForm>
                </section>
              </div>
            </div>
          </div>
        </div>
      </TealHeaderModal>

      <PreviewModal
        open={open && previewOpen}
        zIndex={1100}
        templateName={selectedTemplate?.templateName ?? ''}
        senderPhone={form.senderPhone}
        messageType={form.messageType}
        subject={form.subject}
        bodyText={form.bodyText}
        attachments={
          selectedTemplate?.attachments?.length
            ? selectedTemplate.attachments.map(item => ({
                name: item.fileName,
                sizeBytes: item.byteSize,
              }))
            : selectedTemplate?.attachmentFileNames.map(name => ({ name }))
        }
        previewAt={
          form.sendTiming === 'scheduled' && form.scheduledAt
            ? form.scheduledAt.toISOString()
            : new Date().toISOString()
        }
        onClose={() => setPreviewOpen(false)}
      />
      <RecipientSelectModal
        key={recipientSelectOpen ? 'recipient-select-open' : 'recipient-select-closed'}
        open={open && recipientSelectOpen}
        candidates={candidatesQuery.data?.items}
        initialSelected={form.recipients}
        typeMode={recipientTypeMode}
        onSearch={remote ? params => setRecipientSearch(params) : undefined}
        totalCount={candidatesQuery.data?.total}
        totalPages={
          candidatesQuery.data
            ? recipientTotalPages(
                candidatesQuery.data.total,
                candidatesQuery.data.size,
                candidatesQuery.data.totalPages
              )
            : 1
        }
        fetchAllCandidates={
          remote && programNumericId != null
            ? async () => {
                const total = Math.max(candidatesQuery.data?.total ?? 0, 1)
                const result = await candidatesQuery.refetch({
                  throwOnError: true,
                })
                if (!result.data) return []
                if (result.data.total <= result.data.items.length) return result.data.items
                const all = await getSmsRecipientCandidates({
                  programId: programNumericId,
                  keyword: recipientSearch.keyword || undefined,
                  participantType:
                    recipientTypeMode === 'participation'
                      ? toSmsSendParticipantTypeApi(recipientSearch.typeValue)
                      : undefined,
                  memberType:
                    recipientTypeMode === 'member'
                      ? toSmsSendMemberTypeApi(recipientSearch.typeValue)
                      : undefined,
                  page: 0,
                  size: Math.min(Math.max(total, 50), 1000),
                })
                return all.items
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
        phones={form.recipients.filter(item => item.source === 'manual').map(item => item.phone)}
        onClose={() => setRecipientManualOpen(false)}
        onConfirm={phones => {
          form.replaceManualRecipients(phones.map(phone => createManualRecipient(phone)))
          setRecipientManualOpen(false)
        }}
      />
      <ConfirmModal
        open={sendConfirmOpen}
        title="문자 발송 확인"
        content="해당 내용으로 문자를 발송하시겠습니까?"
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
