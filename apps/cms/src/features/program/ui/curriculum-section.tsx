/**
 * 교육 커리큘럼 섹션 (프로그램 상세 정보 탭)
 * 시안: 행별 라벨 "N회차 강의 분량 및 내용" | 값 [온라인/오프라인/온·오프라인] | 시간 | 비고, 디바이더로 구분
 * 수정 모드: react-hook-form 연동, 기존 회차·커리큘럼 값이 default로 채워짐
 */

import { Input, Radio } from 'antd'
import type { Program, RoundDeliveryType } from '@/types/domain'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '../model/program-detail-edit-schema'

const ROUND_DELIVERY_OPTIONS: { value: RoundDeliveryType; label: string }[] = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '온/오프라인' },
]

const ROUND_DELIVERY_LABELS: Record<RoundDeliveryType, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '온/오프라인',
}

const DEFAULT_CURRICULUM_BY_ROUND: string[] = [
  "'개인', '근로자', '소비자' 개념 정의 및 설명",
  '기업과 경제적 개념 이해',
  '의사결정 능력 향상 및 노동 준비에 대한 이해 학습',
  '전체 복습 및 향후 목표 설계',
]

function formatCurriculumCell(text: string): string {
  const t = text.trim()
  if (!t) return '1시간 | (상세 내용 없음)'
  return t.startsWith('1시간') || t.startsWith('1 시간') ? t : `1시간 | ${t}`
}

function parseCurriculumContent(content: string | undefined): {
  duration: string
  description: string
} {
  if (!content?.trim()) return { duration: '1시간', description: '' }
  const sep = content.includes(' | ') ? ' | ' : '|'
  const idx = content.indexOf(sep)
  if (idx === -1) return { duration: '1시간', description: content.trim() }
  return {
    duration: content.slice(0, idx).trim() || '1시간',
    description: content.slice(idx + sep.length).trim(),
  }
}

function getRoundCurriculumContent(
  roundNumber: number,
  roundCurriculum: string | undefined,
  programCurriculum: string | undefined
): string {
  if (roundCurriculum?.trim()) return formatCurriculumCell(roundCurriculum)
  if (programCurriculum?.trim()) return formatCurriculumCell(programCurriculum)
  const defaultDesc = DEFAULT_CURRICULUM_BY_ROUND[roundNumber - 1]
  return defaultDesc ? `1시간 | ${defaultDesc}` : '1시간 | (상세 내용 없음)'
}

/** 조회 모드: 시간 + (온라인|오프라인|온/오프라인) + 설명 */
function formatCurriculumDisplay(
  content: string,
  deliveryType: RoundDeliveryType | undefined
): string {
  const { duration, description } = parseCurriculumContent(content)
  const deliveryLabel = ROUND_DELIVERY_LABELS[deliveryType ?? 'offline']
  return description
    ? `${duration} (${deliveryLabel}) | ${description}`
    : `${duration} (${deliveryLabel})`
}

export interface CurriculumSectionProps {
  program: Program
  isEditMode?: boolean
  /** 수정 모드일 때만 전달 */
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

export function CurriculumSection({ program, isEditMode = false, form }: CurriculumSectionProps) {
  const isFormEdit = isEditMode && form
  const roundsFromForm = isFormEdit ? (form.watch('rounds') ?? []) : []
  const sortedRounds = (isFormEdit ? roundsFromForm : program.rounds)?.length
    ? [...(isFormEdit ? roundsFromForm : program.rounds!)].sort(
        (a, b) => a.roundNumber - b.roundNumber
      )
    : []

  const updateRoundCurriculum = (roundIndex: number, duration: string, description: string) => {
    if (!form) return
    const current = form.getValues('rounds') ?? []
    const value = [duration || '1시간', description].filter(Boolean).join(' | ')
    const nextRounds = current.map((r, i) => (i === roundIndex ? { ...r, curriculum: value } : r))
    form.setValue('rounds', nextRounds)
  }

  const updateRoundDeliveryType = (roundIndex: number, deliveryType: RoundDeliveryType) => {
    if (!form) return
    const current = form.getValues('rounds') ?? []
    const nextRounds = current.map((r, i) =>
      i === roundIndex ? { ...r, deliveryType } : r
    )
    form.setValue('rounds', nextRounds)
  }

  const CurriculumDivider = () => (
    <span
      className="program-detail-info-tab__curriculum-divider"
      role="presentation"
      aria-hidden
    />
  )

  return (
    <>
      <h3 className="program-detail-info-tab__section-title program-detail-info-tab__section-title--block-start">교육 커리큘럼</h3>
      <div className="program-detail-info-tab__table-wrapper">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-detail-info-tab__curriculum-table">
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
          </colgroup>
          <tbody>
            {sortedRounds.length > 0 ? (
              sortedRounds.map((round, sortedIndex) => {
                const content = getRoundCurriculumContent(
                  round.roundNumber,
                  round.curriculum,
                  program.curriculum
                )
                const { duration, description } = parseCurriculumContent(round.curriculum)
                const roundIndex =
                  (isFormEdit ? roundsFromForm : program.rounds)?.findIndex(
                    (r: { id: string }) => r.id === round.id
                  ) ?? sortedIndex

                return (
                  <tr key={round.id}>
                    <th
                      className={
                        isFormEdit && round.roundNumber <= 4
                          ? 'program-detail-info-tab__th--required'
                          : undefined
                      }
                    >
                      {round.roundNumber}회차 강의 분량 및 내용
                      {isEditMode && round.roundNumber <= 4 ? (
                        <span className="program-detail-info-tab__required">*</span>
                      ) : null}
                    </th>
                    <td>
                      {isFormEdit ? (
                        <div className="program-detail-info-tab__curriculum-inputs">
                          <Radio.Group
                            value={round.deliveryType ?? 'offline'}
                            options={ROUND_DELIVERY_OPTIONS}
                            onChange={e =>
                              updateRoundDeliveryType(roundIndex, e.target.value)
                            }
                            className="program-detail-info-tab__curriculum-radio"
                          />
                          <CurriculumDivider />
                          <Input
                            value={duration}
                            onChange={e =>
                              updateRoundCurriculum(roundIndex, e.target.value, description)
                            }
                            placeholder="1시간"
                            className="program-detail-info-tab__curriculum-time-input"
                          />
                          <CurriculumDivider />
                          <Input
                            value={description}
                            onChange={e =>
                              updateRoundCurriculum(roundIndex, duration, e.target.value)
                            }
                            placeholder="비고"
                            className="program-detail-info-tab__curriculum-remarks-input"
                          />
                        </div>
                      ) : (
                        formatCurriculumDisplay(content, round.deliveryType)
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={2} className="program-detail-info-tab__curriculum-empty">
                  등록된 회차가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
