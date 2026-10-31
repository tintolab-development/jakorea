import type { EducationScheduleItem } from '@/features/mypage/education/schedules/model/types'
import {
  canSubmitEducationAbsenceReason,
  resolveEducationScheduleProgressStatus,
} from '@/features/mypage/education/schedules/lib/schedule-rules'
import { EducationSessionCard } from '@/features/mypage/education/shared'
import { PFButton, PFCircleIconButton, PFText } from '@/shared/ui'
import schoolIconUrl from '../image/icon/school.svg'
import {
  formatUjatScheduleCardDate,
  isAssignedUjatSchedule,
  resolveUjatScheduleDayStatus,
} from '../lib/history'
import type { UjatEducationDayDocuments, UjatEducationDocumentTemplateSetup } from '../lib/documents'
import type { UjatDocumentFillMode } from './document-slot'
import { UjatEducationDocumentSlotBlock } from './document-slot'
import styles from './schedule-row.module.css'

type UjatVolunteerScheduleRowProps = {
  item: EducationScheduleItem
  canViewAttendance: boolean
  canCheckIn: boolean
  readOnly?: boolean
  onViewAttendance?: (item: EducationScheduleItem) => void
  onCheckIn?: (item: EducationScheduleItem) => void
  onAbsenceReasonSubmit?: (item: EducationScheduleItem) => void
  documents?: UjatEducationDayDocuments | null
  planSetup?: UjatEducationDocumentTemplateSetup | null
  journalSetup?: UjatEducationDocumentTemplateSetup | null
  onFillDocument?: (
    kind: 'PLAN' | 'JOURNAL',
    mode: UjatDocumentFillMode,
    documents: UjatEducationDayDocuments,
  ) => void
  onViewDocumentFeedback?: (kind: 'PLAN' | 'JOURNAL', documents: UjatEducationDayDocuments) => void
}

export function UjatVolunteerScheduleRow({
  item,
  canViewAttendance,
  canCheckIn,
  readOnly = false,
  onViewAttendance,
  onCheckIn,
  onAbsenceReasonSubmit,
  documents = null,
  planSetup = null,
  journalSetup = null,
  onFillDocument,
  onViewDocumentFeedback,
}: UjatVolunteerScheduleRowProps) {
  const progress = resolveEducationScheduleProgressStatus(item.heldAt)
  const heldLabel = formatUjatScheduleCardDate(item.heldAt)
  const dayStatus = resolveUjatScheduleDayStatus(item)
  const hasOperationalSchedule = item.scheduleId !== null
  const canSubmitAbsence =
    !readOnly &&
    onAbsenceReasonSubmit != null &&
    hasOperationalSchedule &&
    canSubmitEducationAbsenceReason(progress, item.attendanceStatus, item.availableActions)
  const school = item.locationName?.trim()
  const classLabel = item.classLabel?.trim()
  const unassigned = !isAssignedUjatSchedule(item) && !school && !classLabel
  const schoolLabel = school ?? (unassigned ? '미배정' : null)
  const classText = classLabel ?? (unassigned ? '미배정' : null)
  const showPlace = Boolean(schoolLabel || classText)
  const attendanceToneClass =
    dayStatus.tone === 'present'
      ? styles.statusPresent
      : dayStatus.tone === 'alert'
        ? styles.statusAlert
        : styles.statusScheduled

  return (
    <EducationSessionCard className={styles.card}>
      <div className={styles.head}>
        <div className={styles.identity}>
          <div className={styles.titleRow}>
            <PFText as="h3" typo="hd-sm" color="black" className={styles.date}>
              {heldLabel ?? '일정 미정'}
            </PFText>
            <PFText as="span" typo="bd-md-sb" className={[styles.status, attendanceToneClass].join(' ')}>
              {dayStatus.label}
            </PFText>
          </div>
          {showPlace ? (
            <div className={styles.info}>
              <div className={styles.school}>
                <img
                  className={styles.schoolIcon}
                  src={schoolIconUrl}
                  alt=""
                  width={28}
                  height={28}
                  aria-hidden="true"
                />
                {schoolLabel ? (
                  <PFText as="span" typo="bd-md-sb" color="primary-700">
                    {schoolLabel}
                  </PFText>
                ) : null}
                {schoolLabel && classText ? <span className={styles.schoolDivider} aria-hidden="true" /> : null}
                {classText ? (
                  <PFText as="span" typo="bd-md-sb" color="neutral-cool-600">
                    {classText}
                  </PFText>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <div className={styles.actions}>
          {/* PC 미만 전용: Figma 6810:78493 — 출석하기를 full width 버튼으로 (PC는 우측 아이콘 버튼) */}
          <PFButton
            type="button"
            variant="primary"
            size="large"
            className={[styles.rowButton, styles.checkInMobile].join(' ')}
            disabled={!canCheckIn || onCheckIn == null}
            onClick={() => {
              if (!canCheckIn || onCheckIn == null) return
              onCheckIn(item)
            }}
          >
            출석하기
          </PFButton>
          <div className={styles.actionButtons}>
            <PFButton
              type="button"
              variant="secondary"
              size="large"
              className={styles.rowButton}
              disabled={!canSubmitAbsence}
              onClick={() => {
                if (!canSubmitAbsence) return
                onAbsenceReasonSubmit?.(item)
              }}
            >
              결석 사유 제출하기
            </PFButton>
            <PFButton
              type="button"
              variant="secondary"
              size="large"
              className={styles.rowButton}
              disabled={!canViewAttendance || onViewAttendance == null}
              onClick={() => {
                if (!canViewAttendance || onViewAttendance == null) return
                onViewAttendance(item)
              }}
            >
              출석현황 보기
            </PFButton>
          </div>
          <span className={styles.divider} aria-hidden="true" />
          <div className={styles.checkIn}>
            <PFCircleIconButton
              icon="eventCalendar"
              disabled={!canCheckIn || onCheckIn == null}
              aria-label="출석하기"
              onClick={() => {
                if (!canCheckIn || onCheckIn == null) return
                onCheckIn(item)
              }}
            />
            <PFText
              as="span"
              typo="bd-md-sb"
              color={canCheckIn ? 'black' : 'neutral-warm-500'}
              className={styles.checkInLabel}
            >
              출석하기
            </PFText>
          </div>
        </div>
      </div>
      {documents ? (
        <div className={styles.documents}>
          <UjatEducationDocumentSlotBlock
            kind="PLAN"
            slot={documents.plan}
            setup={planSetup}
            onFill={mode => onFillDocument?.('PLAN', mode, documents)}
            onFeedback={() => onViewDocumentFeedback?.('PLAN', documents)}
          />
          <UjatEducationDocumentSlotBlock
            kind="JOURNAL"
            slot={documents.journal}
            setup={journalSetup}
            onFill={mode => onFillDocument?.('JOURNAL', mode, documents)}
            onFeedback={() => onViewDocumentFeedback?.('JOURNAL', documents)}
          />
        </div>
      ) : null}
    </EducationSessionCard>
  )
}
