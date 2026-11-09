import { useState } from 'react'
import { Space } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, CmsRadioGroup } from '@/shared/ui'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { useMemberConsentRecordsQuery } from '@/features/user/api/hooks/use-member-detail-query'
import { resolveTermsTypeToConsentLabel } from '@/features/user/api/map-member-consent-records'
import { resolveMemberConsentTemplateByLabel } from '@/features/user/shared/lib/member-consent-template-map'
import { MemberConsentDocumentViewModal } from '@/features/user/shared/ui/member-consent-document-view-modal'
import { useMyProgramPrivacyRole } from '@/features/user/detail/lib/use-my-program-privacy-role'
import type { MemberConsentRecordResponse } from '@/shared/api/generated/members/schemas/memberConsentRecordResponse'

export type ConsentValue = 'agree' | 'disagree'
export type ConsentFieldKey =
  | 'serviceTerms'
  | 'personalInfo'
  | 'marketing'
  | 'portrait'
  | 'educationPledge'
  | 'jointUse'
  | 'sexOffenseCheck'

export type UjatVolunteerAddRegistrationConsentState = Record<
  ConsentFieldKey,
  ConsentValue | ''
>

const CONSENT_RADIO_OPTIONS = [
  { label: '동의', value: 'agree' },
  { label: '미동의', value: 'disagree' },
]

const TERMS_CONSENT_DESCRIPTION =
  '*미동의 시 서비스 가입 및 프로그램 참여에 제한이 있을 수 있습니다.'

type ConsentItem = {
  key: ConsentFieldKey
  label: string
  documentButton?: 'write' | 'edit'
}

const CONSENT_BLOCK_PRIMARY: ConsentItem[][] = [
  [
    { key: 'serviceTerms', label: '서비스 이용약관' },
    { key: 'personalInfo', label: '개인정보 수집·이용 동의' },
  ],
  [
    { key: 'marketing', label: '마케팅 제공 동의' },
    { key: 'portrait', label: '초상권 수집·이용 동의', documentButton: 'write' },
  ],
]

const CONSENT_BLOCK_SECONDARY: (ConsentItem | 'empty')[][] = [
  [{ key: 'educationPledge', label: '교육진행자 서약서', documentButton: 'edit' }, 'empty'],
  [
    { key: 'jointUse', label: '행정정보 공동이용 동의서', documentButton: 'write' },
    { key: 'sexOffenseCheck', label: '성범죄경력 조회 동의서', documentButton: 'write' },
  ],
]

export const EMPTY_UJAT_VOLUNTEER_ADD_REGISTRATION_CONSENTS: UjatVolunteerAddRegistrationConsentState =
  {
    serviceTerms: '',
    personalInfo: '',
    marketing: '',
    portrait: '',
    educationPledge: '',
    jointUse: '',
    sexOffenseCheck: '',
  }

function canViewSubmittedConsentDocument(record: MemberConsentRecordResponse | undefined): boolean {
  if (record == null) return false
  return (
    record.filledDocumentAvailable === true ||
    record.formResponseId != null ||
    record.consentRecordId != null ||
    record.filledDocumentId != null
  )
}

function findConsentRecordForLabel(
  records: MemberConsentRecordResponse[] | undefined,
  label: string
): MemberConsentRecordResponse | undefined {
  return records?.find(record => resolveTermsTypeToConsentLabel(record.consentType) === label)
}

function ConsentFieldEdit({
  value,
  onChange,
  documentButton,
  documentAvailable,
  onDocumentAction,
}: {
  value: ConsentValue | ''
  onChange: (next: ConsentValue) => void
  documentButton?: 'write' | 'edit'
  documentAvailable: boolean
  onDocumentAction: () => void
}) {
  return (
    <Space
      align="center"
      size={12}
      wrap
      className="ujat-volunteer-add-registration__consent-actions"
    >
      <CmsRadioGroup
        size="medium"
        options={CONSENT_RADIO_OPTIONS}
        value={value || undefined}
        onChange={e => onChange(e.target.value as ConsentValue)}
      />
      {documentButton ? (
        <>
          <DetailInfoForm.InputsSeparator />
          <CmsButton
            variant={documentButton === 'edit' ? 'primary' : 'secondary'}
            size="medium"
            type="button"
            disabled={value !== 'agree' || !documentAvailable}
            onClick={onDocumentAction} >
            {documentButton === 'edit' ? '동의서 수정' : '동의서 작성'}
          </CmsButton>
        </>
      ) : null}
    </Space>
  )
}

function ConsentField({
  item,
  value,
  onChange,
  documentAvailable,
  onDocumentAction,
}: {
  item: ConsentItem
  value: ConsentValue | ''
  onChange: (next: ConsentValue) => void
  documentAvailable: boolean
  onDocumentAction: () => void
}) {
  return (
    <DetailInfoForm.Field
      label={item.label}
      labelWidth={240}
      view="-"
      edit={
        <ConsentFieldEdit
          value={value}
          onChange={onChange}
          documentButton={item.documentButton}
          documentAvailable={documentAvailable}
          onDocumentAction={onDocumentAction}
        />
      }
    />
  )
}

function ConsentEmptyHalf() {
  return (
    <DetailInfoForm.Field
      label=" "
      labelWidth={240}
      view="-"
      edit={<span className="ujat-volunteer-add-registration__consent-empty-half" aria-hidden />}
    />
  )
}

function renderConsentCell(
  cell: ConsentItem | 'empty' | undefined,
  consents: UjatVolunteerAddRegistrationConsentState,
  setConsent: (key: ConsentFieldKey, next: ConsentValue) => void,
  documentAvailableFor: (item: ConsentItem) => boolean,
  onDocumentAction: (item: ConsentItem) => void
) {
  if (cell === 'empty') return <ConsentEmptyHalf />
  if (!cell) return null
  return (
    <ConsentField
      item={cell}
      value={consents[cell.key]}
      onChange={next => setConsent(cell.key, next)}
      documentAvailable={documentAvailableFor(cell)}
      onDocumentAction={() => onDocumentAction(cell)}
    />
  )
}

function ConsentBlockForm({
  rows,
  consents,
  setConsent,
  documentAvailableFor,
  onDocumentAction,
}: {
  rows: (ConsentItem | 'empty')[][]
  consents: UjatVolunteerAddRegistrationConsentState
  setConsent: (key: ConsentFieldKey, next: ConsentValue) => void
  documentAvailableFor: (item: ConsentItem) => boolean
  onDocumentAction: (item: ConsentItem) => void
}) {
  return (
    <DetailInfoForm title="약관 및 동의" hideHeader mode="edit">
      {rows.map((pair, rowIndex) => (
        <DetailInfoForm.Row key={rowIndex} type="double">
          {renderConsentCell(
            pair[0],
            consents,
            setConsent,
            documentAvailableFor,
            onDocumentAction
          )}
          {renderConsentCell(
            pair[1],
            consents,
            setConsent,
            documentAvailableFor,
            onDocumentAction
          )}
        </DetailInfoForm.Row>
      ))}
    </DetailInfoForm>
  )
}

/** 관리자 대리 작성 — 약관 및 동의(상·하 2블록 분리, 시안·기관 상세 form-stack 패턴) */
export function UjatEducationProgressVolunteerTermsConsentSection({
  memberId,
  programId,
  consents,
  onConsentsChange,
}: {
  memberId: string
  /** 담당 프로그램 Program Owner일 때만 주민등록번호 포함 동의서 파일 열람·다운로드 */
  programId?: string | number | null
  consents: UjatVolunteerAddRegistrationConsentState
  onConsentsChange: (next: UjatVolunteerAddRegistrationConsentState) => void
}) {
  const numericMemberId = Number(memberId)
  const { canRevealSensitive: isProgramOwner } = useMyProgramPrivacyRole(programId)
  const membersRemote = isMembersRemoteEnabled() && Number.isFinite(numericMemberId) && numericMemberId > 0
  const consentRecordsQuery = useMemberConsentRecordsQuery(
    numericMemberId,
    membersRemote
  )
  const [activeView, setActiveView] = useState<{
    templateId: string
    modalTitle: string
    consentType?: string
    documentAgreed?: boolean
    filledDocumentAvailable?: boolean
    formResponseId?: number
    consentRecordId?: number
    filledDocumentId?: number
    filledDocumentRevealEndpoint?: string
  } | null>(null)

  const records = consentRecordsQuery.data

  const setConsent = (key: ConsentFieldKey, next: ConsentValue) => {
    onConsentsChange({ ...consents, [key]: next })
  }

  const documentAvailableFor = (item: ConsentItem) => {
    if (!item.documentButton) return false
    return canViewSubmittedConsentDocument(findConsentRecordForLabel(records, item.label))
  }

  const onDocumentAction = (item: ConsentItem) => {
    const record = findConsentRecordForLabel(records, item.label)
    if (!canViewSubmittedConsentDocument(record)) return
    const entry = resolveMemberConsentTemplateByLabel(item.label)
    if (!entry || !membersRemote) return
    setActiveView({
      templateId: entry.templateId,
      modalTitle: entry.modalTitle,
      consentType: record?.consentType,
      documentAgreed: record?.consentValue === true,
      filledDocumentAvailable: record?.filledDocumentAvailable,
      formResponseId: record?.formResponseId,
      consentRecordId: record?.consentRecordId,
      filledDocumentId: record?.filledDocumentId,
      filledDocumentRevealEndpoint: record?.filledDocumentRevealEndpoint,
    })
  }

  const blockProps = {
    consents,
    setConsent,
    documentAvailableFor,
    onDocumentAction,
  }

  return (
    <>
      <DetailInfoForm
        title="약관 및 동의"
        description={TERMS_CONSENT_DESCRIPTION}
        mode="edit"
        className="ujat-volunteer-add-registration__terms-consent-heading"
      >
        <div className="ujat-volunteer-add-registration__terms-consent-form-stack">
          <ConsentBlockForm rows={CONSENT_BLOCK_PRIMARY} {...blockProps} />
          <ConsentBlockForm rows={CONSENT_BLOCK_SECONDARY} {...blockProps} />
        </div>
      </DetailInfoForm>
      {activeView ? (
        <MemberConsentDocumentViewModal
          open
          templateId={activeView.templateId}
          modalTitle={activeView.modalTitle}
          memberId={numericMemberId}
          consentType={activeView.consentType}
          membersRemote={membersRemote}
          filledDocumentAvailable={activeView.filledDocumentAvailable}
          formResponseId={activeView.formResponseId}
          consentRecordId={activeView.consentRecordId}
          filledDocumentId={activeView.filledDocumentId}
          filledDocumentRevealEndpoint={activeView.filledDocumentRevealEndpoint}
          documentAgreed={activeView.documentAgreed}
          isProgramOwner={isProgramOwner}
          onClose={() => setActiveView(null)}
        />
      ) : null}
    </>
  )
}
