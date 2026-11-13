/**
 * 일반 프로그램 — 강사 신청 상세 참여 승인 1단계: 강의 배정 안내
 * - organization: UJAT 면접일 배정 모달 레이아웃 (좌 캘린더 · 우 기관 카드 · 하단 배정 태그)
 * - individual: 관리자 등록 일정 목록 · 배정된 일정 요약
 */

import fieldDeleteUrl from '@/shared/assets/icons/inputs/delete-20-default.svg'
import { useRef } from 'react'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import { formatIndividualLectureAssignTagLabel } from '@/features/program/general/lib/instructor-lecture-assign-schedule'
import { useProgramRegistrationScheduleTopCalendarHeightSync } from '@/features/template/hooks/use-program-registration-schedule-top-calendar-height-sync'
import {
  useInstructorLectureAssignModal,
  type InstructorLectureAssignConfirmPayload,
  type InstructorLectureAssignModalVariant,
} from '@/features/program/general/lib/use-instructor-lecture-assign-modal'
import type { InstructorLectureAssignItem } from '@/features/program/general/lib/instructor-lecture-assign-schedule'
import { UjatVolunteerInterviewAssignCalendarMini } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/calendar-mini'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import { InstructorAssignSessionSlotChip } from '@/features/program/shared/ui/detail-modal/components/instructor-assign-session-slot-chip'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
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
  /** `general-organization`: 일반(기관형) 시안 05-1 — 「일정은 **하루에 1개의 기관에만 배정 가능**합니다.」 */
  copyVariant?: 'default' | 'general-organization'
}

/** 배정 태그 삭제 — 시안 `Icon / Field / w20` delete 원본 */
const ASSIGNED_SCHEDULE_REMOVE_ICON = (
  <img
    src={fieldDeleteUrl}
    width={20}
    height={20}
    alt=""
    aria-hidden
    draggable={false}
    className="instructor-lecture-assign-modal__assigned-tag-remove-icon"
  />
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
    label?: string
  }
  isSelected: boolean
  isIndividual: boolean
  onAdd: () => void
}) {
  const { slot, isSelected, isIndividual, onAdd } = params

  if (isIndividual) {
    const chip = (
      <InstructorAssignSessionSlotChip
        scheduleLabel={
          slot.label ?? formatIndividualLectureAssignTagLabel(dayjs(slot.dateKey), slot.timeRange)
        }
        sessionRoundLabel={slot.sessionLabel}
        capacityLabel={`${slot.assignedCount}명`}
        selected={isSelected}
        disabled={slot.disabled}
        onClick={onAdd}
      />
    )
    if (!slot.disabled) {
      return <div key={slot.key}>{chip}</div>
    }
    return (
      <span key={slot.key} title="배정할 수 없는 일정입니다.">
        {chip}
      </span>
    )
  }

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
      onClick={onAdd}
    >
      <span className="instructor-lecture-assign-modal__slot-main">
        <span className="instructor-lecture-assign-modal__slot-school">{slot.schoolName}</span>
        <span className="instructor-lecture-assign-modal__slot-meta">
          {withProgramDetailTdDivider([slot.region, `${slot.sessionLabel} (${slot.timeRange})`])}
        </span>
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
  copyVariant = 'default',
}: InstructorLectureAssignModalProps) {
  const {
    isIndividual,
    schedule,
    currentMonth,
    setCurrentMonth,
    selectedDate,
    availableSlots,
    useSlotListLayout,
    slotsEmptyText,
    showNoApprovedOrganizationBanner,
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
        {isIndividual ? '배정할 일정을 선택해 주세요.' : '배정할 기관 및 일정을 선택해 주세요.'}
      </span>
    )

  const description = isIndividual
    ? `**[${instructor.instructorName}]** 강사님의 프로그램 참여를 승인하시려면 강의를 배정할 일정을 선택해 주세요.`
    : copyVariant === 'general-organization'
      ? `**[${instructor.instructorName}]** 님을 배정할 기관 및 일정을 선택해 주세요.\n일정은 **하루에 1개의 기관에만 배정 가능**합니다.`
      : `**[${instructor.instructorName}]** 님을 배정할 기관 및 일정을 선택해 주세요.\n일정은 하루 1개의 기관에만 배정 가능합니다.`

  const summaryLabel = '배정된 일정'

  const usePeriodSlotChip = isIndividual || useSlotListLayout

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={isIndividual ? '강사 배정 안내' : '기관 배정 안내'}
      width={useSlotListLayout ? INDIVIDUAL_MODAL_WIDTH : 800}
      className={[
        'instructor-lecture-assign-modal',
        useSlotListLayout ? 'instructor-lecture-assign-modal--individual' : '',
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
      descriptionGap={useSlotListLayout ? 'compact' : 'default'}
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
            onClick={handleConfirm} >
            {isIndividual ? '강의 배정' : '기관 배정'}
          </CmsButton>
        </div>
      }
    >
      <div
        ref={scheduleTopRef}
        className={[
          'instructor-lecture-assign-modal__schedule-top',
          useSlotListLayout ? 'instructor-lecture-assign-modal__schedule-top--individual' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {showNoApprovedOrganizationBanner ? (
          <p className="instructor-lecture-assign-modal__org-empty-notice" role="status">
            배정된 일정이 있는 승인 기관이 없어 기관 단위 배정 일정을 표시할 수 없습니다. 강사가
            선택한 가능 구간은 아래와 같습니다.
          </p>
        ) : null}
        {!useSlotListLayout ? (
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
            useSlotListLayout ? 'instructor-lecture-assign-modal__slots-panel--individual' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="instructor-lecture-assign-modal__slots-list">
            {availableSlots.length === 0 ? (
              <div className="instructor-lecture-assign-modal__slots-empty" role="status">
                {slotsEmptyText}
              </div>
            ) : (
              availableSlots.map(slot => {
                const isSelected = assignedItems.some(item => item.slotKey === slot.key)
                return renderSlotChip({
                  slot,
                  isSelected,
                  isIndividual: usePeriodSlotChip,
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
