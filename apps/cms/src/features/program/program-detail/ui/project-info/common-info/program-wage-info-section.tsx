/**
 * 임금 정보 섹션 (프로그램 상세 공통 정보 탭)
 */

import { useEffect, useMemo } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { DetailInfoForm } from '@/shared/components/detail-info-form/detail-info-form'
import {
  getProgramWageInfoMock,
  PROGRAM_WAGE_TYPE_OPTIONS,
  PROGRAM_WAGE_PRICING_MEASURE_OPTIONS,
} from '@/data/mock/program-wage-info'
import type { ProgramDetailEditFormValues } from '../../../../model/program-detail-edit-schema'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsInput } from '@/shared/ui/cms-input'

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
          {i > 0 ? <DetailInfoForm.InputsSeparator /> : null}
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
    parts.find(v => v.startsWith('장거리'))?.replace(/^장거리(?: 강사비)?\s*:\s*/, '') ??
    '300,000원'
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
  const q = quantity != null && !Number.isNaN(Number(quantity)) ? Math.max(0, Number(quantity)) : 1
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

export function ProgramWageInfoSection({
  programId,
  isEditMode = false,
  form,
}: ProgramWageInfoSectionProps) {
  const data = useMemo(() => getProgramWageInfoMock(programId), [programId])
  const isFormEdit = isEditMode && form
  const parsedPricing = useMemo(
    () => parsePricingDisplay(data.pricingDisplay),
    [data.pricingDisplay]
  )

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
    <DetailInfoForm
      title="임금 정보"
      mode={isFormEdit ? 'edit' : 'view'}
      className="detail-info-form--gap"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="강사비 유형"
          required
          view={data.wageType}
          edit={
            isFormEdit && form ? (
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
                    <CmsSelect
                      value={current || undefined}
                      options={options}
                      placeholder="강사비 유형 선택"
                      showSearch
                      optionFilterProp="label"
                      onChange={v => field.onChange(v == null || v === '' ? undefined : v)}
                    />
                  )
                }}
              />
            ) : undefined
          }
        />
        <DetailInfoForm.Field
          label="강사비 책정"
          required
          view={<WageValueParts text={data.pricingDisplay} />}
          edit={
            isFormEdit && form ? (
              <div>
                <div className="detail-info-form-inputs-wrapper">
                  <Controller
                    name="wagePricingMeasureLabel"
                    control={form.control}
                    render={({ field }) => (
                      <CmsSelect
                        width={96}
                        style={{ flexShrink: 0 }}
                        value={field.value || '시간'}
                        options={PROGRAM_WAGE_PRICING_MEASURE_OPTIONS}
                        onChange={v => {
                          field.onChange(
                            v === '' || v == null ? '시간' : (v as string)
                          )
                          syncWagePricingTimeUnit(form)
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="wagePricingQuantity"
                    control={form.control}
                    render={({ field }) => (
                      <CmsInput
                        width={112}
                        style={{ flexShrink: 0 }}
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
                      />
                    )}
                  />
                  <div style={{ flexShrink: 0 }}>
                    {form.watch('wagePricingMeasureLabel') || '시간'}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 4 }}>
                    <Controller
                      name="wagePricingCompareMode"
                      control={form.control}
                      render={({ field }) => (
                        <CmsRadio.Group
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
                </div>
              </div>
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      {isFormEdit && form ? (
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="기본 강사비"
            required
            view="-"
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <Controller
                  name="wagePricingBase"
                  control={form.control}
                  render={({ field }) => (
                    <CmsInput {...field} value={field.value ?? ''} placeholder="직접 입력" />
                  )}
                />
                <span>원</span>
              </div>
            }
          />
          <DetailInfoForm.Field
            label="장거리 강사비"
            required
            view="-"
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <Controller
                  name="wagePricingLongDistance"
                  control={form.control}
                  render={({ field }) => (
                    <CmsInput {...field} value={field.value ?? ''} placeholder="직접 입력" />
                  )}
                />
                <span>원</span>
              </div>
            }
          />
        </DetailInfoForm.Row>
      ) : null}

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="지급 항목" required view={data.paymentItems} />
        <DetailInfoForm.Field label="공제 항목" required view={data.deductionItems} />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
