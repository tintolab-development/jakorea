import { useCallback, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import './ujat-program-application-grade-class-time-paragraph.css'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import {
  UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS,
  type UjatApplicationClassTimePeriods,
  updateUjatApplicationInstitutionOverlayKey,
  useUjatApplicationInstitutionOverlayKv,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'

/** 신청 학년 미선택 시 — 해당 학년 행에만 표시(공백 두 칸: 을  먼) */
const EMPTY_GRADE_IN_ROW_HINT = '학년 별 신청 정보를  먼저 입력해 주세요'

function getDisabledGradesForBlock(
  blockKey: string,
  checkedByBlockKey: Readonly<Record<string, Record<string, boolean>>>
): Set<string> {
  const taken = new Set<string>()
  for (const [bid, m] of Object.entries(checkedByBlockKey)) {
    if (bid === blockKey) continue
    for (const [g, c] of Object.entries(m ?? {})) {
      if (c) taken.add(g)
    }
  }
  return taken
}

function PeriodTimeFields({
  blockKey,
  periodId,
  periodLabel,
  periodsByBlock,
  onPeriodChange,
}: {
  blockKey: string
  periodId: string
  periodLabel: string
  periodsByBlock: Record<string, UjatApplicationClassTimePeriods>
  onPeriodChange: (
    blockKey: string,
    periodId: string,
    patch: { start?: string | null; end?: string | null }
  ) => void
}) {
  const stored = periodsByBlock[blockKey]?.[periodId]
  const start = stored?.start ? dayjs(stored.start) : null
  const end = stored?.end ? dayjs(stored.end) : null

  return (
    <DetailInfoForm.Field
      label={periodLabel}
      edit={
        <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap ujat-program-application-grade-class-time-paragraph__period-inputs">
          <ParagraphTimePicker
            value={start?.isValid() ? start : null}
            onChange={value =>
              onPeriodChange(blockKey, periodId, {
                start: value ? value.toISOString() : null,
              })
            }
            placeholder="수업 시작"
            width={168}
          />
          <span className="ujat-program-application-grade-class-time-paragraph__tilde">~</span>
          <ParagraphTimePicker
            value={end?.isValid() ? end : null}
            onChange={value =>
              onPeriodChange(blockKey, periodId, {
                end: value ? value.toISOString() : null,
              })
            }
            placeholder="수업 종료"
            width={168}
          />
        </div>
      }
      view="-"
    />
  )
}

function GradeCheckRow({
  gradeValues,
  checkedByGrade,
  disabledGrades,
  onToggleGrade,
  onToggleAll,
}: {
  gradeValues: readonly string[]
  checkedByGrade: Readonly<Record<string, boolean>>
  disabledGrades: ReadonlySet<string>
  onToggleGrade: (grade: string, checked: boolean) => void
  onToggleAll: (checked: boolean) => void
}) {
  const eligibleGrades = useMemo(
    () => gradeValues.filter(g => !disabledGrades.has(g)),
    [gradeValues, disabledGrades]
  )

  const allChecked = useMemo(
    () => eligibleGrades.length > 0 && eligibleGrades.every(g => checkedByGrade[g] === true),
    [eligibleGrades, checkedByGrade]
  )

  const someChecked = useMemo(
    () => eligibleGrades.some(g => checkedByGrade[g] === true),
    [eligibleGrades, checkedByGrade]
  )

  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label="해당 학년"
        fullRow
        edit={
          <div className="ujat-program-application-grade-class-time-paragraph__grade-checkboxes">
            <CmsCheckbox
              checkboxSize="medium"
              disabled={eligibleGrades.length === 0}
              indeterminate={someChecked && !allChecked}
              checked={allChecked}
              onChange={e => onToggleAll(e.target.checked)}
            >
              전체
            </CmsCheckbox>
            {gradeValues.map(g => (
              <CmsCheckbox
                key={g}
                checkboxSize="medium"
                disabled={disabledGrades.has(g)}
                checked={checkedByGrade[g] ?? false}
                onChange={e => {
                  if (!disabledGrades.has(g)) onToggleGrade(g, e.target.checked)
                }}
              >
                {g}학년
              </CmsCheckbox>
            ))}
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

function ClassTimeBlockBody({
  blockKey,
  applicationGradeValues,
  checkedByGrade,
  disabledGrades,
  onToggleGrade,
  onToggleAll,
  periodsByBlock,
  onPeriodChange,
}: {
  blockKey: string
  applicationGradeValues: readonly string[]
  checkedByGrade: Readonly<Record<string, boolean>>
  disabledGrades: ReadonlySet<string>
  onToggleGrade: (grade: string, checked: boolean) => void
  onToggleAll: (checked: boolean) => void
  periodsByBlock: Record<string, UjatApplicationClassTimePeriods>
  onPeriodChange: (
    blockKey: string,
    periodId: string,
    patch: { start?: string | null; end?: string | null }
  ) => void
}) {
  return (
    <DetailInfoForm title="학년 별 수업 시간" hideHeader mode="edit">
      {applicationGradeValues.length === 0 ? (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="해당 학년"
            fullRow
            edit={
              <span className="form-editor-template-field-hint-text">{EMPTY_GRADE_IN_ROW_HINT}</span>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      ) : (
        <GradeCheckRow
          gradeValues={applicationGradeValues}
          checkedByGrade={checkedByGrade}
          disabledGrades={disabledGrades}
          onToggleGrade={onToggleGrade}
          onToggleAll={onToggleAll}
        />
      )}
      <DetailInfoForm.Row type="double">
        <PeriodTimeFields
          blockKey={blockKey}
          periodId="period1"
          periodLabel="1교시"
          periodsByBlock={periodsByBlock}
          onPeriodChange={onPeriodChange}
        />
        <PeriodTimeFields
          blockKey={blockKey}
          periodId="period2"
          periodLabel="2교시"
          periodsByBlock={periodsByBlock}
          onPeriodChange={onPeriodChange}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <PeriodTimeFields
          blockKey={blockKey}
          periodId="period3"
          periodLabel="3교시"
          periodsByBlock={periodsByBlock}
          onPeriodChange={onPeriodChange}
        />
        <PeriodTimeFields
          blockKey={blockKey}
          periodId="period4"
          periodLabel="4교시"
          periodsByBlock={periodsByBlock}
          onPeriodChange={onPeriodChange}
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

type UjatProgramApplicationGradeClassTimeParagraphProps = {
  classTimeBlockIds: readonly string[]
  onRemoveClassTimeBlockAtIndex: (index: number) => void
  applicationGradeValuesForClassTime: readonly string[]
}

/** UJAT 프로그램 학교 신청 폼 — 학년 별 수업 시간 (`titleTrailing`: 수업 진행 시간 추가) */
export function UjatProgramApplicationGradeClassTimeParagraph({
  classTimeBlockIds,
  onRemoveClassTimeBlockAtIndex,
  applicationGradeValuesForClassTime,
}: UjatProgramApplicationGradeClassTimeParagraphProps) {
  const ids = useMemo(
    () => (classTimeBlockIds.length > 0 ? [...classTimeBlockIds] : ['ujat-class-time-solo']),
    [classTimeBlockIds]
  )

  const [checkedByBlockKey] = useUjatApplicationInstitutionOverlayKv<
    Record<string, Record<string, boolean>>
  >(UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.classTimeCheckedByBlock, {})

  const [periodsByBlock] = useUjatApplicationInstitutionOverlayKv<
    Record<string, UjatApplicationClassTimePeriods>
  >(UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.classTimePeriodsByBlock, {})

  const gradeListKey = applicationGradeValuesForClassTime.join(',')
  const idsKey = ids.join('|')

  const onPeriodChange = useCallback(
    (
      blockKey: string,
      periodId: string,
      patch: { start?: string | null; end?: string | null }
    ) => {
      updateUjatApplicationInstitutionOverlayKey<
        Record<string, UjatApplicationClassTimePeriods>
      >(UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.classTimePeriodsByBlock, prev => {
        const current = prev ?? {}
        const blockPeriods = current[blockKey] ?? {}
        const period = blockPeriods[periodId] ?? { start: null, end: null }
        return {
          ...current,
          [blockKey]: {
            ...blockPeriods,
            [periodId]: { ...period, ...patch },
          },
        }
      })
    },
    []
  )

  /** 블록 ID·신청 학년 목록이 바뀌면 맵을 재구성(존재 키만 유지, 새 학년은 false) */
  useEffect(() => {
    updateUjatApplicationInstitutionOverlayKey<Record<string, Record<string, boolean>>>(
      UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.classTimeCheckedByBlock,
      prev => {
        const next: Record<string, Record<string, boolean>> = {}
        for (const id of ids) {
          const old = prev?.[id] ?? {}
          const inner: Record<string, boolean> = {}
          for (const g of applicationGradeValuesForClassTime) {
            inner[g] = old[g] === true
          }
          next[id] = inner
        }
        return next
      }
    )
  }, [idsKey, gradeListKey, ids, applicationGradeValuesForClassTime])

  const setGradeChecked = useCallback((blockKey: string, grade: string, checked: boolean) => {
    updateUjatApplicationInstitutionOverlayKey<Record<string, Record<string, boolean>>>(
      UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.classTimeCheckedByBlock,
      prev => {
        const current = prev ?? {}
        const next: Record<string, Record<string, boolean>> = { ...current }
        if (checked) {
          for (const bid of Object.keys(next)) {
            if (bid === blockKey) continue
            const m = next[bid]
            if (m?.[grade]) {
              next[bid] = { ...m, [grade]: false }
            }
          }
        }
        next[blockKey] = { ...(next[blockKey] ?? {}), [grade]: checked }
        return next
      }
    )
  }, [])

  const setAllGradesChecked = useCallback(
    (blockKey: string, checked: boolean, gradeValues: readonly string[]) => {
      updateUjatApplicationInstitutionOverlayKey<Record<string, Record<string, boolean>>>(
        UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.classTimeCheckedByBlock,
        prev => {
          const current = prev ?? {}
          const disabled = getDisabledGradesForBlock(blockKey, current)
          const next: Record<string, Record<string, boolean>> = { ...current }

          if (checked) {
            const eligible = gradeValues.filter(g => !disabled.has(g))
            for (const g of eligible) {
              for (const bid of Object.keys(next)) {
                if (bid === blockKey) continue
                const m = next[bid]
                if (m?.[g]) {
                  next[bid] = { ...m, [g]: false }
                }
              }
            }
            const inner: Record<string, boolean> = { ...(next[blockKey] ?? {}) }
            for (const g of gradeValues) {
              inner[g] = eligible.includes(g)
            }
            next[blockKey] = inner
          } else {
            const inner: Record<string, boolean> = { ...(next[blockKey] ?? {}) }
            for (const g of gradeValues) {
              inner[g] = false
            }
            next[blockKey] = inner
          }
          return next
        }
      )
    },
    []
  )

  return (
    <div className="program-registration-paragraph">
      {ids.map((blockKey, blockIndex) => {
        const disabledGrades = getDisabledGradesForBlock(blockKey, checkedByBlockKey)
        const checkedForBlock = checkedByBlockKey[blockKey] ?? {}

        return (
          <div key={blockKey} className="ujat-program-application-grade-class-time-paragraph__block">
            <div className="ujat-program-application-grade-class-time-paragraph__block-body">
              <div className="detail-info-form--text-bold ujat-program-application-grade-class-time-paragraph__block-heading">
                ■ 수업 진행 시간 {String(blockIndex + 1).padStart(2, '0')}
              </div>
              <ClassTimeBlockBody
                blockKey={blockKey}
                applicationGradeValues={applicationGradeValuesForClassTime}
                checkedByGrade={checkedForBlock}
                disabledGrades={disabledGrades}
                onToggleGrade={(grade, checked) => setGradeChecked(blockKey, grade, checked)}
                onToggleAll={checked => setAllGradesChecked(blockKey, checked, applicationGradeValuesForClassTime)}
                periodsByBlock={periodsByBlock}
                onPeriodChange={onPeriodChange}
              />
            </div>
            {blockIndex > 0 ? (
              <div className="ujat-program-application-grade-class-time-paragraph__delete-cell">
                <ItemDeleteButton
                  className="item-delete-button"
                  aria-label={`수업 진행 시간 ${String(blockIndex + 1).padStart(2, '0')} 삭제`}
                  onClick={event => {
                    event.stopPropagation()
                    onRemoveClassTimeBlockAtIndex(blockIndex)
                  }}
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
