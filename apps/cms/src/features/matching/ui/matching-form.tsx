/**
 * 매칭 등록/수정 폼 컴포넌트
 * Phase 3.2: 강사 매칭 관리
 */
/* eslint-disable react-hooks/incompatible-library -- React Hook Form watch 사용 */

import { Form, Select, Button, Space, Card, Alert, List, Tag, Divider } from 'antd'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { matchingFormSchema, type MatchingFormData } from '@/entities/matching/model/schema'
import type { Matching } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { scheduleService } from '@/entities/schedule/api/schedule-service'
import { suggestInstructorCandidates } from '../lib/instructor-candidate'
import {
  runMatchingAlgorithm,
  type MatchingCandidate,
} from '@/entities/matching/lib/matching-algorithm'
import { domainColorsHex } from '@/shared/constants/colors'
import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'

const { Option } = Select

interface MatchingFormProps {
  matching?: Matching
  onSubmit: (data: MatchingFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function MatchingForm({ matching, onSubmit, onCancel, loading }: MatchingFormProps) {
  const defaultValues = useMemo<MatchingFormData>(() => {
    if (matching) {
      return {
        programId: matching.programId,
        roundId: matching.roundId || '',
        instructorId: matching.instructorId,
        scheduleId: matching.scheduleId,
        status: matching.status,
      }
    }
    return {
      programId: '',
      roundId: '',
      instructorId: '',
      scheduleId: undefined,
      status: 'pending',
    }
  }, [matching])

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MatchingFormData>({
    resolver: zodResolver(matchingFormSchema),
    defaultValues,
  })

  // matching prop이 변경될 때 폼 값 업데이트
  useEffect(() => {
    if (matching) {
      reset({
        programId: matching.programId,
        roundId: matching.roundId || '',
        instructorId: matching.instructorId,
        scheduleId: matching.scheduleId,
        status: matching.status,
      })
    } else {
      reset({
        status: 'pending',
      })
    }
  }, [matching, reset])

  const selectedProgramId = watch('programId')
  const selectedRoundId = watch('roundId')
  const [candidates, setCandidates] = useState<ReturnType<typeof suggestInstructorCandidates>>([])
  const [algorithmSuggestions, setAlgorithmSuggestions] = useState<MatchingCandidate[]>([])

  useEffect(() => {
    if (selectedProgramId) {
      const program = programService.getByIdSync(selectedProgramId)
      if (program) {
        const suggested = suggestInstructorCandidates(program)
        setCandidates(suggested.slice(0, 5))
      }
    } else {
      setCandidates([])
    }
  }, [selectedProgramId])

  useEffect(() => {
    if (
      selectedProgramId &&
      selectedRoundId &&
      String(selectedRoundId).trim() !== '' &&
      !matching
    ) {
      const results = runMatchingAlgorithm({
        programId: selectedProgramId,
        roundId: selectedRoundId,
      })
      setAlgorithmSuggestions(results.slice(0, 5))
    } else {
      setAlgorithmSuggestions([])
    }
  }, [selectedProgramId, selectedRoundId, matching])

  const program = selectedProgramId ? programService.getByIdSync(selectedProgramId) : null
  const round =
    program && selectedRoundId ? program.rounds.find(r => r.id === selectedRoundId) : null
  const availableSchedules = selectedRoundId
    ? scheduleService.getAllSync().filter(s => s.roundId === selectedRoundId)
    : []

  const onFormSubmit = async (data: MatchingFormData) => {
    await onSubmit(data)
  }

  return (
    <Form onFinish={handleSubmit(onFormSubmit)} layout="vertical">
      <Form.Item
        label="프로그램"
        required
        validateStatus={errors.programId ? 'error' : ''}
        help={errors.programId?.message}
      >
        <Select
          value={watch('programId')}
          onChange={value => {
            setValue('programId', value)
            setValue('roundId', '') // 프로그램 변경 시 회차 초기화
            setValue('scheduleId', undefined) // 일정 초기화
          }}
          placeholder="프로그램 선택"
          disabled={!!matching}
        >
          {programService.getAllSync().map(p => (
            <Option key={p.id} value={p.id}>
              {p.title}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {program && (
        <Form.Item
          label="회차"
          required
          validateStatus={errors.roundId ? 'error' : ''}
          help={errors.roundId?.message}
        >
          <Select
            value={watch('roundId')}
            onChange={value => {
              setValue('roundId', value)
              setValue('scheduleId', undefined) // 회차 변경 시 일정 초기화
            }}
            placeholder="회차 선택"
            disabled={!!matching}
          >
            {program.rounds.map(round => (
              <Option key={round.id} value={round.id}>
                {round.roundNumber}회차 ({dayjs(round.startDate).format('YYYY-MM-DD')} ~{' '}
                {dayjs(round.endDate).format('YYYY-MM-DD')})
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {round && availableSchedules.length > 0 && (
        <Form.Item
          label="일정 (선택사항)"
          validateStatus={errors.scheduleId ? 'error' : ''}
          help={errors.scheduleId?.message}
        >
          <Select
            value={watch('scheduleId')}
            onChange={value => setValue('scheduleId', value)}
            placeholder="일정 선택"
            allowClear
          >
            {availableSchedules.map(schedule => (
              <Option key={schedule.id} value={schedule.id}>
                {schedule.title} (
                {typeof schedule.date === 'string'
                  ? schedule.date
                  : dayjs(schedule.date).format('YYYY-MM-DD')}{' '}
                {schedule.startTime} - {schedule.endTime})
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {algorithmSuggestions.length > 0 && !matching && (
        <Card
          title="자동 매칭 제안 (학교·지역·일정 기반)"
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Alert
            message="프로그램·회차에 맞는 강사–일정 매칭 후보입니다. 클릭하면 강사와 일정이 자동 입력됩니다."
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
          />
          <List
            size="small"
            dataSource={algorithmSuggestions}
            renderItem={item => (
              <List.Item
                style={{ cursor: 'pointer', padding: '8px 12px' }}
                onClick={() => {
                  setValue('instructorId', item.instructor.id)
                  setValue('scheduleId', item.schedule.id)
                }}
              >
                <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                  <Space wrap>
                    <span style={{ fontWeight: 500 }}>{item.instructor.name}</span>
                    <Tag color={domainColorsHex.instructor.primary}>{item.instructor.region}</Tag>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {item.schedule.title} ·{' '}
                      {typeof item.schedule.date === 'string'
                        ? item.schedule.date
                        : dayjs(item.schedule.date).format('YYYY-MM-DD')}
                    </span>
                  </Space>
                  <Tag color={domainColorsHex.matching.primary}>점수: {item.score}</Tag>
                </Space>
                {item.reasons.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                    {item.reasons.slice(0, 3).join(' · ')}
                  </div>
                )}
              </List.Item>
            )}
          />
        </Card>
      )}

      {candidates.length > 0 && !matching && (
        <Card title="강사 후보 추천" size="small" style={{ marginBottom: 16 }}>
          <Alert
            message="프로그램에 적합한 강사 후보를 추천합니다"
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
          />
          <List
            size="small"
            dataSource={candidates}
            renderItem={candidate => (
              <List.Item
                style={{ cursor: 'pointer', padding: '8px 12px' }}
                onClick={() => setValue('instructorId', candidate.id)}
              >
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <span style={{ fontWeight: 500 }}>{candidate.name}</span>
                    <Tag color={domainColorsHex.instructor.primary}>{candidate.region}</Tag>
                    {candidate.rating && (
                      <Tag color={domainColorsHex.matching.primary}>
                        평점: {candidate.rating.toFixed(1)}
                      </Tag>
                    )}
                    <Tag color={domainColorsHex.sponsor.primary}>
                      매칭점수: {candidate.matchScore}
                    </Tag>
                  </Space>
                  {watch('instructorId') === candidate.id && (
                    <Tag color={domainColorsHex.matching.primary}>선택됨</Tag>
                  )}
                </Space>
                {candidate.matchReasons.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                    {candidate.matchReasons.join(', ')}
                  </div>
                )}
              </List.Item>
            )}
          />
        </Card>
      )}

      <Form.Item
        label="강사"
        required
        validateStatus={errors.instructorId ? 'error' : ''}
        help={errors.instructorId?.message}
      >
        <Select
          value={watch('instructorId')}
          onChange={value => setValue('instructorId', value)}
          placeholder="강사 선택"
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) => {
            const text = String(option?.children || '')
            return text.toLowerCase().includes(input.toLowerCase())
          }}
        >
          {instructorService.getAllSync().map(instructor => (
            <Option key={instructor.id} value={instructor.id}>
              {instructor.name} ({instructor.region}) - {instructor.specialty.join(', ')}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="상태"
        required
        validateStatus={errors.status ? 'error' : ''}
        help={errors.status?.message}
      >
        <Select value={watch('status')} onChange={value => setValue('status', value)}>
          <Option value="pending">대기</Option>
          <Option value="active">확정</Option>
          <Option value="completed">완료</Option>
          <Option value="cancelled">취소</Option>
        </Select>
      </Form.Item>

      <Divider />

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {matching ? '수정' : '등록'}
          </Button>
          <Button onClick={onCancel}>취소</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
