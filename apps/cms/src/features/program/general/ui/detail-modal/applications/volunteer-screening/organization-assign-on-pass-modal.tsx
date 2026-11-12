/**
 * 일반(기관형) 봉사자 — 면접 합격 시 「기관 배정 안내」 (BE A1)
 * 시안: 04-2 봉사자 신청 상세 / 16-2 봉사자 배정 안내 팝업(4968:105398) — 16-1 합격 유형 「합격」 다음 단계
 * - 좌 캘린더 · 우 기관 카드 · 하단 「배정된 일정」 태그 (강사 기관 배정 안내 05-1과 같은 레이아웃·클래스)
 * - 후보: GET …/volunteer-assignments/candidates (아직 시작하지 않은 승인 기관 회차)
 * - 배정은 선택 사항 — 고르지 않으면 합격만 처리(assignments 생략)
 * - 「일정은 하루에 1개의 기관에만 배정 가능」 — 같은 날 다른 기관 카드는 비활성(서버도 409로 거절)
 */

import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { fetchVolunteerAssignmentCandidatesRemote } from '@/features/program/general/api/volunteer-assignment-candidates-api-client'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  groupVolunteerAssignmentSlotDateKeys,
  isVolunteerAssignmentSlotBlocked,
  mapVolunteerAssignmentCandidatesToSlots,
  toggleVolunteerAssignmentSlot,
  type VolunteerFinalPassAssignmentSlot,
} from '@/features/program/general/lib/volunteer-final-pass-assignment'
import { UjatVolunteerInterviewAssignCalendarMini } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/calendar-mini'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import { useProgramRegistrationScheduleTopCalendarHeightSync } from '@/features/template/hooks/use-program-registration-schedule-top-calendar-height-sync'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { FileRemoveIcon } from '@/shared/ui/icons/FileRemoveIcon'
import '@/shared/components/calendar/styles/calendar.css'
import '@/features/program/shared/ui/detail-modal/components/instructor-lecture-assign-modal.css'

const MODAL_Z_INDEX = 2500
const MODAL_HEIGHT = 809

export type GeneralVolunteerOrganizationAssignOnPassModalProps = {
  open: boolean
  programId: string
  volunteerName: string
  confirmLoading?: boolean
  onCancel: () => void
  /** 선택 없음 = 빈 배열(합격만 처리) */
  onConfirm: (selected: VolunteerFinalPassAssignmentSlot[]) => void
}

export function GeneralVolunteerOrganizationAssignOnPassModal({
  open,
  programId,
  volunteerName,
  confirmLoading = false,
  onCancel,
  onConfirm,
}: GeneralVolunteerOrganizationAssignOnPassModalProps) {
  const candidatesQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.volunteerAssignmentCandidates(programId),
    queryFn: ({ signal }) => fetchVolunteerAssignmentCandidatesRemote(programId, signal),
    enabled: open && Boolean(programId),
    // 배정 인원(assignedVolunteerCount)이 다른 합격 처리로 바로 바뀐다 — 열 때마다 새로 받는다
    staleTime: 0,
    retry: false,
  })

  const slots = useMemo(
    () => mapVolunteerAssignmentCandidatesToSlots(candidatesQuery.data ?? []),
    [candidatesQuery.data]
  )
  const candidateDateKeys = useMemo(() => groupVolunteerAssignmentSlotDateKeys(slots), [slots])
  const firstDateKey = slots[0]?.dateKey ?? null

  const [selected, setSelected] = useState<VolunteerFinalPassAssignmentSlot[]>([])
  const [pickedDateKey, setPickedDateKey] = useState<string | null>(null)
  const [viewMonth, setViewMonth] = useState<Dayjs | null>(null)
  const [prevOpen, setPrevOpen] = useState(open)
  // 열 때마다 선택·달력 초기화 (렌더 중 상태 조정 — effect setState 회피)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setSelected([])
      setPickedDateKey(null)
      setViewMonth(null)
    }
  }

  // 날짜를 고르기 전에는 첫 후보 날짜를 보여 준다
  const activeDateKey = pickedDateKey ?? firstDateKey
  const selectedDate = activeDateKey ? dayjs(activeDateKey) : dayjs()
  const currentMonth = viewMonth ?? selectedDate.startOf('month')
  const assignedDateKeys = useMemo(() => new Set(selected.map(slot => slot.dateKey)), [selected])
  const dateSlots = useMemo(
    () => (activeDateKey ? slots.filter(slot => slot.dateKey === activeDateKey) : []),
    [activeDateKey, slots]
  )

  const scheduleTopRef = useRef<HTMLDivElement>(null)
  const calendarWrapRef = useRef<HTMLDivElement>(null)
  useProgramRegistrationScheduleTopCalendarHeightSync(scheduleTopRef, calendarWrapRef)

  const slotsEmptyText = candidatesQuery.isLoading
    ? '배정할 수 있는 기관 일정을 불러오는 중입니다.'
    : candidatesQuery.isError
      ? '기관 일정을 불러오지 못했습니다. 다시 시도해 주세요.'
      : slots.length === 0
        ? '배정할 수 있는 기관 일정이 없습니다.'
        : '선택한 날짜에 배정할 수 있는 기관 일정이 없습니다.'

  const assignedTags =
    selected.length > 0 ? (
      <div className="instructor-lecture-assign-modal__assigned-tags">
        {selected.map(slot => (
          <span key={slot.key} className="instructor-lecture-assign-modal__assigned-tag">
            <span className="instructor-lecture-assign-modal__assigned-tag-text">
              {slot.tagLabel}
            </span>
            <button
              type="button"
              className="instructor-lecture-assign-modal__assigned-tag-remove"
              aria-label={`${slot.tagLabel} 배정 삭제`}
              onClick={() => setSelected(prev => prev.filter(item => item.key !== slot.key))}
            >
              <FileRemoveIcon />
            </button>
          </span>
        ))}
      </div>
    ) : (
      <span className="instructor-lecture-assign-modal__assigned-placeholder">
        배정할 기관 및 일정을 선택해 주세요. 선택하지 않으면 기관 배정 없이 합격 처리됩니다.
      </span>
    )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="기관 배정 안내"
      width={800}
      className="instructor-lecture-assign-modal general-volunteer-organization-assign-on-pass-modal"
      zIndex={MODAL_Z_INDEX}
      modalStyles={{
        content: { height: MODAL_HEIGHT, maxHeight: MODAL_HEIGHT },
        body: { maxHeight: `calc(${MODAL_HEIGHT}px - 50px)`, overflowY: 'auto' },
      }}
      description={`**[${volunteerName.trim() || '봉사자'}]** 님을 배정할 기관 및 일정을 선택해 주세요.\n일정은 **하루에 1개의 기관에만 배정 가능**합니다.`}
      footer={
        <div className="instructor-lecture-assign-modal__footer">
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            loading={confirmLoading}
            onClick={() => onConfirm(selected)}
          >
            {selected.length > 0 ? '기관 배정' : '합격'}
          </CmsButton>
        </div>
      }
    >
      <div ref={scheduleTopRef} className="instructor-lecture-assign-modal__schedule-top">
        <div ref={calendarWrapRef} className="instructor-lecture-assign-modal__calendar-panel">
          <UjatVolunteerInterviewAssignCalendarMini
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onMonthChange={month => setViewMonth(month.startOf('month'))}
            onSelectDate={date => {
              setPickedDateKey(date.format('YYYY-MM-DD'))
              setViewMonth(date.startOf('month'))
            }}
            programDates={candidateDateKeys}
            clickableDates={candidateDateKeys}
            assignedDateKeys={assignedDateKeys}
          />
        </div>
        <div className="instructor-lecture-assign-modal__slots-panel">
          <div className="instructor-lecture-assign-modal__slots-list">
            {dateSlots.length === 0 ? (
              <div className="instructor-lecture-assign-modal__slots-empty" role="status">
                {slotsEmptyText}
              </div>
            ) : (
              dateSlots.map(slot => {
                const isSelected = selected.some(item => item.key === slot.key)
                const blocked = !isSelected && isVolunteerAssignmentSlotBlocked(slot, selected)
                return (
                  <ParagraphChip
                    key={slot.key}
                    aria-pressed={isSelected}
                    disabled={blocked}
                    className={[
                      'instructor-lecture-assign-modal__slot-chip',
                      isSelected ? 'instructor-lecture-assign-modal__slot-chip--selected' : '',
                      blocked ? 'instructor-lecture-assign-modal__slot-chip--disabled' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    selected={isSelected}
                    onClick={() => setSelected(prev => toggleVolunteerAssignmentSlot(prev, slot))}
                  >
                    <span className="instructor-lecture-assign-modal__slot-main">
                      <span className="instructor-lecture-assign-modal__slot-school">
                        {slot.organizationName}
                      </span>
                      <span className="instructor-lecture-assign-modal__slot-meta">
                        {withProgramDetailTdDivider(
                          [
                            slot.region,
                            slot.sessionLabel
                              ? `${slot.sessionLabel} (${slot.timeRange})`
                              : slot.timeRange,
                          ].filter(Boolean)
                        )}
                      </span>
                    </span>
                    {/* 필요 인원은 서버에 데이터가 없어(항상 null) 현재 배정 인원만 표시 */}
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
            <DetailInfoForm.Field label="배정된 일정" edit={assignedTags} view={assignedTags} />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </ContentModal>
  )
}
