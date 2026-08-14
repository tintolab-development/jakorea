import { CloseOutlined } from '@ant-design/icons'
import { useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import {
  AlimtalkPhonePreview,
  CmsButton,
  CmsDatePicker,
  CmsRadio,
  CmsSelect,
  useCmsAlert,
} from '@/shared/ui'
import {
  ALIMTALK_CATEGORY_MOCK,
  ALIMTALK_TEMPLATE_ITEM_MOCK,
} from '@/features/notifications/model/alimtalk-template/mock'
import { ALIMTALK_MESSAGE_TYPE_LABEL } from '@/features/notifications/model/alimtalk-template/types'
import { categoryNameById } from '@/features/notifications/lib/tree'
import { ContentPanel } from './content-panel'
import './fullpage-modal.css'

const EMPTY_HINT = '발신 프로필/템플릿을 먼저 선택하세요.'
const EMPTY_INFO = '발신 프로필/템플릿 이름을 선택하세요.'
const UNSELECTED_CONTENT =
  '알림톡은 미리 승인 받은 템플릿만 사용 가능합니다. 템플릿 제목을 선택하면 내용이 표시됩니다.'

const PROGRAM_OPTIONS = [{ label: '2026 JA Company Of The Year', value: 'prog-coy-2026' }]
const SENDER_OPTIONS = [{ label: 'JA Korea', value: 'JA Korea' }]

const EMPHASIS_TYPE_LABEL = {
  NONE: '선택 안 함',
} as const

type SendFullpageModalProps = {
  open: boolean
  onClose: () => void
}

export function SendFullpageModal({ open, onClose }: SendFullpageModalProps) {
  const { showAlert } = useCmsAlert()
  const [programId, setProgramId] = useState<string | undefined>('prog-coy-2026')
  const [templateId, setTemplateId] = useState<string | undefined>()
  const [senderProfile, setSenderProfile] = useState<string | undefined>('JA Korea')
  const [sendTiming, setSendTiming] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(null)

  const selectedTemplate = useMemo(
    () => ALIMTALK_TEMPLATE_ITEM_MOCK.find(item => item.id === templateId),
    [templateId]
  )

  const templateOptions = useMemo(
    () =>
      ALIMTALK_TEMPLATE_ITEM_MOCK.map(item => ({
        label: `${item.name} (${EMPHASIS_TYPE_LABEL[item.emphasisType]})`,
        value: item.id,
      })),
    []
  )

  const requireTemplate = () => {
    if (selectedTemplate) return true
    showAlert({
      title: '안내',
      content: EMPTY_HINT,
    })
    return false
  }

  const handleDeleteSelected = () => {
    if (!requireTemplate()) return
    showAlert({
      title: '안내',
      content: '삭제할 수신자를 선택하세요.',
    })
  }

  const handleManualRecipients = () => {
    if (!requireTemplate()) return
    showAlert({
      title: '준비 중',
      content: '수신자 직접 입력 기능은 현재 준비 중입니다.',
    })
  }

  const handleSetRecipients = () => {
    if (!requireTemplate()) return
    showAlert({
      title: '준비 중',
      content: '수신자 설정 기능은 현재 준비 중입니다.',
    })
  }

  const phoneButtons = useMemo(() => {
    if (!selectedTemplate) return undefined
    const named = selectedTemplate.buttons
      .filter(button => button.variant === 'default')
      .slice(0, 1)
    return named.map(button => ({
      variant: button.variant,
      label: button.name === 'test sample' ? '버튼명' : button.name,
    }))
  }, [selectedTemplate])

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title="알림톡 발송"
      size="full"
      hideHeader
      className="alimtalk-send-fullpage-modal teal-header-modal--full"
    >
      <div className="alimtalk-send-fullpage-modal__shell">
        <header className="alimtalk-send-fullpage-modal__title-row">
          <span className="alimtalk-send-fullpage-modal__title-text">알림톡 발송</span>
          <button
            type="button"
            className="alimtalk-send-fullpage-modal__title-close"
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseOutlined />
          </button>
        </header>

        <div className="alimtalk-send-fullpage-modal__body">
          <div className="alimtalk-send-fullpage-modal__notice">
            <p className="alimtalk-send-fullpage-modal__notice-text">
              * 프로그램은 현재 운영 중인 프로그램만 선택 가능하며, 템플릿은 카카오 승인을 받은
              템플릿만 사용이 가능합니다.
            </p>
            <div className="alimtalk-send-fullpage-modal__notice-actions">
              <CmsButton variant="cancel" size="large" width={140} type="button" onClick={onClose}>
                취소
              </CmsButton>
              <CmsButton variant="primary" size="large" width={140} type="button">
                알림톡 발송
              </CmsButton>
            </div>
          </div>

            <section className="alimtalk-send-fullpage__widget">
              <h3 className="alimtalk-send-fullpage__section-title">1. 기본 설정</h3>
              <DetailInfoForm title="기본 설정" hideHeader mode="edit">
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="대상 프로그램"
                    view={PROGRAM_OPTIONS[0]?.label}
                    edit={
                      <CmsSelect
                        inputSize="large"
                        withAllOption={false}
                        value={programId}
                        onChange={value =>
                          setProgramId(typeof value === 'string' ? value : undefined)
                        }
                        options={PROGRAM_OPTIONS}
                        style={{ width: '100%' }}
                      />
                    }
                  />
                  <DetailInfoForm.Field
                    label="발신 프로필"
                    required
                    view={senderProfile}
                    edit={
                      <CmsSelect
                        inputSize="large"
                        withAllOption={false}
                        value={senderProfile}
                        onChange={value =>
                          setSenderProfile(typeof value === 'string' ? value : undefined)
                        }
                        options={SENDER_OPTIONS}
                        style={{ width: '100%' }}
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
                      <CmsSelect
                        inputSize="large"
                        withAllOption={false}
                        placeholder="사용할 템플릿을 선택하세요"
                        value={templateId}
                        onChange={value => {
                          const nextId = typeof value === 'string' ? value : undefined
                          setTemplateId(nextId)
                          const next = ALIMTALK_TEMPLATE_ITEM_MOCK.find(item => item.id === nextId)
                          if (next) {
                            setSenderProfile(
                              next.senderProfile === 'JA KOREA' ? 'JA Korea' : next.senderProfile
                            )
                          }
                        }}
                        options={templateOptions}
                        style={{ width: '100%' }}
                      />
                    }
                  />
                  <DetailInfoForm.Field
                    label="발송 시점"
                    required
                    view={sendTiming === 'immediate' ? '즉시 발송' : '예약 발송'}
                    edit={
                      <div className="alimtalk-send-fullpage__timing">
                        <CmsRadio.Group
                          value={sendTiming}
                          onChange={event => {
                            const next = event.target.value
                            if (next === 'immediate' || next === 'scheduled') setSendTiming(next)
                          }}
                        >
                          <CmsRadio value="immediate">즉시 발송</CmsRadio>
                          <CmsRadio value="scheduled">예약 발송</CmsRadio>
                        </CmsRadio.Group>
                        <CmsDatePicker
                          showTime
                          disabled={sendTiming !== 'scheduled'}
                          value={scheduledAt}
                          onChange={value => setScheduledAt(value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    }
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            </section>

            <section className="alimtalk-send-fullpage__widget alimtalk-send-fullpage__widget--recipients">
              <div className="alimtalk-send-fullpage__section-head">
                <h3 className="alimtalk-send-fullpage__section-title">
                  2. 수신자 설정<span className="alimtalk-send-fullpage__required">*</span>
                </h3>
                <div className="alimtalk-send-fullpage__section-actions">
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
                    onClick={handleManualRecipients}
                  >
                    수신자 직접 입력
                  </CmsButton>
                  <CmsButton
                    variant="secondary"
                    size="large"
                    type="button"
                    onClick={handleSetRecipients}
                  >
                    수신자 설정
                  </CmsButton>
                </div>
              </div>
              <div className="alimtalk-send-fullpage__empty">{EMPTY_HINT}</div>
            </section>

            <section className="alimtalk-send-fullpage__widget">
              <h3 className="alimtalk-send-fullpage__section-title">3. 템플릿 정보</h3>
              <DetailInfoForm title="템플릿 정보" hideHeader mode="view">
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="메시지 유형"
                    view={
                      selectedTemplate
                        ? ALIMTALK_MESSAGE_TYPE_LABEL[selectedTemplate.messageType]
                        : EMPTY_INFO
                    }
                  />
                  <DetailInfoForm.Field
                    label="템플릿 강조 유형"
                    view={
                      selectedTemplate
                        ? EMPHASIS_TYPE_LABEL[selectedTemplate.emphasisType]
                        : EMPTY_INFO
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="보안 템플릿 여부"
                    view={
                      selectedTemplate
                        ? selectedTemplate.isSecurityTemplate
                          ? '예'
                          : '아니오'
                        : EMPTY_INFO
                    }
                  />
                  <DetailInfoForm.Field
                    label="카테고리"
                    view={
                      selectedTemplate
                        ? categoryNameById(ALIMTALK_CATEGORY_MOCK, selectedTemplate.categoryId)
                        : EMPTY_INFO
                    }
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            </section>

            <section className="alimtalk-send-fullpage__widget alimtalk-send-fullpage__widget--content">
              <div className="alimtalk-send-fullpage__content-main">
                <h3 className="alimtalk-send-fullpage__section-title">4. 템플릿 내용</h3>
                {selectedTemplate ? (
                  <ContentPanel template={selectedTemplate} />
                ) : (
                  <div className="alimtalk-send-fullpage__empty alimtalk-send-fullpage__empty--fill">
                    {EMPTY_HINT}
                  </div>
                )}
              </div>
              <AlimtalkPhonePreview
                senderName={selectedTemplate?.senderProfile ?? 'JA KOREA'}
                content={selectedTemplate?.content ?? UNSELECTED_CONTENT}
                extraContent={selectedTemplate?.extraInfo}
                messageType={selectedTemplate?.messageType}
                buttons={phoneButtons}
                quickLinks={selectedTemplate?.quickLinks.map(link => link.name)}
              />
            </section>
        </div>
      </div>
    </TealHeaderModal>
  )
}
