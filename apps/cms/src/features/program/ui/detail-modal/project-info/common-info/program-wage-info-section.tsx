/**
 * 임금 정보 테이블 (프로그램 상세 공통 정보 탭)
 */

import { useEffect, useMemo } from 'react'
import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import { AppInput } from '@/shared/ui/app-input'
import { getProgramWageInfoMock } from '@/data/mock/program-wage-info'
import type { ProgramDetailEditFormValues } from '../../../../model/program-detail-edit-schema'
import './program-wage-info-section.css'

export interface ProgramWageInfoSectionProps {
  programId: string
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

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
    if (!current.wagePricingBase) form.setValue('wagePricingBase', parsedPricing.basePrice)
    if (!current.wagePricingLongDistance) {
      form.setValue('wagePricingLongDistance', parsedPricing.longDistancePrice)
    }
    if (!current.wagePaymentItems) form.setValue('wagePaymentItems', data.paymentItems)
    if (!current.wageDeductionItems) form.setValue('wageDeductionItems', data.deductionItems)
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
              <th>강사비 유형</th>
              <td>
                {isFormEdit && form ? (
                  <Controller
                    name="wageType"
                    control={form.control}
                    render={({ field }) => (
                      <AppInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="강사비 유형 입력"
                        className="program-wage-info-section__input"
                      />
                    )}
                  />
                ) : (
                  data.wageType
                )}
              </td>
              <th>임금 책정 기준</th>
              <td>
                {isFormEdit && form ? (
                  <div className="program-wage-info-section__pricing-row">
                    <Controller
                      name="wagePricingTimeUnit"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          {...field}
                          value={field.value ?? ''}
                          placeholder="시간"
                          className="program-wage-info-section__input program-wage-info-section__input--time"
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
                <th>기본 강사비</th>
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
                <th>장거리 강사비</th>
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
              <th>지급 항목</th>
              <td>
                {isFormEdit && form ? (
                  <Controller
                    name="wagePaymentItems"
                    control={form.control}
                    render={({ field }) => (
                      <AppInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="지급 항목 입력"
                        className="program-wage-info-section__input"
                      />
                    )}
                  />
                ) : (
                  data.paymentItems
                )}
              </td>
              <th>공제 항목</th>
              <td>
                {isFormEdit && form ? (
                  <Controller
                    name="wageDeductionItems"
                    control={form.control}
                    render={({ field }) => (
                      <AppInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="공제 항목 입력"
                        className="program-wage-info-section__input"
                      />
                    )}
                  />
                ) : (
                  data.deductionItems
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
