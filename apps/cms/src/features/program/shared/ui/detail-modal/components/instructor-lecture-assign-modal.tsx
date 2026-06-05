/**
 * 일반 프로그램(기관) — 강사 신청 상세 참여 승인 1단계: 강의 배정 안내
 * UJAT 면접일 배정 모달 레이아웃 재사용 (좌 캘린더 · 우 기관 카드 · 하단 배정 태그)
 */

import { useRef } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { useProgramRegistrationScheduleTopCalendarHeightSync } from '@/features/template/hooks/use-program-registration-schedule-top-calendar-height-sync'
import {
  useInstructorLectureAssignModal,
  type InstructorLectureAssignConfirmPayload,
} from '@/features/program/general/lib/use-instructor-lecture-assign-modal'
import type { InstructorLectureAssignItem } from '@/features/program/general/lib/instructor-lecture-assign-schedule'
import { UjatVolunteerInterviewAssignCalendarMini } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-interview-assign-calendar-mini'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import '@/shared/components/calendar/styles/calendar.css'
import './instructor-lecture-assign-modal.css'

const MODAL_Z_INDEX = 2500

export type InstructorLectureAssignModalProps = {
  open: boolean
  programId: string
  instructor: ApplicantInstructorRow
  allInstructors: ApplicantInstructorRow[]
  onCancel: () => void
  onConfirm: (payload: InstructorLectureAssignConfirmPayload) => void
}

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
        <CloseOutlined />
      </button>
    </span>
  )
}

export function InstructorLectureAssignModal({
  open,
  programId,
  instructor,
  allInstructors,
  onCancel,
  onConfirm,
}: InstructorLectureAssignModalProps) {
  const {
    schedule,
    currentMonth,
    setCurrentMonth,
    selectedDate,
    slotsForDay,
    preferredDateKeys,
    assignedDateKeys,
    assignedItems,
    handleSelectDate,
    handleAddSlot,
    handleRemoveAssignment,
    canConfirm,
  } = useInstructorLectureAssignModal({
    open,
    programId,
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
        배정할 기관 및 일정을 선택해 주세요.
      </span>
    )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="강사 배정 안내"
      width={800}
      className="instructor-lecture-assign-modal"
      zIndex={MODAL_Z_INDEX}
      modalStyles={{
        content: {
          height: 809,
          maxHeight: 809,
        },
        body: {
          maxHeight: 'calc(809px - 50px)',
          overflowY: 'auto',
        },
      }}
      description={`**[${instructor.instructorName}]** 강사님의 프로그램 참여를 승인하시려면 강의를 배정할 기관 및 일정을 선택해 주세요.\n강의는 동일한 날짜에 1개의 기관에만 배정 가능합니다.`}
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
      <div ref={scheduleTopRef} className="instructor-lecture-assign-modal__schedule-top">
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
        <div className="instructor-lecture-assign-modal__slots-panel">
          <div className="instructor-lecture-assign-modal__slots-list">
            {slotsForDay.length === 0 ? (
              <div className="instructor-lecture-assign-modal__slots-empty" role="status">
                이 날짜에 배정 가능한 기관이 없습니다.
              </div>
            ) : (
              slotsForDay.map(slot => {
                const isSelected = assignedItems.some(item => item.slotKey === slot.key)
                return (
                  <ParagraphChip
                    key={slot.key}
                    aria-pressed={isSelected}
                    disabled={slot.disabled}
                    className={[
                      'instructor-lecture-assign-modal__slot-chip',
                      isSelected ? 'instructor-lecture-assign-modal__slot-chip--selected' : '',
                      slot.disabled ? 'instructor-lecture-assign-modal__slot-chip--disabled' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    selected={isSelected}
                    onClick={() => handleAddSlot(slot)}
                  >
                    <span className="instructor-lecture-assign-modal__slot-main">
                      <span className="instructor-lecture-assign-modal__slot-school">
                        {slot.schoolName}
                      </span>
                      <span className="instructor-lecture-assign-modal__slot-meta">
                        {slot.region} | {slot.sessionLabel} ({slot.timeRange})
                      </span>
                    </span>
                    <span className="instructor-lecture-assign-modal__slot-count">
                      {slot.assignedCount}명
                    </span>
                  </ParagraphChip>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className="instructor-lecture-assign-modal__summary-section">
        <DetailInfoForm title="" hideHeader mode="edit">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label="배정된 항목 수" edit={assignedTags} view={assignedTags} />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </ContentModal>
  )
}
