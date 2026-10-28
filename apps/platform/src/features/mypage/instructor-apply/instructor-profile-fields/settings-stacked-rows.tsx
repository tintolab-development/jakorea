import type { ReactNode } from 'react'
import {
  EMPTY_INSTRUCTOR_CAREER,
  EMPTY_INSTRUCTOR_JA_KOREA_ROW,
  EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW,
  type InstructorSharedProfileFormValues,
} from '@jakorea/domain/instructor/profile-form-values'
import { PFCheckbox, PFDateInput, PFText, PFTextInput } from '@/shared/ui'
import { ListRowActions } from './list-row-actions'
import styles from './settings-stacked-fields.module.css'

/**
 * 회원정보 설정(수정) 전용 행 레이아웃 — 시안 11199:20878.
 * 강사 신청(`surface='apply'`)은 기존 가로 인라인 레이아웃을 그대로 사용.
 */

type CareerRow = InstructorSharedProfileFormValues['careers'][number]
type JaRow = InstructorSharedProfileFormValues['jaKoreaRows'][number]
type LicenseOrAwardRow = InstructorSharedProfileFormValues['licenseRows'][number]

const FULL = '100%'

/** 시안 — 섹션 안 필드 묶음 (필드 간 20px) */
export function SettingsFieldStack({ children }: { children: ReactNode }) {
  return <div className={styles.fieldStack}>{children}</div>
}

/** 시안 `Input` — 라벨(13px·warm600·좌 8px, 필수 *) 4px 아래 입력. 테이블 헤더 배경 없음 */
export function SettingsField({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>
        <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabelText}>
          {label}
        </PFText>
        {required ? (
          <span className={styles.fieldRequired} aria-hidden="true">
            *
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

/** 라디오·체크박스 한 줄 (시안 h54 · 좌우 8px) */
export function SettingsOptionRow({ children }: { children: ReactNode }) {
  return <div className={styles.optionRow}>{children}</div>
}

export function SettingsStackedEntryList({ children }: { children: ReactNode }) {
  return <div className={styles.entryList}>{children}</div>
}

export function SettingsStackedEntry({ children }: { children: ReactNode }) {
  return <div className={styles.entry}>{children}</div>
}

export function SettingsStackedGrid2({ children }: { children: ReactNode }) {
  return <div className={styles.grid2}>{children}</div>
}

/** [입력(가변) + 부가 요소(재직 중·추가/삭제 등)] 한 줄 */
export function SettingsStackedInlineRow({
  main,
  trailing,
}: {
  main: ReactNode
  trailing: ReactNode
}) {
  return (
    <div className={styles.inlineRow}>
      <div className={styles.grow}>{main}</div>
      {trailing}
    </div>
  )
}

export function SettingsStackedShrink({ children }: { children: ReactNode }) {
  return <div className={styles.shrink}>{children}</div>
}

/** 경력 사항 — [입사연월│퇴사연월] / 회사명(돋보기) / [담당 업무 + 재직 중 + 추가·삭제] */
export function SettingsCareerRows({
  rows,
  placeholders,
  onRowsChange,
}: {
  rows: CareerRow[]
  placeholders: {
    careerPeriodStart: string
    careerPeriodEnd: string
    companyName: string
    roleName: string
  }
  onRowsChange: (next: CareerRow[]) => void
}) {
  const update = (index: number, partial: Partial<CareerRow>) => {
    const next = [...rows]
    next[index] = { ...rows[index], ...partial }
    onRowsChange(next)
  }

  return (
    <SettingsStackedEntryList>
      {rows.map((row, index) => (
        <SettingsStackedEntry key={`career-${index}`}>
          <SettingsStackedGrid2>
            <PFDateInput
              size="xlarge"
              width={FULL}
              picker="month"
              placeholder={placeholders.careerPeriodStart}
              value={row.periodStart ?? ''}
              onValueChange={value => update(index, { periodStart: value || null })}
            />
            <PFDateInput
              size="xlarge"
              width={FULL}
              picker="month"
              placeholder={placeholders.careerPeriodEnd}
              disabled={row.currentlyEmployed}
              value={row.periodEnd ?? ''}
              onValueChange={value => update(index, { periodEnd: value || null })}
            />
          </SettingsStackedGrid2>
          <PFTextInput
            size="xlarge"
            width={FULL}
            // 시안 — 돋보기 아이콘만 (검색 기능 없음)
            hasIcon
            placeholder={placeholders.companyName}
            value={row.companyName}
            onValueChange={value => update(index, { companyName: value })}
          />
          <SettingsStackedInlineRow
            main={
              <PFTextInput
                size="xlarge"
                width={FULL}
                placeholder={placeholders.roleName}
                value={row.roleName}
                onValueChange={value => update(index, { roleName: value })}
              />
            }
            trailing={
              <>
                <SettingsStackedShrink>
                  <PFCheckbox
                    size="large"
                    checked={row.currentlyEmployed}
                    onCheckedChange={checked =>
                      update(index, {
                        currentlyEmployed: checked,
                        periodEnd: checked ? null : row.periodEnd,
                      })
                    }
                  >
                    재직 중
                  </PFCheckbox>
                </SettingsStackedShrink>
                <SettingsStackedShrink>
                  <ListRowActions
                    isFirst={index === 0}
                    onAdd={() => onRowsChange([...rows, { ...EMPTY_INSTRUCTOR_CAREER }])}
                    onRemove={() => onRowsChange(rows.filter((_, i) => i !== index))}
                  />
                </SettingsStackedShrink>
              </>
            }
          />
        </SettingsStackedEntry>
      ))}
    </SettingsStackedEntryList>
  )
}

/** JA Korea 활동 경험 — [시작│종료] / 프로그램명 / [비고 + 추가·삭제] */
export function SettingsJaRows({
  rows,
  placeholders,
  onRowsChange,
}: {
  rows: JaRow[]
  placeholders: {
    jaPeriodStart: string
    jaPeriodEnd: string
    jaProgramName: string
    jaNote: string
  }
  onRowsChange: (next: JaRow[]) => void
}) {
  const update = (index: number, partial: Partial<JaRow>) => {
    const next = [...rows]
    next[index] = { ...rows[index], ...partial }
    onRowsChange(next)
  }

  return (
    <SettingsStackedEntryList>
      {rows.map((row, index) => (
        <SettingsStackedEntry key={`ja-${index}`}>
          <SettingsStackedGrid2>
            <PFDateInput
              size="xlarge"
              width={FULL}
              placeholder={placeholders.jaPeriodStart}
              value={row.periodStart ?? ''}
              onValueChange={value => update(index, { periodStart: value || null })}
            />
            <PFDateInput
              size="xlarge"
              width={FULL}
              placeholder={placeholders.jaPeriodEnd}
              value={row.periodEnd ?? ''}
              onValueChange={value => update(index, { periodEnd: value || null })}
            />
          </SettingsStackedGrid2>
          <PFTextInput
            size="xlarge"
            width={FULL}
            placeholder={placeholders.jaProgramName}
            value={row.title}
            onValueChange={value => update(index, { title: value })}
          />
          <SettingsStackedInlineRow
            main={
              <PFTextInput
                size="xlarge"
                width={FULL}
                placeholder={placeholders.jaNote}
                value={row.note}
                onValueChange={value => update(index, { note: value })}
              />
            }
            trailing={
              <SettingsStackedShrink>
                <ListRowActions
                  isFirst={index === 0}
                  onAdd={() => onRowsChange([...rows, { ...EMPTY_INSTRUCTOR_JA_KOREA_ROW }])}
                  onRemove={() => onRowsChange(rows.filter((_, i) => i !== index))}
                />
              </SettingsStackedShrink>
            }
          />
        </SettingsStackedEntry>
      ))}
    </SettingsStackedEntryList>
  )
}

/** 자격 및 면허 / 수상 및 수료 — 연도 / 명칭 / [발행처 + 추가·삭제] */
export function SettingsLicenseOrAwardRows({
  rows,
  keyPrefix,
  placeholders,
  onRowsChange,
}: {
  rows: LicenseOrAwardRow[]
  keyPrefix: string
  placeholders: { year: string; title: string; issuer: string }
  onRowsChange: (next: LicenseOrAwardRow[]) => void
}) {
  const update = (index: number, partial: Partial<LicenseOrAwardRow>) => {
    const next = [...rows]
    next[index] = { ...rows[index], ...partial }
    onRowsChange(next)
  }

  return (
    <SettingsStackedEntryList>
      {rows.map((row, index) => (
        <SettingsStackedEntry key={`${keyPrefix}-${index}`}>
          <PFDateInput
            size="xlarge"
            width={FULL}
            picker="year"
            placeholder={placeholders.year}
            value={row.acquiredYear ?? ''}
            onValueChange={value => update(index, { acquiredYear: value || null })}
          />
          <PFTextInput
            size="xlarge"
            width={FULL}
            placeholder={placeholders.title}
            value={row.title}
            onValueChange={value => update(index, { title: value })}
          />
          <SettingsStackedInlineRow
            main={
              <PFTextInput
                size="xlarge"
                width={FULL}
                placeholder={placeholders.issuer}
                value={row.issuer}
                onValueChange={value => update(index, { issuer: value })}
              />
            }
            trailing={
              <SettingsStackedShrink>
                <ListRowActions
                  isFirst={index === 0}
                  onAdd={() =>
                    onRowsChange([...rows, { ...EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW }])
                  }
                  onRemove={() => onRowsChange(rows.filter((_, i) => i !== index))}
                />
              </SettingsStackedShrink>
            }
          />
        </SettingsStackedEntry>
      ))}
    </SettingsStackedEntryList>
  )
}
