/**
 * 일정 등록/수정 폼
 * Phase 3.1: react-hook-form + zod, 중복 경고 UI 포함
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useScheduleStore } from '../../store/scheduleStore'
import { useProgramStore } from '../../store/programStore'
import { useInstructorStore } from '../../store/instructorStore'
import { scheduleSchema, type ScheduleFormData, type ScheduleConflict } from '../../schemas/scheduleSchema'
import type { Schedule } from '../../types/domain'
import { MdTextField, MdSelect, MdSelectOption } from '../../components/m3'
import { CustomButton } from '../../components/ui'
import { formatDateString } from '../../utils/calendar'
import './ScheduleForm.css'

export default function ScheduleForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const { fetchScheduleById, createSchedule, updateSchedule, isLoading, conflicts, clearConflicts } =
    useScheduleStore()
  const programStore = useProgramStore()
  const instructorStore = useInstructorStore()

  // URL에서 날짜 파라미터 읽기 (신규 생성 시 기본 날짜)
  const defaultDate = searchParams.get('date') || ''

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      programId: '',
      roundId: '',
      title: '',
      date: defaultDate,
      startTime: '09:00',
      endTime: '11:00',
      location: '',
      onlineLink: '',
      instructorId: '',
    },
  })

  const watchedDate = watch('date')
  const watchedStartTime = watch('startTime')
  const watchedEndTime = watch('endTime')
  const watchedInstructorId = watch('instructorId')
  const watchedProgramId = watch('programId')

  const [validationConflicts, setValidationConflicts] = useState<ScheduleConflict[]>([])

  // 프로그램 목록 로드
  useEffect(() => {
    if (programStore.programs.length === 0) {
      programStore.fetchPrograms({ page: 1, pageSize: 100 })
    }
  }, [programStore])

  // 강사 목록 로드
  useEffect(() => {
    if (instructorStore.instructors.length === 0) {
      instructorStore.fetchInstructors({ page: 1, pageSize: 100 })
    }
  }, [instructorStore])

  // 선택된 프로그램의 회차 목록
  const selectedProgram = programStore.programs.find(p => p.id === watchedProgramId)
  const rounds = selectedProgram?.rounds || []

  // 편집 모드일 때 데이터 로드
  useEffect(() => {
    if (id) {
      fetchScheduleById(id).then(schedule => {
        if (schedule) {
          setValue('programId', schedule.programId)
          setValue('roundId', schedule.roundId || '')
          setValue('title', schedule.title)
          setValue('date', formatDateString(schedule.date))
          setValue('startTime', schedule.startTime)
          setValue('endTime', schedule.endTime)
          setValue('location', schedule.location || '')
          setValue('onlineLink', schedule.onlineLink || '')
          setValue('instructorId', schedule.instructorId || '')
        }
      })
    }
  }, [id, fetchScheduleById, setValue])

  // 중복 감지 (강사, 날짜, 시간 변경 시)
  useEffect(() => {
    if (watchedInstructorId && watchedDate && watchedStartTime && watchedEndTime) {
      const scheduleData: Partial<Schedule> = {
        programId: watchedProgramId || '',
        instructorId: watchedInstructorId,
        date: watchedDate,
        startTime: watchedStartTime,
        endTime: watchedEndTime,
      }

      const detectedConflicts = useScheduleStore.getState().detectConflicts(
        scheduleData as Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>,
        id
      )
      setValidationConflicts(detectedConflicts)
    } else {
      setValidationConflicts([])
    }
  }, [watchedInstructorId, watchedDate, watchedStartTime, watchedEndTime, watchedProgramId, id])

  const onSubmit = async (data: ScheduleFormData) => {
    clearConflicts()

    const submitData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'> = {
      programId: data.programId,
      roundId: data.roundId || undefined,
      title: data.title,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location || undefined,
      onlineLink: data.onlineLink || undefined,
      instructorId: data.instructorId || undefined,
    }

    if (isEdit && id) {
      const result = await updateSchedule(id, submitData)
      if (result.conflicts.length > 0) {
        // 중복이 있어도 저장은 되었지만 경고 표시
        return
      }
    } else {
      const result = await createSchedule(submitData)
      if (result.conflicts.length > 0) {
        // 중복이 있어도 저장은 되었지만 경고 표시
        return
      }
    }

    navigate('/schedules')
  }

  return (
    <div className="schedule-form-page">
      <div className="page-header">
        <CustomButton variant="tertiary" onClick={() => navigate('/schedules')}>
          ← 목록으로
        </CustomButton>
      </div>

      <h1>{isEdit ? '일정 수정' : '일정 등록'}</h1>

      {/* 중복 경고 UI */}
      {(conflicts.length > 0 || validationConflicts.length > 0) && (
        <div className="conflict-warning">
          <h3>⚠️ 일정 중복 경고</h3>
          <ul>
            {(conflicts.length > 0 ? conflicts : validationConflicts).map((conflict, index) => (
              <li key={index}>{conflict.message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="schedule-form">
        {/* 기본 정보 섹션 */}
        <div className="form-section">
          <h2>기본 정보</h2>
          <div className="form-grid">
            <Controller
              name="programId"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdSelect
                    label="프로그램 *"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    required
                    error={!!errors.programId}
                    errorText={errors.programId?.message}
                  >
                    <MdSelectOption value="">
                      <div slot="headline">선택해주세요</div>
                    </MdSelectOption>
                    {programStore.programs.map(program => (
                      <MdSelectOption key={program.id} value={program.id}>
                        <div slot="headline">{program.title}</div>
                      </MdSelectOption>
                    ))}
                  </MdSelect>
                </div>
              )}
            />
            {rounds.length > 0 && (
              <Controller
                name="roundId"
                control={control}
                render={({ field }) => (
                  <div className="form-item">
                    <MdSelect
                      label="회차"
                      value={field.value}
                      onChange={value => field.onChange(value)}
                      error={!!errors.roundId}
                      errorText={errors.roundId?.message}
                    >
                      <MdSelectOption value="">
                        <div slot="headline">선택 안함</div>
                      </MdSelectOption>
                      {rounds.map(round => (
                        <MdSelectOption key={round.id} value={round.id}>
                          <div slot="headline">{round.roundNumber}회차</div>
                        </MdSelectOption>
                      ))}
                    </MdSelect>
                  </div>
                )}
              />
            )}
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <div className="form-item full-width">
                  <MdTextField
                    label="일정 제목 *"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    required
                    error={!!errors.title}
                    errorText={errors.title?.message}
                  />
                </div>
              )}
            />
          </div>
        </div>

        {/* 날짜 및 시간 섹션 */}
        <div className="form-section">
          <h2>날짜 및 시간</h2>
          <div className="form-grid">
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdTextField
                    label="날짜 *"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    required
                    placeholder="YYYY-MM-DD"
                    error={!!errors.date}
                    errorText={errors.date?.message}
                  />
                </div>
              )}
            />
            <Controller
              name="startTime"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdTextField
                    label="시작 시간 *"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    required
                    placeholder="HH:mm"
                    error={!!errors.startTime}
                    errorText={errors.startTime?.message}
                  />
                </div>
              )}
            />
            <Controller
              name="endTime"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdTextField
                    label="종료 시간 *"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    required
                    placeholder="HH:mm"
                    error={!!errors.endTime}
                    errorText={errors.endTime?.message}
                  />
                </div>
              )}
            />
          </div>
        </div>

        {/* 장소 및 강사 섹션 */}
        <div className="form-section">
          <h2>장소 및 강사</h2>
          <div className="form-grid">
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdTextField
                    label="장소"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    error={!!errors.location}
                    errorText={errors.location?.message}
                    helperText="오프라인 장소를 입력하세요"
                  />
                </div>
              )}
            />
            <Controller
              name="onlineLink"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdTextField
                    label="온라인 링크"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    error={!!errors.onlineLink}
                    errorText={errors.onlineLink?.message}
                    helperText="온라인 일정인 경우 링크를 입력하세요"
                  />
                </div>
              )}
            />
            <Controller
              name="instructorId"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdSelect
                    label="강사"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    error={!!errors.instructorId}
                    errorText={errors.instructorId?.message}
                  >
                    <MdSelectOption value="">
                      <div slot="headline">선택 안함</div>
                    </MdSelectOption>
                    {instructorStore.instructors.map(instructor => (
                      <MdSelectOption key={instructor.id} value={instructor.id}>
                        <div slot="headline">{instructor.name}</div>
                      </MdSelectOption>
                    ))}
                  </MdSelect>
                </div>
              )}
            />
          </div>
        </div>

        {/* 폼 액션 */}
        <div className="form-actions">
          <CustomButton variant="secondary" type="button" onClick={() => navigate('/schedules')} disabled={isLoading}>
            취소
          </CustomButton>
          <CustomButton variant="primary" type="submit" loading={isLoading}>
            {isEdit ? '수정' : '등록'}
          </CustomButton>
        </div>
      </form>
    </div>
  )
}

