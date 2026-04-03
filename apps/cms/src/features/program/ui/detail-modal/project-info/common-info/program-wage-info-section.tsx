/**
 * 임금 정보 테이블 (프로그램 상세 공통 정보 탭)
 */

import { useEffect, useMemo, type ReactNode } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { AppInput } from '@/shared/ui/app-input'
import { AppSelect } from '@/shared/ui/app-select'
import { AppRadio } from '@/shared/ui/app-radio'
import {
  getProgramWageInfoMock,
  PROGRAM_WAGE_TYPE_OPTIONS,
  PROGRAM_WAGE_PRICING_MEASURE_OPTIONS,
} from '@/data/mock/program-wage-info'
import type { ProgramDetailEditFormValues } from '../../../../model/program-detail-edit-schema'
import './program-wage-info-section.css'

export interface ProgramWageInfoSectionProps {
  programId: string
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

const WAGE_COMPARE_RADIO_OPTIONS = [
  { value: 'per' as const, label: '기준(당)' },
  { value: 'over' as const, label: '초과' },
  { value: 'under' as const, label: '이하' },
]

function WageValueParts({ text }: { text: string }) {
  const parts = text.split(/\s*\|\s*/)
  if (parts.length <= 1) return <>{text}</>
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 ? <span className="program-detail-info-tab__separator"> | </span> : null}
          {p}
        </span>
      ))}
    </>
  )
}

function parsePricingDisplay(text: string): {
  timeUnit: string
  basePrice: string
  longDistancePrice: string
} {
  const parts = text.split(/\s*\|\s*/).map(v => v.trim())
  const timeUnit = parts[0] ?? '1시간 당'
  const basePrice =
    parts.find(v => v.startsWith('기본'))?.replace(/^기본(?: 강사비)?\s*:\s*/, '') ?? '240,000원'
  const longDistancePrice =
    parts
      .find(v => v.startsWith('장거리'))
      ?.replace(/^장거리(?: 강사비)?\s*:\s*/, '') ?? '300,000원'
  return { timeUnit, basePrice, longDistancePrice }
}

type WageCompareMode = 'per' | 'over' | 'under'

/** "1시간 당" 등 → 단위·수량·비교 모드 */
function parseWagePricingBasis(timeUnitPart: string): {
  measureLabel: string
  quantity: number
  compareMode: WageCompareMode
} {
  const s = timeUnitPart.replace(/\s+/g, ' ').trim()
  const re = /^(\d+)\s*시간\s*(당|초과|이하)?$/
  const m = s.match(re)
  if (m) {
    const qty = Math.max(0, parseInt(m[1], 10) || 1)
    const tail = m[2]
    const compareMode: WageCompareMode =
      tail === '초과' ? 'over' : tail === '이하' ? 'under' : 'per'
    return { measureLabel: '시간', quantity: qty, compareMode }
  }
  const numMatch = s.match(/(\d+)/)
  const qty = numMatch ? Math.max(0, parseInt(numMatch[1], 10) || 1) : 1
  let compareMode: WageCompareMode = 'per'
  if (s.includes('초과')) compareMode = 'over'
  else if (s.includes('이하')) compareMode = 'under'
  return { measureLabel: '시간', quantity: qty, compareMode }
}

function composeWagePricingTimeUnit(
  measureLabel: string | undefined,
  quantity: number | undefined,
  compareMode: WageCompareMode | undefined
): string {
  const q =
    quantity != null && !Number.isNaN(Number(quantity)) ? Math.max(0, Number(quantity)) : 1
  const measure = measureLabel?.trim() || '시간'
  const mode: WageCompareMode = compareMode ?? 'per'
  const suffix = mode === 'over' ? '초과' : mode === 'under' ? '이하' : '당'
  if (measure === '시간') {
    return `${q}시간 ${suffix}`.replace(/\s+/g, ' ').trim()
  }
  return `${q}${measure} ${suffix}`.replace(/\s+/g, ' ').trim()
}

function syncWagePricingTimeUnit(form: UseFormReturn<ProgramDetailEditFormValues>) {
  const v = form.getValues()
  form.setValue(
    'wagePricingTimeUnit',
    composeWagePricingTimeUnit(
      v.wagePricingMeasureLabel,
      v.wagePricingQuantity,
      v.wagePricingCompareMode
    )
  )
}

/** 임금 정보 테이블: 필수 표시(*)는 수정 모드(폼 연동)에서만 */
function WageRequiredTh({
  children,
  showRequired,
}: {
  children: ReactNode
  showRequired: boolean
}) {
  return (
    <th className={showRequired ? 'program-detail-info-tab__th--required' : undefined}>
      {children}
      {showRequired ? <span className="program-detail-info-tab__required">*</span> : null}
    </th>
  )
}

export function ProgramWageInfoSection({
  programId,
  isEditMode = false,
  form,
}: ProgramWageInfoSectionProps) {
  const data = useMemo(() => getProgramWageInfoMock(programId), [programId])
  const isFormEdit = isEditMode && form
  const parsedPricing = useMemo(() => parsePricingDisplay(data.pricingDisplay), [data.pricingDisplay])

  useEffect(() => {
    if (!isFormEdit || !form) return
    const current = form.getValues()
    if (!current.wageType) form.setValue('wageType', data.wageType)
    if (!current.wagePricingTimeUnit) form.setValue('wagePricingTimeUnit', parsedPricing.timeUnit)
    const basis = parseWagePricingBasis(parsedPricing.timeUnit)
    if (current.wagePricingMeasureLabel === undefined) {
      form.setValue('wagePricingMeasureLabel', basis.measureLabel)
    }
    if (current.wagePricingQuantity === undefined) {
      form.setValue('wagePricingQuantity', basis.quantity)
    }
    if (current.wagePricingCompareMode === undefined) {
      form.setValue('wagePricingCompareMode', basis.compareMode)
    }
    if (!current.wagePricingBase) form.setValue('wagePricingBase', parsedPricing.basePrice)
    if (!current.wagePricingLongDistance) {
      form.setValue('wagePricingLongDistance', parsedPricing.longDistancePrice)
    }
  }, [isFormEdit, form, data, parsedPricing])

  return (
    <section className="program-wage-info-section">
      <div className="program-detail-info-tab__section-title">임금 정보</div>
      <div className="program-wage-info-section__table-wrap">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-wage-info-section__table">
          <colgroup>
            <col className="program-wage-info-section__col-label" />
            <col />
            <col className="program-wage-info-section__col-label" />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <WageRequiredTh showRequired={!!isFormEdit}>강사비 유형</WageRequiredTh>
              <td>
                {isFormEdit && form ? (
                  <Controller
                    name="wageType"
                    control={form.control}
                    render={({ field }) => {
                      const current = field.value?.trim() ?? ''
                      const inPreset = PROGRAM_WAGE_TYPE_OPTIONS.some(o => o.value === current)
                      const options =
                        current && !inPreset
                          ? [...PROGRAM_WAGE_TYPE_OPTIONS, { value: current, label: current }]
                          : PROGRAM_WAGE_TYPE_OPTIONS
                      return (
                        <AppSelect
                          value={current || undefined}
                          options={options}
                          placeholder="강사비 유형 선택"
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          onChange={v => field.onChange(v ?? undefined)}
                          className="program-wage-info-section__wage-type-select"
                        />
                      )
                    }}
                  />
                ) : (
                  data.wageType
                )}
              </td>
              <WageRequiredTh showRequired={!!isFormEdit}>강사비 책정</WageRequiredTh>
              <td className="program-wage-info-section__td-pricing-basis">
                {isFormEdit && form ? (
                  <div className="program-wage-info-section__pricing-basis-row">
                    <Controller
                      name="wagePricingMeasureLabel"
                      control={form.control}
                      render={({ field }) => (
                        <AppSelect
                          value={field.value || '시간'}
                          options={PROGRAM_WAGE_PRICING_MEASURE_OPTIONS}
                          onChange={v => {
                            field.onChange(v ?? '시간')
                            syncWagePricingTimeUnit(form)
                          }}
                          allowClear={false}
                          className="program-wage-info-section__measure-select"
                        />
                      )}
                    />
                    <Controller
                      name="wagePricingQuantity"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => {
                            const raw = e.target.value
                            const n = parseInt(raw, 10)
                            field.onChange(raw === '' ? undefined : Number.isNaN(n) ? undefined : n)
                            syncWagePricingTimeUnit(form)
                          }}
                          className="program-wage-info-section__input program-wage-info-section__input--qty"
                        />
                      )}
                    />
                    <span className="program-wage-info-section__pricing-basis-unit-suffix">
                      {form.watch('wagePricingMeasureLabel') || '시간'}
                    </span>
                    <Controller
                      name="wagePricingCompareMode"
                      control={form.control}
                      render={({ field }) => (
                        <AppRadio.Group
                          className="program-wage-info-section__compare-radios"
                          value={field.value ?? 'per'}
                          options={WAGE_COMPARE_RADIO_OPTIONS}
                          onChange={e => {
                            field.onChange(e.target.value as WageCompareMode)
                            syncWagePricingTimeUnit(form)
                          }}
                        />
                      )}
                    />
                  </div>
                ) : (
                  <WageValueParts text={data.pricingDisplay} />
                )}
              </td>
            </tr>
            {isFormEdit && form ? (
              <tr>
                <WageRequiredTh showRequired>기본 강사비</WageRequiredTh>
                <td>
                  <div className="program-wage-info-section__amount-row">
                    <Controller
                      name="wagePricingBase"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          {...field}
                          value={field.value ?? ''}
                          placeholder="직접 입력"
                          className="program-wage-info-section__input program-wage-info-section__input--price"
                        />
                      )}
                    />
                    <span className="program-wage-info-section__amount-unit">원</span>
                  </div>
                </td>
                <WageRequiredTh showRequired>장거리 강사비</WageRequiredTh>
                <td>
                  <div className="program-wage-info-section__amount-row">
                    <Controller
                      name="wagePricingLongDistance"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          {...field}
                          value={field.value ?? ''}
                          placeholder="직접 입력"
                          className="program-wage-info-section__input program-wage-info-section__input--price"
                        />
                      )}
                    />
                    <span className="program-wage-info-section__amount-unit">원</span>
                  </div>
                </td>
              </tr>
            ) : null}
            <tr>
              <WageRequiredTh showRequired={!!isFormEdit}>지급 항목</WageRequiredTh>
              <td>
                <div className="program-wage-info-section__cell-plain-text">{data.paymentItems}</div>
              </td>
              <WageRequiredTh showRequired={!!isFormEdit}>공제 항목</WageRequiredTh>
              <td>
                <div className="program-wage-info-section__cell-plain-text">{data.deductionItems}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
