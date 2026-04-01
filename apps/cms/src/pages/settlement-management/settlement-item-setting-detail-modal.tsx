/**
 * 정산 항목 설정 — 카드 클릭 시 항목 상세(산정 기준·금액·자격·비고)
 */

import { useState } from 'react'
import { message } from 'antd'
import type { SettlementItemSettingRow } from '@/data/mock/settlement-item-settings'
import {
  getSettlementItemSettingDetail,
  type SettlementItemEvidenceSubmission,
  type SettlementItemSettingCompareKind,
} from '@/data/mock/settlement-item-setting-detail.mock'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import { AppRadio } from '@/shared/ui/app-radio'
import { SettlementItemSettingIcon } from './settlement-item-setting-icons'
import './settlement-item-setting-detail-modal.css'
import { AppInput } from '@/shared/ui/app-input'
import { AppSelect } from '@/shared/ui/app-select'

const BASIS_UNIT_OPTIONS_TIER1 = [{ value: '시간', label: '시간' }]
const BASIS_UNIT_OPTIONS_TRANSPORT = [{ value: '거리', label: '거리' }]
const BASIS_UNIT_OPTIONS_SIMPLE = [{ value: '전체', label: '전체' }]

function formatWonDisplay(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return ''
  return Math.round(n).toLocaleString('ko-KR')
}

function parseWonInput(s: string): string {
  const digits = s.replace(/[^\d]/g, '')
  if (digits === '') return ''
  return Number(digits).toLocaleString('ko-KR')
}

function buildInitialFormState(itemId: string) {
  const d = getSettlementItemSettingDetail(itemId)
  return {
    basisUnit: d.basisUnit,
    basisHoursStr: String(d.basisHours),
    compareKind: d.compareKind,
    maxLimitStr: formatWonDisplay(d.maxLimitWon),
    basicFeeStr: d.basicFeeWon != null ? formatWonDisplay(d.basicFeeWon) : '',
    longDistanceFeeStr: d.longDistanceFeeWon != null ? formatWonDisplay(d.longDistanceFeeWon) : '',
    evidenceSubmission: (d.evidenceSubmission ??
      'not_required') as SettlementItemEvidenceSubmission,
  }
}

/** item.id 가 바뀔 때마다 key 로 리마운트되어 목업 기준으로 초기화됨 */
function SettlementItemSettingDetailModalBody({ itemId }: { itemId: string }) {
  const initial = buildInitialFormState(itemId)
  const [basisUnit, setBasisUnit] = useState(initial.basisUnit)
  const [basisHoursStr, setBasisHoursStr] = useState(initial.basisHoursStr)
  const [compareKind, setCompareKind] = useState<SettlementItemSettingCompareKind>(
    initial.compareKind
  )
  const [maxLimitStr, setMaxLimitStr] = useState(initial.maxLimitStr)
  const [basicFeeStr, setBasicFeeStr] = useState(initial.basicFeeStr)
  const [longDistanceFeeStr, setLongDistanceFeeStr] = useState(initial.longDistanceFeeStr)
  const [evidenceSubmission, setEvidenceSubmission] = useState<SettlementItemEvidenceSubmission>(
    initial.evidenceSubmission
  )

  const detail = getSettlementItemSettingDetail(itemId)
  const isTier1 = detail.layout === 'tier1'
  const isTransport = detail.layout === 'transport'
  const showTier1Basis = isTier1 || isTransport

  const handleHoursChange = (v: string) => {
    if (v === '') {
      setBasisHoursStr('')
      return
    }
    const digits = v.replace(/[^\d]/g, '')
    if (digits === '') {
      setBasisHoursStr('')
      return
    }
    setBasisHoursStr(String(Number.parseInt(digits, 10) || 0))
  }

  return (
    <>
      <section aria-labelledby="settlement-detail-basis-label">
        <h3
          id="settlement-detail-basis-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          산정 기준
        </h3>
        {showTier1Basis ? (
          <div className="settlement-item-setting-detail-modal__basis-row">
            <div className="settlement-item-setting-detail-modal__basis-controls">
              <div style={{ width: '50%' }}>
                <AppSelect
                  value={basisUnit}
                  onChange={v => setBasisUnit(v)}
                  options={isTransport ? BASIS_UNIT_OPTIONS_TRANSPORT : BASIS_UNIT_OPTIONS_TIER1}
                />
              </div>
              <div style={{ width: '50%' }}>
                <AppInput
                  className="settlement-item-setting-detail-modal__basis-hours"
                  value={basisHoursStr}
                  onChange={e => handleHoursChange(e.target.value)}
                  inputMode="numeric"
                  suffix={isTransport ? 'km' : '시간'}
                />
              </div>
            </div>
            <AppRadio.Group
              className="settlement-item-setting-detail-modal__basis-radios"
              value={compareKind}
              onChange={e => setCompareKind(e.target.value as SettlementItemSettingCompareKind)}
            >
              <AppRadio value="standard">기준(당)</AppRadio>
              <AppRadio value="exceed">초과</AppRadio>
              <AppRadio value="below">이하</AppRadio>
            </AppRadio.Group>
          </div>
        ) : (
          <div className="settlement-item-setting-detail-modal__basis-row settlement-item-setting-detail-modal__basis-row--simple">
            <AppSelect
              value={basisUnit}
              onChange={v => setBasisUnit(v)}
              options={BASIS_UNIT_OPTIONS_SIMPLE}
            />
          </div>
        )}
      </section>

      <section aria-label={isTier1 ? '최대 한도 및 강사비' : '최대 한도 금액'}>
        {isTier1 ? (
          <div className="settlement-item-setting-detail-modal__fee-row">
            <div className="settlement-item-setting-detail-modal__fee-col">
              <AppInput
                label="최대 한도 금액"
                suffix="원"
                value={maxLimitStr}
                onChange={e => setMaxLimitStr(parseWonInput(e.target.value))}
                inputMode="numeric"
              />
            </div>
            <div className="settlement-item-setting-detail-modal__fee-divider" aria-hidden />
            <div className="settlement-item-setting-detail-modal__fee-col">
              <AppInput
                label="기본 강사비"
                suffix="원"
                placeholder="직접 입력"
                value={basicFeeStr}
                onChange={e => setBasicFeeStr(parseWonInput(e.target.value))}
                inputMode="numeric"
              />
            </div>
            <div className="settlement-item-setting-detail-modal__fee-divider" aria-hidden />
            <div className="settlement-item-setting-detail-modal__fee-col">
              <AppInput
                label="장거리 강사비"
                suffix="원"
                placeholder="직접 입력"
                value={longDistanceFeeStr}
                onChange={e => setLongDistanceFeeStr(parseWonInput(e.target.value))}
                inputMode="numeric"
              />
            </div>
          </div>
        ) : (
          <div className="settlement-item-setting-detail-modal__fee-row settlement-item-setting-detail-modal__fee-row--simple">
            <div className="settlement-item-setting-detail-modal__fee-col">
              <AppInput
                label="최대 한도 금액"
                suffix="원"
                placeholder="직접 입력"
                value={maxLimitStr}
                onChange={e => setMaxLimitStr(parseWonInput(e.target.value))}
                inputMode="numeric"
              />
            </div>
          </div>
        )}
      </section>

      {isTransport ? (
        <section aria-labelledby="settlement-detail-support-label">
          <h3
            id="settlement-detail-support-label"
            className="settlement-item-setting-detail-modal__section-label"
          >
            지원 기준
          </h3>
          <div
            className="settlement-item-setting-detail-modal__richtext settlement-item-setting-detail-modal__richtext--support104"
            role="region"
            aria-label="지원 기준"
          >
            {(detail.supportCriteriaLines?.length ?? 0) > 0 ? (
              <ul>
                {(detail.supportCriteriaLines ?? []).map(line => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <span className="settlement-item-setting-detail-modal__basis-unit-text">—</span>
            )}
          </div>
        </section>
      ) : (
        <section aria-labelledby="settlement-detail-qual-label">
          <h3
            id="settlement-detail-qual-label"
            className="settlement-item-setting-detail-modal__section-label"
          >
            자격 요건
          </h3>
          <div
            className={`settlement-item-setting-detail-modal__richtext settlement-item-setting-detail-modal__richtext--qual${isTier1 ? '152' : '56'}`}
            role="region"
            aria-label="자격 요건"
          >
            {detail.qualificationLines.length > 0 ? (
              <ul>
                {detail.qualificationLines.map(line => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <span className="settlement-item-setting-detail-modal__basis-unit-text">—</span>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="settlement-detail-remark-label">
        <h3
          id="settlement-detail-remark-label"
          className="settlement-item-setting-detail-modal__section-label"
        >
          비고
        </h3>
        <div
          className="settlement-item-setting-detail-modal__richtext settlement-item-setting-detail-modal__richtext--remark"
          role="region"
          aria-label="비고"
        >
          {detail.remarkLines.length > 0 ? (
            <ul>
              {detail.remarkLines.map(line => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <span className="settlement-item-setting-detail-modal__basis-unit-text">—</span>
          )}
        </div>
      </section>

      {isTransport ? (
        <section aria-labelledby="settlement-detail-evidence-label">
          <h3
            id="settlement-detail-evidence-label"
            className="settlement-item-setting-detail-modal__section-label"
          >
            증빙 자료 제출 여부
          </h3>
          <AppRadio.Group
            className="settlement-item-setting-detail-modal__evidence-radios"
            value={evidenceSubmission}
            onChange={e =>
              setEvidenceSubmission(e.target.value as SettlementItemEvidenceSubmission)
            }
          >
            <AppRadio value="required">필요</AppRadio>
            <AppRadio value="not_required">불필요</AppRadio>
          </AppRadio.Group>
        </section>
      ) : null}
    </>
  )
}

export interface SettlementItemSettingDetailModalProps {
  open: boolean
  onCancel: () => void
  /** 저장 시 현재 항목 id 전달(연동용) */
  onSave?: (itemId: string) => void
  item: SettlementItemSettingRow | null
}

export function SettlementItemSettingDetailModal({
  open,
  onCancel,
  onSave,
  item,
}: SettlementItemSettingDetailModalProps) {
  const show = open && item !== null

  const handleSave = () => {
    if (!item) return
    onSave?.(item.id)
    void message.success('저장되었습니다.')
    onCancel()
  }

  return (
    <ContentModal
      open={show}
      onCancel={onCancel}
      title={item?.title ?? ''}
      titlePrefix={
        item ? (
          <span className="settlement-item-setting-detail-modal__header-icon">
            <SettlementItemSettingIcon iconKey={item.iconKey} />
          </span>
        ) : undefined
      }
      width={800}
      className={[
        'settlement-item-setting-detail-modal',
        item?.id === 'w-4' ? 'settlement-item-setting-detail-modal--special-lecture' : '',
        item?.id === 'p-1' ? 'settlement-item-setting-detail-modal--transport' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      footer={
        <>
          <AppButton variant="cancel" size="large" onClick={onCancel}>
            취소
          </AppButton>
          <AppButton variant="primary" size="tableAction" modalTeal onClick={handleSave}>
            저장
          </AppButton>
        </>
      }
    >
      {item ? <SettlementItemSettingDetailModalBody key={item.id} itemId={item.id} /> : null}
    </ContentModal>
  )
}
