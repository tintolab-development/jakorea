/**
 * 프로그램 등록/수정 폼
 * Phase 2.1: react-hook-form + zod, 복잡한 폼 필드 (회차 배열)
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useProgramStore } from '../../store/programStore'
import { useSponsorStore } from '../../store/sponsorStore'
import { programSchema, type ProgramFormData, type ProgramRoundFormData } from '../../schemas/programSchema'
import type { Program } from '../../types/domain'
import { MdTextField, MdSelect, MdSelectOption } from '../../components/m3'
import { CustomButton } from '../../components/ui'
import './ProgramForm.css'

export default function ProgramForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { fetchProgramById, createProgram, updateProgram, isLoading } = useProgramStore()
  const sponsorStore = useSponsorStore()

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      title: '',
      sponsorId: '',
      type: 'offline',
      format: 'workshop',
      description: '',
      startDate: '',
      endDate: '',
      status: 'pending',
      rounds: [
        {
          roundNumber: 1,
          startDate: '',
          endDate: '',
          capacity: undefined,
        },
      ],
      settlementRuleId: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rounds',
  })

  const watchedRounds = watch('rounds')
  const watchedStartDate = watch('startDate')
  const watchedEndDate = watch('endDate')

  // 스폰서 목록 로드
  useEffect(() => {
    if (sponsorStore.sponsors.length === 0) {
      sponsorStore.fetchSponsors({ page: 1, pageSize: 100 })
    }
  }, [sponsorStore])

  // 편집 모드일 때 데이터 로드
  useEffect(() => {
    if (id) {
      fetchProgramById(id).then(program => {
        if (program) {
          // DateValue를 string으로 변환 (YYYY-MM-DD 형식)
          const formatDateForInput = (dateValue: string | Date): string => {
            if (typeof dateValue === 'string') return dateValue
            const date = new Date(dateValue)
            return date.toISOString().split('T')[0]
          }

          setValue('title', program.title)
          setValue('sponsorId', program.sponsorId)
          setValue('type', program.type)
          setValue('format', program.format)
          setValue('description', program.description ?? '')
          setValue('startDate', formatDateForInput(program.startDate))
          setValue('endDate', formatDateForInput(program.endDate))
          setValue('status', program.status as 'active' | 'inactive' | 'pending')
          setValue('settlementRuleId', program.settlementRuleId ?? '')

          // 회차 데이터 설정 (id, programId, status 제외)
          const roundsData: ProgramRoundFormData[] = program.rounds
            .sort((a, b) => a.roundNumber - b.roundNumber)
            .map(round => ({
              roundNumber: round.roundNumber,
              startDate: formatDateForInput(round.startDate),
              endDate: formatDateForInput(round.endDate),
              capacity: round.capacity ?? undefined,
            }))
          setValue('rounds', roundsData)
        }
      })
    }
  }, [id, fetchProgramById, setValue])

  // 회차 추가
  const handleAddRound = () => {
    const maxRoundNumber = watchedRounds.length > 0
      ? Math.max(...watchedRounds.map(r => r.roundNumber || 0))
      : 0
    append({
      roundNumber: maxRoundNumber + 1,
      startDate: watchedStartDate || '',
      endDate: watchedEndDate || '',
      capacity: undefined,
    })
  }

  // 회차 삭제
  const handleRemoveRound = (index: number) => {
    if (watchedRounds.length > 1) {
      remove(index)
      // 회차 번호 재정렬
      const updatedRounds = watchedRounds.filter((_, i) => i !== index)
      updatedRounds.forEach((_, i) => {
        setValue(`rounds.${i}.roundNumber`, i + 1)
      })
    }
  }

  const onSubmit = async (data: ProgramFormData) => {
    // 회차 데이터에 id와 status 추가 (생성 시)
    const roundsData = data.rounds.map((round, index) => ({
      id: isEdit && id
        ? `round-${id}-${index + 1}`
        : `round-temp-${index + 1}`,
      programId: id || 'temp',
      roundNumber: round.roundNumber,
      startDate: round.startDate,
      endDate: round.endDate,
      capacity: round.capacity,
      status: 'pending' as const,
    }))

    const submitData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'> = {
      sponsorId: data.sponsorId,
      title: data.title,
      type: data.type,
      format: data.format,
      description: data.description || undefined,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      rounds: roundsData,
      settlementRuleId: data.settlementRuleId || undefined,
    }

    if (isEdit && id) {
      await updateProgram(id, submitData)
    } else {
      await createProgram(submitData)
    }
    navigate('/programs')
  }

  return (
    <div className="program-form-page">
      <div className="page-header">
        <CustomButton variant="tertiary" onClick={() => navigate('/programs')}>
          ← 목록으로
        </CustomButton>
      </div>

      <h1>{isEdit ? '프로그램 수정' : '프로그램 등록'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="program-form">
        {/* 기본 정보 섹션 */}
        <div className="form-section">
          <h2>기본 정보</h2>
          <div className="form-grid">
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <div className="form-item full-width">
                  <MdTextField
                    label="프로그램 제목 *"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    required
                    error={!!errors.title}
                    errorText={errors.title?.message}
                  />
                </div>
              )}
            />
            <Controller
              name="sponsorId"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdSelect
                    label="스폰서 *"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    required
                    error={!!errors.sponsorId}
                    errorText={errors.sponsorId?.message}
                  >
                    <MdSelectOption value="">
                      <div slot="headline">선택해주세요</div>
                    </MdSelectOption>
                    {sponsorStore.sponsors.map(sponsor => (
                      <MdSelectOption key={sponsor.id} value={sponsor.id}>
                        <div slot="headline">{sponsor.name}</div>
                      </MdSelectOption>
                    ))}
                  </MdSelect>
                </div>
              )}
            />
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdSelect
                    label="유형 *"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    required
                    error={!!errors.type}
                    errorText={errors.type?.message}
                  >
                    <MdSelectOption value="online">
                      <div slot="headline">온라인</div>
                    </MdSelectOption>
                    <MdSelectOption value="offline">
                      <div slot="headline">오프라인</div>
                    </MdSelectOption>
                    <MdSelectOption value="hybrid">
                      <div slot="headline">혼합형</div>
                    </MdSelectOption>
                  </MdSelect>
                </div>
              )}
            />
            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdSelect
                    label="형태 *"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    required
                    error={!!errors.format}
                    errorText={errors.format?.message}
                  >
                    <MdSelectOption value="workshop">
                      <div slot="headline">워크샵</div>
                    </MdSelectOption>
                    <MdSelectOption value="seminar">
                      <div slot="headline">세미나</div>
                    </MdSelectOption>
                    <MdSelectOption value="course">
                      <div slot="headline">코스</div>
                    </MdSelectOption>
                    <MdSelectOption value="lecture">
                      <div slot="headline">강의</div>
                    </MdSelectOption>
                    <MdSelectOption value="other">
                      <div slot="headline">기타</div>
                    </MdSelectOption>
                  </MdSelect>
                </div>
              )}
            />
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div className="form-item">
                  <MdSelect
                    label="상태 *"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    required
                    error={!!errors.status}
                    errorText={errors.status?.message}
                  >
                    <MdSelectOption value="pending">
                      <div slot="headline">대기중</div>
                    </MdSelectOption>
                    <MdSelectOption value="active">
                      <div slot="headline">진행중</div>
                    </MdSelectOption>
                    <MdSelectOption value="inactive">
                      <div slot="headline">비활성</div>
                    </MdSelectOption>
                  </MdSelect>
                </div>
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <div className="form-item full-width">
                  <MdTextField
                    label="설명"
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    error={!!errors.description}
                    errorText={errors.description?.message}
                    helperText="프로그램에 대한 상세 설명을 입력하세요"
                  />
                </div>
              )}
            />
          </div>
        </div>

        {/* 기간 정보 섹션 */}
        <div className="form-section">
          <h2>기간 정보</h2>
          <div className="form-grid">
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <div className="form-item">
                        <MdTextField
                          label="시작일 *"
                          value={field.value}
                          onChange={value => field.onChange(value)}
                          required
                          error={!!errors.startDate}
                          errorText={errors.startDate?.message}
                          placeholder="YYYY-MM-DD"
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <div className="form-item">
                        <MdTextField
                          label="종료일 *"
                          value={field.value}
                          onChange={value => field.onChange(value)}
                          required
                          error={!!errors.endDate}
                          errorText={errors.endDate?.message}
                          placeholder="YYYY-MM-DD"
                        />
                      </div>
                    )}
                  />
          </div>
        </div>

        {/* 회차 정보 섹션 */}
        <div className="form-section">
          <div className="section-header">
            <h2>회차 정보</h2>
            <CustomButton
              variant="secondary"
              type="button"
              onClick={handleAddRound}
              disabled={watchedRounds.length >= 100}
            >
              + 회차 추가
            </CustomButton>
          </div>
          {errors.rounds && (
            <div className="form-error">{errors.rounds.message || errors.rounds.root?.message}</div>
          )}
          <div className="rounds-list">
            {fields.map((field, index) => (
              <div key={field.id} className="round-item">
                <div className="round-header">
                  <h3>{watchedRounds[index]?.roundNumber || index + 1}회차</h3>
                  {watchedRounds.length > 1 && (
                    <CustomButton
                      variant="tertiary"
                      type="button"
                      onClick={() => handleRemoveRound(index)}
                    >
                      삭제
                    </CustomButton>
                  )}
                </div>
                <div className="round-form-grid">
                  <Controller
                    name={`rounds.${index}.roundNumber`}
                    control={control}
                    render={({ field }) => (
                      <div className="form-item">
                        <MdTextField
                          label="회차 번호 *"
                          type="number"
                          value={String(field.value || '')}
                          onChange={value => field.onChange(parseInt(value, 10) || 0)}
                          required
                          error={!!errors.rounds?.[index]?.roundNumber}
                          errorText={errors.rounds?.[index]?.roundNumber?.message}
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name={`rounds.${index}.startDate`}
                    control={control}
                    render={({ field }) => (
                      <div className="form-item">
                        <MdTextField
                          label="시작일 *"
                          value={field.value}
                          onChange={value => field.onChange(value)}
                          required
                          error={!!errors.rounds?.[index]?.startDate}
                          errorText={errors.rounds?.[index]?.startDate?.message}
                          placeholder="YYYY-MM-DD"
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name={`rounds.${index}.endDate`}
                    control={control}
                    render={({ field }) => (
                      <div className="form-item">
                        <MdTextField
                          label="종료일 *"
                          value={field.value}
                          onChange={value => field.onChange(value)}
                          required
                          error={!!errors.rounds?.[index]?.endDate}
                          errorText={errors.rounds?.[index]?.endDate?.message}
                          placeholder="YYYY-MM-DD"
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name={`rounds.${index}.capacity`}
                    control={control}
                    render={({ field }) => (
                      <div className="form-item">
                        <MdTextField
                          label="정원 (명)"
                          type="number"
                          value={field.value ? String(field.value) : ''}
                          onChange={value => {
                            const numValue = value ? parseInt(value, 10) : undefined
                            field.onChange(numValue)
                          }}
                          error={!!errors.rounds?.[index]?.capacity}
                          errorText={errors.rounds?.[index]?.capacity?.message}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 폼 액션 */}
        <div className="form-actions">
          <CustomButton variant="secondary" type="button" onClick={() => navigate('/programs')} disabled={isLoading}>
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

