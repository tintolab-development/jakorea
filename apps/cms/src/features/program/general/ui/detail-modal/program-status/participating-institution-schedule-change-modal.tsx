import { useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { ContentModal, CmsButton } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsDatePicker } from '@/shared/ui/cms-datepicker'
import type { Program } from '@/types/domain'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { resolveParticipatingInstitutionScheduleRowLabel } from '@/features/program/general/lib/participating-school-session-display'
import './participating-institution-schedule-change-modal.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function toDayjs(value: Date | string | null | undefined): Dayjs | null {
  if (value == null) return null
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : null
}

function formatDate(value: Date | string | null | undefined): string {
  const parsed = toDayjs(value)
  if (!parsed) return '-'
  return `${parsed.format('YYYY년 M월 D일')}(${WEEKDAYS[parsed.day()]})`
}

function formatSessionDate(session: ParticipatingSchoolSession): string {
  const parsed = dayjs(session.date.replace(/\s/g, '').replace(/\./g, '-'))
  const date = parsed.isValid()
    ? `${parsed.format('YYYY.MM.DD')}(${WEEKDAYS[parsed.day()]})`
    : session.date
  return `${date} ${session.timeRange.replace(/\s*~\s*/g, ' - ')}`
}

export type ParticipatingInstitutionScheduleChangePayload = {
  changes: Array<{
    session: ParticipatingSchoolSession
    changedDate: string
  }>
}

export function ParticipatingInstitutionScheduleChangeModal({
  open,
  program,
  sessions,
  onCancel,
  onConfirm,
}: {
  open: boolean
  program: Program
  sessions: ParticipatingSchoolSession[]
  onCancel: () => void
  onConfirm: (payload: ParticipatingInstitutionScheduleChangePayload) => void
}) {
  const [changedDates, setChangedDates] = useState<Record<number, Dayjs | null>>({})
  const programStart = useMemo(() => toDayjs(program.startDate), [program.startDate])
  const programEnd = useMemo(() => toDayjs(program.endDate), [program.endDate])

  useEffect(() => {
    if (open) setChangedDates({})
  }, [open])

  const selectedChanges = sessions.flatMap((session, index) => {
    const changedDate = changedDates[index]
    return changedDate ? [{ session, changedDate: changedDate.format('YYYY-MM-DD') }] : []
  })

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="교육 진행 일정 변경"
      width={1000}
      className="participating-institution-schedule-change-modal"
      footer={
        <div className="participating-institution-schedule-change-modal__footer">
          <CmsButton variant="secondary" size="large" type="button" onClick={onCancel}>
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            disabled={selectedChanges.length === 0}
            onClick={() => onConfirm({ changes: selectedChanges })}
          >
            일정 변경
          </CmsButton>
        </div>
      }
    >
      <div className="participating-institution-schedule-change-modal__content">
        <p className="participating-institution-schedule-change-modal__description">
          일정은 아래의 교육 진행 기간 내에서만 변경 가능합니다.
        </p>

        <DetailInfoForm title="교육 진행 기간" hideHeader mode="edit">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="교육 진행 기간"
              fullRow
              readOnlyDisplay
              view={`${formatDate(program.startDate)} - ${formatDate(program.endDate)}`}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>

        <DetailInfoForm title="교육 진행 일정 변경" hideHeader mode="edit">
          {sessions.map((session, index) => (
            <DetailInfoForm.Row
              key={`${session.round}-${session.date}-${index}`}
              type="double"
            >
              <DetailInfoForm.Field
                label={`${resolveParticipatingInstitutionScheduleRowLabel(program, session)} 기준 일정`}
                readOnlyDisplay
                view={formatSessionDate(session)}
              />
              <DetailInfoForm.Field
                label={`${resolveParticipatingInstitutionScheduleRowLabel(program, session)} 변경 일정`}
                view="-"
                edit={
                  <CmsDatePicker
                    inputSize="medium"
                    value={changedDates[index] ?? null}
                    placeholder="변경 일정을 선택해 주세요"
                    format="YYYY.MM.DD"
                    style={{ width: '100%' }}
                    disabledDate={date =>
                      (programStart != null && date.isBefore(programStart, 'day')) ||
                      (programEnd != null && date.isAfter(programEnd, 'day'))
                    }
                    onChange={date =>
                      setChangedDates(prev => ({
                        ...prev,
                        [index]: date,
                      }))
                    }
                  />
                }
              />
            </DetailInfoForm.Row>
          ))}
        </DetailInfoForm>
      </div>
    </ContentModal>
  )
}
