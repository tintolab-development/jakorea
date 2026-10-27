/**
 * 교육 커리큘럼 섹션 (프로그램 상세 정보 탭)
 * 시안: 행별 라벨 "N회차 강의 분량 및 내용" | 값 [온라인/오프라인/온·오프라인] | 시간 | 비고, 디바이더로 구분
 * 수정 모드: react-hook-form 연동, 기존 회차·커리큘럼 값이 default로 채워짐
 */

import { CmsRadio } from '@/shared/ui/cms-radio'
import type { Program, RoundDeliveryType } from '@/types/domain'
import { Controller, type UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { DetailInfoForm } from '@/shared/components/detail-info-form/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { EducationSchedulePreviewLines } from '@/features/template/ui/shared/education-schedule-preview-lines'
import { formatDateRange } from '@/features/program/shared/lib/program-detail-info-constants'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { formatAppDatepickerDisplay } from '@/shared/ui/cms-datepicker'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { PROGRAM_REGISTRATION_GENERAL_SECTION_META } from '@/features/template/ui/form-set/registration-form/general/program-registration-general-section-meta'
import { EducationScheduleChangeTitleAction } from '@/features/program/shared/ui/education-schedule-change-title-action'

const ROUND_DELIVERY_OPTIONS: { value: RoundDeliveryType; label: string }[] = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '온/오프라인' },
]

const ROUND_DELIVERY_LABELS: Record<RoundDeliveryType, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '온/오프라인',
}

const DEFAULT_CURRICULUM_BY_ROUND: string[] = [
  "'개인', '근로자', '소비자' 개념 정의 및 설명",
  '기업과 경제적 개념 이해',
  '의사결정 능력 향상 및 노동 준비에 대한 이해 학습',
  '전체 복습 및 향후 목표 설계',
]

function formatCurriculumCell(text: string): string {
  const t = text.trim()
  if (!t) return '1시간 | (상세 내용 없음)'
  return t.startsWith('1시간') || t.startsWith('1 시간') ? t : `1시간 | ${t}`
}

function parseCurriculumContent(content: string | undefined): {
  duration: string
  description: string
} {
  if (!content?.trim()) return { duration: '1시간', description: '' }
  const sep = content.includes(' | ') ? ' | ' : '|'
  const idx = content.indexOf(sep)
  if (idx === -1) return { duration: '1시간', description: content.trim() }
  return {
    duration: content.slice(0, idx).trim() || '1시간',
    description: content.slice(idx + sep.length).trim(),
  }
}

function resolveCompanySchoolCurriculumRows(program: Program) {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const sessions = commonInfo.curriculumSessions ?? []
  const rows = sessions.slice(0, 2).map((session, index) => ({
    unitName: session.title?.trim() || `${index + 1}차시`,
    content: session.description?.trim() || '-',
  }))

  while (rows.length < 2) {
    const round = program.rounds?.[rows.length]
    const parsed = parseCurriculumContent(round?.curriculum)
    rows.push({
      unitName:
        parsed.duration && parsed.duration !== '1시간' ? parsed.duration : `${rows.length + 1}차시`,
      content: parsed.description || round?.curriculum?.trim() || '-',
    })
  }

  return rows
}

function resolveCompanySchoolEducationScheduleLines(program: Program): string[] {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  if (commonInfo.educationScheduleLines?.length) return commonInfo.educationScheduleLines
  return [formatDateRange(program.startDate, program.endDate)]
}

function getCompanySchoolCurriculumFieldNames(index: number) {
  return index === 0
    ? ({
        title: 'curriculumSession1Title',
        description: 'curriculumSession1Description',
      } as const)
    : ({
        title: 'curriculumSession2Title',
        description: 'curriculumSession2Description',
      } as const)
}

function parseCompanySchoolScheduleLineToRange(
  line: string | undefined
): [Dayjs | null, Dayjs | null] {
  if (!line?.trim()) return [null, null]
  const [startText, endText] = line.split('~').map(part => part.trim())
  const parse = (value: string | undefined) => {
    if (!value) return null
    const match = value.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/)
    if (!match) return null
    const [, year, month, day] = match
    const parsed = dayjs(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
    return parsed.isValid() ? parsed : null
  }
  return [parse(startText), parse(endText)]
}

function formatCompanySchoolScheduleRange(range: [Dayjs | null, Dayjs | null]): string | null {
  const [start, end] = range
  if (!start?.isValid() || !end?.isValid()) return null
  return `${formatAppDatepickerDisplay(start)} ~ ${formatAppDatepickerDisplay(end)}`
}

function getRoundCurriculumContent(
  roundNumber: number,
  roundCurriculum: string | undefined,
  programCurriculum: string | undefined
): string {
  if (roundCurriculum?.trim()) return formatCurriculumCell(roundCurriculum)
  if (programCurriculum?.trim()) return formatCurriculumCell(programCurriculum)
  const defaultDesc = DEFAULT_CURRICULUM_BY_ROUND[roundNumber - 1]
  return defaultDesc ? `1시간 | ${defaultDesc}` : '1시간 | (상세 내용 없음)'
}

/** 조회 모드: 시간 + (온라인|오프라인|온/오프라인) + 설명; 구분은 DetailInfoForm 세로 디바이더 */
function CurriculumReadonlyDisplay({
  content,
  deliveryType,
}: {
  content: string
  deliveryType: RoundDeliveryType | undefined
}) {
  const { duration, description } = parseCurriculumContent(content)
  const deliveryLabel = ROUND_DELIVERY_LABELS[deliveryType ?? 'offline']
  return (
    <>
      {duration} ({deliveryLabel})
      {description ? (
        <>
          <DetailInfoForm.InputsSeparator />
          {description}
        </>
      ) : null}
    </>
  )
}

export interface CurriculumSectionProps {
  program: Program
  isEditMode?: boolean
  /** 수정 모드일 때만 전달 */
  form?: UseFormReturn<ProgramDetailEditFormValues>
  forceCompanySchoolLayout?: boolean
}

export function CurriculumSection({
  program,
  isEditMode = false,
  form,
  forceCompanySchoolLayout = false,
}: CurriculumSectionProps) {
  const isFormEdit = isEditMode && form
  const isCompanySchool = forceCompanySchoolLayout || isCompanySchoolProgram(program)
  const roundsFromForm = isFormEdit ? (form.watch('rounds') ?? []) : []
  const sortedRounds = (isFormEdit ? roundsFromForm : program.rounds)?.length
    ? [...(isFormEdit ? roundsFromForm : program.rounds!)].sort(
        (a, b) => a.roundNumber - b.roundNumber
      )
    : []

  const updateRoundCurriculum = (roundIndex: number, duration: string, description: string) => {
    if (!form) return
    const current = form.getValues('rounds') ?? []
    const value = [duration || '1시간', description].filter(Boolean).join(' | ')
    const nextRounds = current.map((r, i) => (i === roundIndex ? { ...r, curriculum: value } : r))
    form.setValue('rounds', nextRounds)
  }

  const updateRoundDeliveryType = (roundIndex: number, deliveryType: RoundDeliveryType) => {
    if (!form) return
    const current = form.getValues('rounds') ?? []
    const nextRounds = current.map((r, i) => (i === roundIndex ? { ...r, deliveryType } : r))
    form.setValue('rounds', nextRounds)
  }

  if (isCompanySchool) {
    const rows = resolveCompanySchoolCurriculumRows(program)
    const formMode = isFormEdit ? 'edit' : 'view'

    return (
      <DetailInfoForm
        title="교육 진행 (커리큘럼)"
        mode={formMode}
        className="detail-info-form--gap program-registration-paragraph"
      >
        {rows.map((row, index) => {
          const fieldNames = getCompanySchoolCurriculumFieldNames(index)
          return (
            <DetailInfoForm.Row key={`company-school-curriculum-${index}`} type="double">
              <DetailInfoForm.Field
                label={`${index + 1}차시 단원명`}
                view={row.unitName}
                edit={
                  isFormEdit && form ? (
                    <Controller
                      name={fieldNames.title}
                      control={form.control}
                      render={({ field }) => (
                        <CmsInput
                          inputSize="small"
                          placeholder="단원명을 입력하세요"
                          width="100%"
                          value={field.value ?? row.unitName}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  ) : undefined
                }
              />
              <DetailInfoForm.Field
                label={`${index + 1}차시 교육 내용`}
                view={row.content}
                edit={
                  isFormEdit && form ? (
                    <Controller
                      name={fieldNames.description}
                      control={form.control}
                      render={({ field }) => (
                        <CmsInput
                          inputSize="small"
                          placeholder="교육 내용을 작성하세요"
                          width="100%"
                          value={field.value ?? row.content}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  ) : undefined
                }
              />
            </DetailInfoForm.Row>
          )
        })}
      </DetailInfoForm>
    )
  }

  return (
    <DetailInfoForm
      title="교육 커리큘럼"
      mode={isFormEdit ? 'edit' : 'view'}
      className="detail-info-form--gap"
    >
      {sortedRounds.length > 0 ? (
        sortedRounds.map((round, sortedIndex) => {
          const content = getRoundCurriculumContent(
            round.roundNumber,
            round.curriculum,
            program.curriculum
          )
          const { duration, description } = parseCurriculumContent(round.curriculum)
          const roundIndex =
            (isFormEdit ? roundsFromForm : program.rounds)?.findIndex(
              (r: { id: string }) => r.id === round.id
            ) ?? sortedIndex

          return (
            <DetailInfoForm.Row key={round.id} type="single">
              <DetailInfoForm.Field
                label={`${round.roundNumber}회차 강의 분량 및 내용`}
                required={round.roundNumber <= 4}
                fullRow
                view={
                  <CurriculumReadonlyDisplay content={content} deliveryType={round.deliveryType} />
                }
                edit={
                  isFormEdit ? (
                    <div className="detail-info-form-inputs-wrapper">
                      <CmsRadio.Group
                        size="medium"
                        value={round.deliveryType ?? 'offline'}
                        options={ROUND_DELIVERY_OPTIONS}
                        onChange={e => updateRoundDeliveryType(roundIndex, e.target.value)}
                      />
                      <DetailInfoForm.InputsSeparator />
                      <CmsInput
                        inputSize="small"
                        value={duration}
                        onChange={e =>
                          updateRoundCurriculum(roundIndex, e.target.value, description)
                        }
                        placeholder="1시간"
                      />
                      <DetailInfoForm.InputsSeparator />
                      <CmsInput
                        inputSize="small"
                        value={description}
                        onChange={e => updateRoundCurriculum(roundIndex, duration, e.target.value)}
                        placeholder="비고"
                      />
                    </div>
                  ) : undefined
                }
              />
            </DetailInfoForm.Row>
          )
        })
      ) : (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="안내" fullRow view="등록된 회차가 없습니다." />
        </DetailInfoForm.Row>
      )}
    </DetailInfoForm>
  )
}

export function EducationScheduleSettingsSection({
  program,
  isEditMode = false,
  form,
  forceCompanySchoolLayout = false,
}: {
  program: Program
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
  forceCompanySchoolLayout?: boolean
}) {
  if (!forceCompanySchoolLayout && !isCompanySchoolProgram(program)) return null

  const isFormEdit = isEditMode && form
  const formLines = isFormEdit ? form.watch('educationScheduleLines') : undefined
  const lines = isFormEdit
    ? (formLines ?? resolveCompanySchoolEducationScheduleLines(program))
    : resolveCompanySchoolEducationScheduleLines(program)
  const scheduleRange = parseCompanySchoolScheduleLineToRange(lines[0])

  const handleScheduleRangeChange = (range: [Dayjs | null, Dayjs | null]) => {
    if (!form) return
    const nextLine = formatCompanySchoolScheduleRange(range)
    if (!nextLine) return
    const current = form.getValues('educationScheduleLines') ?? lines
    const nextLines = current.length > 0 ? [nextLine, ...current.slice(1)] : [nextLine]
    form.setValue('educationScheduleLines', nextLines, { shouldDirty: true })
  }

  const scheduleMeta = PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleSettings

  const scheduleForm = (
    <DetailInfoForm
      title={scheduleMeta.title}
      hideHeader={Boolean(isFormEdit)}
      mode={isFormEdit ? 'edit' : 'view'}
      className={isFormEdit ? 'program-registration-paragraph' : 'detail-info-form--gap'}
    >
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교육 진행 일정 선택"
          fullRow
          view={<EducationSchedulePreviewLines lines={lines} />}
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap">
              <ParagraphDatePicker
                inputSize="small"
                mode="single"
                presetMode="period"
                customizable={false}
                showTimeToggle={false}
                suppressAutoTodayWhenEmpty
                value={scheduleRange[0]}
                appliedSurfaceRange={
                  scheduleRange[0] && scheduleRange[1] ? [scheduleRange[0], scheduleRange[1]] : null
                }
                appliedSurfaceWithTime={false}
                width={320}
                placeholder="진행 기간을 선택하세요"
                onRangeChange={range => handleScheduleRangeChange(range)}
                onChange={next => {
                  if (next == null) {
                    if (!form) return
                    form.setValue('educationScheduleLines', [], { shouldDirty: true })
                  }
                }}
              />
            </div>
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )

  if (!isFormEdit) return scheduleForm

  return (
    <section className="detail-common-info-view__section" aria-label={scheduleMeta.title}>
      <FormParagraphSectionHeader
        title={scheduleMeta.title}
        description={scheduleMeta.editDescription}
        titleTrailing={
          <EducationScheduleChangeTitleAction
            programId={program.id}
            scheduleLines={lines}
            educationScheduleMode="period"
            operationStart={program.startDate}
            operationEnd={program.endDate}
            onApply={nextLines => {
              if (!form) return
              form.setValue('educationScheduleLines', nextLines, { shouldDirty: true })
            }}
          />
        }
        surface="responseEntry"
        titleAligned
        required
      />
      <div className="detail-common-info-view__section-body">{scheduleForm}</div>
    </section>
  )
}
