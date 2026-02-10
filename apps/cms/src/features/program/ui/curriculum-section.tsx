/**
 * 교육 커리큘럼 섹션 (프로그램 상세 정보 탭)
 * 시안: 행별 라벨 "N회차 강의 분량 및 내용" | 값 "1시간 | 상세 설명"
 */

import type { Program } from '@/types/domain'

/** 회차별 기본 커리큘럼 (시안 기준, 데이터 없을 때 노출) */
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

export interface CurriculumSectionProps {
  program: Program
}

export function CurriculumSection({ program }: CurriculumSectionProps) {
  const sortedRounds = program.rounds?.length
    ? [...program.rounds].sort((a, b) => a.roundNumber - b.roundNumber)
    : []

  return (
    <section className="program-detail-info-tab__section">
      <h3 className="program-detail-info-tab__section-title">교육 커리큘럼</h3>
      <div className="program-detail-info-tab__table-wrapper">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-detail-info-tab__curriculum-table">
          <tbody>
            {sortedRounds.length > 0
              ? sortedRounds.map((round) => {
                  const content = getRoundCurriculumContent(
                    round.roundNumber,
                    round.curriculum,
                    program.curriculum
                  )
                  return (
                    <tr key={round.id}>
                      <th>{round.roundNumber}회차 강의 분량 및 내용</th>
                      <td>{content}</td>
                    </tr>
                  )
                })
              : (
                <tr>
                  <td colSpan={2} className="program-detail-info-tab__curriculum-empty">
                    등록된 회차가 없습니다.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
