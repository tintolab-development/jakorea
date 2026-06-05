/**
 * 일반 프로그램 — 강사 신청 상세 참여 승인 1단계: 강의 배정 안내
 * - organization: UJAT 면접일 배정 모달 레이아웃 (좌 캘린더 · 우 기관 카드 · 하단 배정 태그)
 * - individual: 관리자 등록 일정 목록 · 배정된 일정 요약
 */

import { useRef } from 'react'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { formatIndividualLectureAssignTagLabel } from '@/features/program/general/lib/instructor-lecture-assign-schedule'
import { useProgramRegistrationScheduleTopCalendarHeightSync } from '@/features/template/hooks/use-program-registration-schedule-top-calendar-height-sync'
import {
  useInstructorLectureAssignModal,
  type InstructorLectureAssignConfirmPayload,
  type InstructorLectureAssignModalVariant,
} from '@/features/program/general/lib/use-instructor-lecture-assign-modal'
import type { InstructorLectureAssignItem } from '@/features/program/general/lib/instructor-lecture-assign-schedule'
import { UjatVolunteerInterviewAssignCalendarMini } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-interview-assign-calendar-mini'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { DividerVertical } from '@/shared/components/divider-vertical'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import type { Program } from '@/types/domain'
import dayjs from 'dayjs'
import '@/shared/components/calendar/styles/calendar.css'
import './instructor-lecture-assign-modal.css'

const MODAL_Z_INDEX = 2500
const INDIVIDUAL_MODAL_WIDTH = 600

export type InstructorLectureAssignModalProps = {
  open: boolean
  variant?: InstructorLectureAssignModalVariant
  programId: string
  program?: Program | null
  instructor: ApplicantInstructorRow
  allInstructors: ApplicantInstructorRow[]
  onCancel: () => void
  onConfirm: (payload: InstructorLectureAssignConfirmPayload) => void
}

const ASSIGNED_SCHEDULE_REMOVE_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden
    className="instructor-lecture-assign-modal__assigned-tag-remove-icon"
  >
    <path
      d="M7.91667 8.79479L10.4775 11.3558C10.5929 11.4711 10.738 11.5301 10.9127 11.5329C11.0873 11.5356 11.235 11.4765 11.3558 11.3558C11.4765 11.235 11.5369 11.0886 11.5369 10.9167C11.5369 10.7447 11.4765 10.5983 11.3558 10.4775L8.79479 7.91667L11.3558 5.35583C11.4711 5.24042 11.5301 5.09535 11.5329 4.92063C11.5356 4.74604 11.4765 4.59833 11.3558 4.4775C11.235 4.35681 11.0886 4.29646 10.9167 4.29646C10.7447 4.29646 10.5983 4.35681 10.4775 4.4775L7.91667 7.03854L5.35583 4.4775C5.24042 4.36222 5.09535 4.30319 4.92063 4.30042C4.74604 4.29778 4.59833 4.35681 4.4775 4.4775C4.35681 4.59833 4.29646 4.74472 4.29646 4.91667C4.29646 5.08861 4.35681 5.235 4.4775 5.35583L7.03854 7.91667L4.4775 10.4775C4.36222 10.5929 4.30319 10.738 4.30042 10.9127C4.29778 11.0873 4.35681 11.235 4.4775 11.3558C4.59833 11.4765 4.74472 11.5369 4.91667 11.5369C5.08861 11.5369 5.235 11.4765 5.35583 11.3558L7.91667 8.79479ZM7.91812 15.8333C6.82312 15.8333 5.79389 15.6256 4.83042 15.21C3.86694 14.7944 3.02889 14.2305 2.31625 13.5181C1.60361 12.8058 1.03937 11.9681 0.623542 11.005C0.207847 10.0419 0 9.01299 0 7.91812C0 6.82312 0.207778 5.79389 0.623333 4.83042C1.03889 3.86694 1.60285 3.02889 2.31521 2.31625C3.02757 1.60361 3.86528 1.03937 4.82833 0.623542C5.79139 0.207847 6.82035 0 7.91521 0C9.01021 0 10.0394 0.207777 11.0029 0.623333C11.9664 1.03889 12.8044 1.60285 13.5171 2.31521C14.2297 3.02757 14.794 3.86528 15.2098 4.82833C15.6255 5.79139 15.8333 6.82035 15.8333 7.91521C15.8333 9.01021 15.6256 10.0394 15.21 11.0029C14.7944 11.9664 14.2305 12.8044 13.5181 13.5171C12.8058 14.2297 11.9681 14.794 11.005 15.2098C10.0419 15.6255 9.01299 15.8333 7.91812 15.8333Z"
      fill="var(--gray-bdc-6-c-9, #BDC6C9)"
    />
  </svg>
)

function InstructorLectureAssignTag({
  item,
  onRemove,
}: {
  item: InstructorLectureAssignItem
  onRemove: () => void
}) {
  return (
    <span className="instructor-lecture-assign-modal__assigned-tag">
      <span className="instructor-lecture-assign-modal__assigned-tag-text">{item.tagLabel}</span>
      <button
        type="button"
        className="instructor-lecture-assign-modal__assigned-tag-remove"
        aria-label={`${item.tagLabel} 배정 삭제`}
        onClick={onRemove}
      >
        {ASSIGNED_SCHEDULE_REMOVE_ICON}
      </button>
    </span>
  )
}

function renderSlotChip(params: {
  slot: {
    key: string
    disabled?: boolean
    schoolName: string
    region: string
    sessionLabel: string
    timeRange: string
    dateKey: string
    assignedCount: number
  }
  isSelected: boolean
  isIndividual: boolean
  onAdd: () => void
}) {
  const { slot, isSelected, isIndividual, onAdd } = params
  const individualScheduleText = isIndividual
    ? formatIndividualLectureAssignTagLabel(dayjs(slot.dateKey), slot.timeRange)
    : null

  return (
    <ParagraphChip
      key={slot.key}
      aria-pressed={isSelected}
      disabled={slot.disabled}
      className={[
        'instructor-lecture-assign-modal__slot-chip',
        isIndividual ? 'instructor-lecture-assign-modal__slot-chip--individual' : '',
        isSelected ? 'instructor-lecture-assign-modal__slot-chip--selected' : '',
        slot.disabled ? 'instructor-lecture-assign-modal__slot-chip--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      selected={isSelected}
      onClick={onAdd}
    >
      <span className="instructor-lecture-assign-modal__slot-main">
        {isIndividual ? (
          <span className="instructor-lecture-assign-modal__slot-individual-content">
            <span className="instructor-lecture-assign-modal__slot-schedule-text">
              {individualScheduleText}
            </span>
            <DividerVertical
              height={13}
              className="instructor-lecture-assign-modal__slot-divider"
            />
            <span className="instructor-lecture-assign-modal__slot-session-label">
              {slot.sessionLabel}
            </span>
          </span>
        ) : (
          <>
            <span className="instructor-lecture-assign-modal__slot-school">{slot.schoolName}</span>
            <span className="instructor-lecture-assign-modal__slot-meta">
              {slot.region} | {slot.sessionLabel} ({slot.timeRange})
            </span>
          </>
        )}
      </span>
      <span className="instructor-lecture-assign-modal__slot-count">{slot.assignedCount}명</span>
    </ParagraphChip>
  )
}

export function InstructorLectureAssignModal({
  open,
  variant = 'organization',
  programId,
  program = null,
  instructor,
  allInstructors,
  onCancel,
  onConfirm,
}: InstructorLectureAssignModalProps) {
  const {
    isIndividual,
    schedule,
    currentMonth,
    setCurrentMonth,
    selectedDate,
    slotsForDay,
    individualSlots,
    preferredDateKeys,
    assignedDateKeys,
    assignedItems,
    handleSelectDate,
    handleAddSlot,
    handleRemoveAssignment,
    canConfirm,
  } = useInstructorLectureAssignModal({
    open,
    variant,
    programId,
    program,
    instructor,
    allInstructors,
  })

  const scheduleTopRef = useRef<HTMLDivElement>(null)
  const calendarWrapRef = useRef<HTMLDivElement>(null)

  useProgramRegistrationScheduleTopCalendarHeightSync(scheduleTopRef, calendarWrapRef)

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm({ assignments: assignedItems })
  }

  const assignedTags =
    assignedItems.length > 0 ? (
      <div className="instructor-lecture-assign-modal__assigned-tags">
        {assignedItems.map(item => (
          <InstructorLectureAssignTag
            key={item.slotKey}
            item={item}
            onRemove={() => handleRemoveAssignment(item.slotKey)}
          />
        ))}
      </div>
    ) : (
      <span className="instructor-lecture-assign-modal__assigned-placeholder">
        {isIndividual
          ? '배정할 일정을 선택해 주세요.'
          : '배정할 기관 및 일정을 선택해 주세요.'}
      </span>
    )

  const description = isIndividual
    ? `**[${instructor.instructorName}]** 강사님의 프로그램 참여를 승인하시려면 강의를 배정할 일정을 선택해 주세요.`
    : `**[${instructor.instructorName}]** 강사님의 프로그램 참여를 승인하시려면 강의를 배정할 기관 및 일정을 선택해 주세요.\n강의는 동일한 날짜에 1개의 기관에만 배정 가능합니다.`

  const summaryLabel = isIndividual ? '배정된 일정' : '배정된 항목 수'

  const visibleSlots = isIndividual ? individualSlots : slotsForDay

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="강사 배정 안내"
      width={isIndividual ? INDIVIDUAL_MODAL_WIDTH : 800}
      className={[
        'instructor-lecture-assign-modal',
        isIndividual ? 'instructor-lecture-assign-modal--individual' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      zIndex={MODAL_Z_INDEX}
      modalStyles={
        isIndividual
          ? undefined
          : {
              content: {
                height: 809,
                maxHeight: 809,
              },
              body: {
                maxHeight: 'calc(809px - 50px)',
                overflowY: 'auto',
              },
            }
      }
      descriptionGap={isIndividual ? 'compact' : 'default'}
      description={description}
      footer={
        <div className="instructor-lecture-assign-modal__footer">
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            강의 배정
          </CmsButton>
        </div>
      }
    >
      <div
        ref={scheduleTopRef}
        className={[
          'instructor-lecture-assign-modal__schedule-top',
          isIndividual ? 'instructor-lecture-assign-modal__schedule-top--individual' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {!isIndividual ? (
          <div ref={calendarWrapRef} className="instructor-lecture-assign-modal__calendar-panel">
            <UjatVolunteerInterviewAssignCalendarMini
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onMonthChange={setCurrentMonth}
              onSelectDate={handleSelectDate}
              programDates={preferredDateKeys}
              clickableDates={schedule.clickableDateKeys}
              holidayDateKeys={schedule.holidayDateKeys}
              assignedDateKeys={assignedDateKeys}
              disabledDate={schedule.disabledDate}
            />
          </div>
        ) : null}
        <div
          className={[
            'instructor-lecture-assign-modal__slots-panel',
            isIndividual ? 'instructor-lecture-assign-modal__slots-panel--individual' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="instructor-lecture-assign-modal__slots-list">
            {visibleSlots.length === 0 ? (
              <div className="instructor-lecture-assign-modal__slots-empty" role="status">
                {isIndividual
                  ? '등록된 교육 일정이 없습니다.'
                  : '이 날짜에 배정 가능한 기관이 없습니다.'}
              </div>
            ) : (
              visibleSlots.map(slot => {
                const isSelected = assignedItems.some(item => item.slotKey === slot.key)
                return renderSlotChip({
                  slot,
                  isSelected,
                  isIndividual,
                  onAdd: () => handleAddSlot(slot),
                })
              })
            )}
          </div>
        </div>
      </div>

      <div className="instructor-lecture-assign-modal__summary-section">
        <DetailInfoForm title="" hideHeader mode="edit">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label={summaryLabel} edit={assignedTags} view={assignedTags} />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </ContentModal>
  )
}
