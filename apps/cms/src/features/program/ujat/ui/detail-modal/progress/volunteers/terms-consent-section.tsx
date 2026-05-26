import { useState } from 'react'
import { Space } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, CmsRadioGroup } from '@/shared/ui'

type ConsentValue = 'agree' | 'disagree'

const CONSENT_RADIO_OPTIONS = [
  { label: '동의', value: 'agree' },
  { label: '미동의', value: 'disagree' },
]

const TERMS_CONSENT_DESCRIPTION =
  '*미동의 시 서비스 가입 및 프로그램 참여에 제한이 있을 수 있습니다.'

type ConsentFieldKey =
  | 'serviceTerms'
  | 'personalInfo'
  | 'marketing'
  | 'portrait'
  | 'educationPledge'
  | 'jointUse'
  | 'sexOffenseCheck'

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
    { key: 'portrait', label: '초상권 수집이용 동의', documentButton: 'write' },
  ],
]

const CONSENT_BLOCK_SECONDARY: (ConsentItem | 'empty')[][] = [
  [{ key: 'educationPledge', label: '교육진행자 서약서', documentButton: 'edit' }, 'empty'],
  [
    { key: 'jointUse', label: '행정정보 공동이용 사전동의서', documentButton: 'write' },
    { key: 'sexOffenseCheck', label: '성범죄 경력 조회 동의서', documentButton: 'write' },
  ],
]

const INITIAL_CONSENTS: Record<ConsentFieldKey, ConsentValue> = {
  serviceTerms: 'agree',
  personalInfo: 'agree',
  marketing: 'agree',
  portrait: 'agree',
  educationPledge: 'agree',
  jointUse: 'agree',
  sexOffenseCheck: 'agree',
}

function ConsentFieldEdit({
  value,
  onChange,
  documentButton,
  onDocumentAction,
}: {
  value: ConsentValue
  onChange: (next: ConsentValue) => void
  documentButton?: 'write' | 'edit'
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
        value={value}
        onChange={e => onChange(e.target.value as ConsentValue)}
      />
      {documentButton ? (
        <>
          <DetailInfoForm.InputsSeparator />
          <CmsButton
            variant={documentButton === 'edit' ? 'primary' : 'secondary'}
            size="medium"
            type="button"
            disabled={value !== 'agree'}
            onClick={onDocumentAction}
          >
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
  onDocumentAction,
}: {
  item: ConsentItem
  value: ConsentValue
  onChange: (next: ConsentValue) => void
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
  consents: Record<ConsentFieldKey, ConsentValue>,
  setConsent: (key: ConsentFieldKey, next: ConsentValue) => void,
  onDocumentAction: () => void
) {
  if (cell === 'empty') return <ConsentEmptyHalf />
  if (!cell) return null
  return (
    <ConsentField
      item={cell}
      value={consents[cell.key]}
      onChange={next => setConsent(cell.key, next)}
      onDocumentAction={onDocumentAction}
    />
  )
}

function ConsentBlockForm({
  rows,
  consents,
  setConsent,
  onDocumentAction,
}: {
  rows: (ConsentItem | 'empty')[][]
  consents: Record<ConsentFieldKey, ConsentValue>
  setConsent: (key: ConsentFieldKey, next: ConsentValue) => void
  onDocumentAction: () => void
}) {
  return (
    <DetailInfoForm title="약관 및 동의" hideHeader mode="edit">
      {rows.map((pair, rowIndex) => (
        <DetailInfoForm.Row key={rowIndex} type="double">
          {renderConsentCell(pair[0], consents, setConsent, onDocumentAction)}
          {renderConsentCell(pair[1], consents, setConsent, onDocumentAction)}
        </DetailInfoForm.Row>
      ))}
    </DetailInfoForm>
  )
}

/** 관리자 대리 작성 — 약관 및 동의(상·하 2블록 분리, 시안·기관 상세 form-stack 패턴) */
export function UjatEducationProgressVolunteerTermsConsentSection() {
  const [consents, setConsents] = useState(INITIAL_CONSENTS)

  const setConsent = (key: ConsentFieldKey, next: ConsentValue) => {
    setConsents(prev => ({ ...prev, [key]: next }))
  }

  const handleDocumentAction = () => {
    window.alert('준비 중입니다')
  }

  const blockProps = {
    consents,
    setConsent,
    onDocumentAction: handleDocumentAction,
  }

  return (
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
  )
}
