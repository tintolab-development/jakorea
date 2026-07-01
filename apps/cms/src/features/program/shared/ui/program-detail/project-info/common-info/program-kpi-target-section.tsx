/**
 * 사업 KPI 목표 테이블 섹션
 * 프로그램 상세 공통 정보 탭 하단에 표시 (참여자 최종 인원, 최종 파견 학교 수, 교육진행자 최종 인원, 최종 파견 학급 수)
 * td 영역에서는 숫자 텍스트만 볼드 처리.
 * 수정 모드 시 form 연동으로 Input 표시.
 */

import { Fragment, type ReactNode, useEffect, useState } from 'react'
import { Controller } from 'react-hook-form'
import { getKpiAchievementList } from '@/features/dashboard/api/admin-dashboard-service'
import type { ProgramKpiItem } from '@/features/dashboard/api/admin-dashboard-service'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { DetailInfoForm } from '@/shared/components/detail-info-form/detail-info-form'
import { CmsInput } from '@/shared/ui'
import { fieldValidationHelp } from '@/shared/utils/error-handler'
import './program-kpi-target-section.css'

export interface ProgramKpiTargetSectionProps {
  programId: string
  showVolunteerKpi?: boolean
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

const KPI_SEGMENT_REGEX = /([^:]+?):\s*(\d+(?:\.\d+)?)/g

function boldNumbersInSegment(segment: string, keyPrefix: string): ReactNode[] {
  const parts = segment.split(/(\d+)/)
  return parts.map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={`${keyPrefix}-${i}`} style={{ fontWeight: 'bold' }}>
        {part}
      </span>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    )
  )
}

/** td 내용 중 숫자만 볼드 처리. 여러 "라벨: 숫자" 구간은 세로 디바이더로 연결 */
function formatKpiValueWithBoldNumbers(value: string | number | undefined): ReactNode {
  if (value === undefined || value === null || value === '') return '-'
  const str = String(value).trim()
  if (str === '-') return '-'
  if (/^\d+(\.\d+)?$/.test(str)) {
    return <span style={{ fontWeight: 'bold' }}>{str}</span>
  }

  const matches = [...str.matchAll(KPI_SEGMENT_REGEX)]

  if (matches.length >= 2) {
    return (
      <span className="program-kpi-target-section__inline-segments">
        {matches.map((match, index) => (
          <Fragment key={`kpi-seg-wrap-${index}`}>
            {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
            {boldNumbersInSegment(match[0], `kpi-seg-${index}`)}
          </Fragment>
        ))}
      </span>
    )
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

function formatEducationInstructorTargets(
  targets: ProgramKpiItem['educationInstructorTargets'] | undefined,
  showVolunteerKpi: boolean,
  isFormEdit: boolean | undefined
): ReactNode {
  if (showVolunteerKpi) {
    if (isFormEdit) return undefined
    return formatKpiValueWithBoldNumbers(
      `강사: ${targets?.instructors ?? 0} 봉사자: ${targets?.volunteers ?? 0}`
    )
  }

  return (
    <span className="program-kpi-target-section__inline-segments">
      <span>
        강사: <span style={{ fontWeight: 'bold' }}>{targets?.instructors ?? 0}</span>
      </span>
      <DetailInfoForm.InputsSeparator />
      <span>봉사자: 해당 없음</span>
    </span>
  )
}

export function ProgramKpiTargetSection({
  programId,
  showVolunteerKpi = true,
  isEditMode = false,
  form,
}: ProgramKpiTargetSectionProps) {
  const [kpiItem, setKpiItem] = useState<ProgramKpiItem | null>(null)
  const isFormEdit = isEditMode && form
  const kpis = kpiItem?.kpis ?? null

  useEffect(() => {
    let cancelled = false
    getKpiAchievementList({ programIds: [programId] })
      .then(list => {
        if (cancelled) return
        const item = list.find(p => p.programId === programId)
        setKpiItem(item ?? null)
      })
      .catch(() => setKpiItem(null))
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
    const instructorTarget = kpiItem?.educationInstructorTargets?.instructors
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
    if (instructorTarget != null && current.kpiInstructorCount == null) {
      form.setValue('kpiInstructorCount', Number(instructorTarget))
    }
    if (!showVolunteerKpi && current.kpiVolunteerCount == null) {
      form.setValue('kpiVolunteerCount', 0)
    }
  }, [isFormEdit, kpis, kpiItem, showVolunteerKpi, form])

  const participantsRow = kpis?.find(k => k.key === 'finalParticipants')
  const schoolsRow = kpis?.find(k => k.key === 'finalSchools')
  const classesRow = kpis?.find(k => k.key === 'finalClasses')
  const educationInstructorTargets = kpiItem?.educationInstructorTargets
  const instructorDisplay = formatEducationInstructorTargets(
    educationInstructorTargets,
    showVolunteerKpi,
    Boolean(isFormEdit)
  )

  return (
    <DetailInfoForm
      title="사업 KPI 목표"
      mode={isFormEdit ? 'edit' : 'view'}
      className="detail-info-form--gap"
    >
      {!isFormEdit && (!kpis || kpis.length === 0) ? (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="안내" view="KPI 목표 데이터가 없습니다." />
        </DetailInfoForm.Row>
      ) : (
        <>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="참여자 최종 인원"
              required
              view={formatKpiValueWithBoldNumbers(participantsRow?.target)}
              edit={
                form ? (
                  <>
                    <Controller
                      name="kpiFinalParticipants"
                      control={form.control}
                      render={({ field }) => (
                        <CmsInput
                          width={'50%'}
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => {
                            const n = parseInt(e.target.value, 10)
                            field.onChange(isNaN(n) ? undefined : n)
                          }}
                          status={form.formState.errors.kpiFinalParticipants ? 'error' : undefined}
                        />
                      )}
                    />
                  </>
                ) : undefined
              }
            />
            <DetailInfoForm.Field
              label="교육진행자 최종 인원"
              required
              view={instructorDisplay}
              edit={
                form ? (
                  <div className="program-kpi-target-section__instructor-edit">
                    <div className="program-kpi-target-section__instructor-edit-group">
                      <span>강사</span>
                      <Controller
                        name="kpiInstructorCount"
                        control={form.control}
                        render={({ field }) => (
                          <CmsInput
                            width={120}
                            type="number"
                            min={0}
                            {...field}
                            value={field.value ?? ''}
                            onChange={e => {
                              const n = parseInt(e.target.value, 10)
                              field.onChange(isNaN(n) ? undefined : n)
                            }}
                            status={form.formState.errors.kpiInstructorCount ? 'error' : undefined}
                          />
                        )}
                      />
                    </div>
                    <DetailInfoForm.InputsSeparator />
                    <div className="program-kpi-target-section__instructor-edit-group">
                      <span>봉사자</span>
                      {showVolunteerKpi ? (
                        <Controller
                          name="kpiVolunteerCount"
                          control={form.control}
                          render={({ field }) => (
                            <CmsInput
                              width={120}
                              type="number"
                              min={0}
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => {
                                const n = parseInt(e.target.value, 10)
                                field.onChange(isNaN(n) ? undefined : n)
                              }}
                              status={form.formState.errors.kpiVolunteerCount ? 'error' : undefined}
                            />
                          )}
                        />
                      ) : (
                        <CmsInput width={120} value="해당 없음" disabled />
                      )}
                    </div>
                  </div>
                ) : undefined
              }
            />
          </DetailInfoForm.Row>

          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="최종 파견 학교 수"
              required
              view={formatKpiValueWithBoldNumbers(schoolsRow?.target)}
              edit={
                form ? (
                  <>
                    <Controller
                      name="kpiFinalSchools"
                      control={form.control}
                      render={({ field }) => (
                        <CmsInput
                          width={'50%'}
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => {
                            const n = parseInt(e.target.value, 10)
                            field.onChange(isNaN(n) ? undefined : n)
                          }}
                          status={form.formState.errors.kpiFinalSchools ? 'error' : undefined}
                        />
                      )}
                    />
                  </>
                ) : undefined
              }
            />
            <DetailInfoForm.Field
              label="최종 파견 학급 수"
              required
              view={formatKpiValueWithBoldNumbers(classesRow?.target)}
              edit={
                form ? (
                  <>
                    <Controller
                      name="kpiFinalClasses"
                      control={form.control}
                      render={({ field }) => (
                        <CmsInput
                          width={'50%'}
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => {
                            const n = parseInt(e.target.value, 10)
                            field.onChange(isNaN(n) ? undefined : n)
                          }}
                          status={form.formState.errors.kpiFinalClasses ? 'error' : undefined}
                        />
                      )}
                    />
                    {fieldValidationHelp(form.formState.errors.kpiFinalClasses) && (
                      <span>{fieldValidationHelp(form.formState.errors.kpiFinalClasses)}</span>
                    )}
                  </>
                ) : undefined
              }
            />
          </DetailInfoForm.Row>
        </>
      )}
    </DetailInfoForm>
  )
}
