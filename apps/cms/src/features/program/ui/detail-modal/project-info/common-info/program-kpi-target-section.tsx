/**
 * 사업 KPI 목표 테이블 섹션
 * 프로그램 상세 공통 정보 탭 하단에 표시 (참여자 최종 인원, 최종 파견 학교 수, 교육진행자 최종 인원, 최종 파견 학급 수)
 * td 영역에서는 숫자 텍스트만 볼드 처리.
 * 수정 모드 시 form 연동으로 Input 표시.
 */

import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { AppInput } from '@/shared/ui/app-input'
import { Controller } from 'react-hook-form'
import { getKpiAchievementList } from '@/features/dashboard/api/admin-dashboard-service'
import type { KpiMetric } from '@/features/dashboard/api/admin-dashboard-service'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '../../../../model/program-detail-edit-schema'
import './program-kpi-target-section.css'

export interface ProgramKpiTargetSectionProps {
  programId: string
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

const EDUCATION_INSTRUCTOR_LABEL = '교육진행자 최종 인원'

const KPI_SEGMENT_REGEX = /([^:]+?):\s*(\d+(?:\.\d+)?)/g

function boldNumbersInSegment(segment: string, keyPrefix: string): ReactNode[] {
  const parts = segment.split(/(\d+)/)
  return parts.map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={`${keyPrefix}-${i}`} className="program-kpi-target-section__value">
        {part}
      </span>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    )
  )
}

/** td 내용 중 숫자만 볼드 처리. 여러 "라벨: 숫자" 구간은 ` | ` 구분자로 연결 */
function formatKpiValueWithBoldNumbers(value: string | number | undefined): ReactNode {
  if (value === undefined || value === null || value === '') return '-'
  const str = String(value).trim()
  if (str === '-') return '-'
  if (/^\d+(\.\d+)?$/.test(str)) {
    return <span className="program-kpi-target-section__value">{str}</span>
  }

  const matches = [...str.matchAll(KPI_SEGMENT_REGEX)]

  if (matches.length >= 2) {
    const nodes: ReactNode[] = []
    matches.forEach((m, idx) => {
      if (idx > 0) {
        nodes.push(
          <span key={`kpi-sep-${idx}`} className="program-detail-info-tab__separator">
            {' | '}
          </span>
        )
      }
      nodes.push(...boldNumbersInSegment(m[0], `kpi-seg-${idx}`))
    })
    return <>{nodes}</>
  }

  if (matches.length === 1) {
    const [first] = matches
    const rest = str.slice(first.index! + first[0].length).trim()
    if (!rest) {
      return <>{boldNumbersInSegment(first[0], 'kpi-seg-0')}</>
    }
  }

  return <>{boldNumbersInSegment(str, 'kpi-flat')}</>
}

export function ProgramKpiTargetSection({
  programId,
  isEditMode = false,
  form,
}: ProgramKpiTargetSectionProps) {
  const [kpis, setKpis] = useState<KpiMetric[] | null>(null)
  const isFormEdit = isEditMode && form

  useEffect(() => {
    let cancelled = false
    getKpiAchievementList({ programIds: [programId] })
      .then(list => {
        if (cancelled) return
        const item = list.find(p => p.programId === programId)
        setKpis(item?.kpis ?? null)
      })
      .catch(() => setKpis(null))
    return () => {
      cancelled = true
    }
  }, [programId])

  // 수정 모드 진입 시 API에서 받은 KPI 값으로 폼 시드 (한 번만)
  useEffect(() => {
    if (!isFormEdit || !kpis?.length || !form) return
    const participantsRow = kpis.find(k => k.key === 'finalParticipants')
    const schoolsRow = kpis.find(k => k.key === 'finalSchools')
    const classesRow = kpis.find(k => k.key === 'finalClasses')
    const current = form.getValues()
    if (participantsRow?.target != null && current.kpiFinalParticipants == null) {
      form.setValue('kpiFinalParticipants', Number(participantsRow.target))
    }
    if (schoolsRow?.target != null && current.kpiFinalSchools == null) {
      form.setValue('kpiFinalSchools', Number(schoolsRow.target))
    }
    if (classesRow?.target != null && current.kpiFinalClasses == null) {
      form.setValue('kpiFinalClasses', Number(classesRow.target))
    }
  }, [isFormEdit, kpis, form])

  const participantsRow = kpis?.find(k => k.key === 'finalParticipants')
  const schoolsRow = kpis?.find(k => k.key === 'finalSchools')
  const classesRow = kpis?.find(k => k.key === 'finalClasses')
  const instructorDisplay: string | undefined = isFormEdit ? undefined : '강사: 80 봉사자 : 80'

  if (!isFormEdit && (!kpis || kpis.length === 0)) {
    return (
      <section className="program-kpi-target-section">
        <h3 className="program-detail-info-tab__section-title">사업 KPI 목표</h3>
        <div className="program-kpi-target-section__table-wrap">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-kpi-target-section__table">
            <tbody>
              <tr>
                <td colSpan={4} className="program-kpi-target-section__empty">
                  KPI 목표 데이터가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  return (
    <section className="program-kpi-target-section">
      <div className="program-detail-info-tab__section-title">사업 KPI 목표</div>
      <div className="program-kpi-target-section__table-wrap">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-kpi-target-section__table">
          <colgroup>
            <col className="program-kpi-target-section__col-label" />
            <col />
            <col className="program-kpi-target-section__col-label" />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th className={isFormEdit ? 'program-detail-info-tab__th--required' : undefined}>
                참여자 최종 인원
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit && form ? (
                  <>
                    <Controller
                      name="kpiFinalParticipants"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => {
                            const n = parseInt(e.target.value, 10)
                            field.onChange(isNaN(n) ? undefined : n)
                          }}
                          className="program-kpi-target-section__input"
                          status={form.formState.errors.kpiFinalParticipants ? 'error' : undefined}
                        />
                      )}
                    />
                    {form.formState.errors.kpiFinalParticipants?.message && (
                      <span className="program-detail-info-tab__field-error">
                        {form.formState.errors.kpiFinalParticipants.message}
                      </span>
                    )}
                  </>
                ) : (
                  formatKpiValueWithBoldNumbers(participantsRow?.target)
                )}
              </td>
              <th className={isFormEdit ? 'program-detail-info-tab__th--required' : undefined}>
                {EDUCATION_INSTRUCTOR_LABEL}
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit && form ? (
                  <div className="program-kpi-target-section__instructor-row">
                    <div className="program-kpi-target-section__instructor-field">
                      <span className="program-kpi-target-section__instructor-label">강사</span>
                      <Controller
                        name="kpiInstructorCount"
                        control={form.control}
                        render={({ field }) => (
                          <AppInput
                            type="number"
                            min={0}
                            {...field}
                            value={field.value ?? ''}
                            onChange={e => {
                              const n = parseInt(e.target.value, 10)
                              field.onChange(isNaN(n) ? undefined : n)
                            }}
                            className="program-kpi-target-section__input program-kpi-target-section__input--sm"
                            status={form.formState.errors.kpiInstructorCount ? 'error' : undefined}
                          />
                        )}
                      />
                    </div>
                    <span className="program-detail-info-tab__separator"> | </span>
                    <div className="program-kpi-target-section__instructor-field">
                      <span className="program-kpi-target-section__instructor-label">봉사자</span>
                      <Controller
                        name="kpiVolunteerCount"
                        control={form.control}
                        render={({ field }) => (
                          <AppInput
                            type="number"
                            min={0}
                            {...field}
                            value={field.value ?? ''}
                            onChange={e => {
                              const n = parseInt(e.target.value, 10)
                              field.onChange(isNaN(n) ? undefined : n)
                            }}
                            className="program-kpi-target-section__input program-kpi-target-section__input--sm"
                            status={form.formState.errors.kpiVolunteerCount ? 'error' : undefined}
                          />
                        )}
                      />
                    </div>
                    {(form.formState.errors.kpiInstructorCount?.message ||
                      form.formState.errors.kpiVolunteerCount?.message) && (
                      <span className="program-detail-info-tab__field-error program-kpi-target-section__instructor-row-error">
                        {form.formState.errors.kpiInstructorCount?.message ||
                          form.formState.errors.kpiVolunteerCount?.message}
                      </span>
                    )}
                  </div>
                ) : (
                  formatKpiValueWithBoldNumbers(instructorDisplay ?? undefined)
                )}
              </td>
            </tr>
            <tr>
              <th className={isFormEdit ? 'program-detail-info-tab__th--required' : undefined}>
                최종 파견 학교 수
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit && form ? (
                  <>
                    <Controller
                      name="kpiFinalSchools"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => {
                            const n = parseInt(e.target.value, 10)
                            field.onChange(isNaN(n) ? undefined : n)
                          }}
                          className="program-kpi-target-section__input"
                          status={form.formState.errors.kpiFinalSchools ? 'error' : undefined}
                        />
                      )}
                    />
                    {form.formState.errors.kpiFinalSchools?.message && (
                      <span className="program-detail-info-tab__field-error">
                        {form.formState.errors.kpiFinalSchools.message}
                      </span>
                    )}
                  </>
                ) : (
                  formatKpiValueWithBoldNumbers(schoolsRow?.target)
                )}
              </td>
              <th className={isFormEdit ? 'program-detail-info-tab__th--required' : undefined}>
                최종 파견 학급 수
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit && form ? (
                  <>
                    <Controller
                      name="kpiFinalClasses"
                      control={form.control}
                      render={({ field }) => (
                        <AppInput
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => {
                            const n = parseInt(e.target.value, 10)
                            field.onChange(isNaN(n) ? undefined : n)
                          }}
                          className="program-kpi-target-section__input"
                          status={form.formState.errors.kpiFinalClasses ? 'error' : undefined}
                        />
                      )}
                    />
                    {form.formState.errors.kpiFinalClasses?.message && (
                      <span className="program-detail-info-tab__field-error">
                        {form.formState.errors.kpiFinalClasses.message}
                      </span>
                    )}
                  </>
                ) : (
                  formatKpiValueWithBoldNumbers(classesRow?.target)
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
