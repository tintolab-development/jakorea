/**
 * 1사1교 기관 신청 상세 — 진행 희망 교육 일정 (Figma 4175:106433)
 * ■ N지망 소제목 + 지망별 표(희망 교육일 및 차시 / N차시 희망 교육 시간, 2차시면 한 행 2칸)
 */
import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import type { CompanySchoolScheduleBlock } from '@/features/program/1c-1s/lib/company-school-preferred-schedule-blocks'
import './company-school-preferred-schedule-section.css'

function renderSegments(segments: readonly string[]): ReactNode {
  if (segments.length === 0) return '-'
  if (segments.length === 1) return segments[0]
  return <ProgramDetailTdSegmentWrap>{withProgramDetailTdDivider([...segments])}</ProgramDetailTdSegmentWrap>
}

export function CompanySchoolPreferredScheduleSection({
  title = '진행 희망 교육 일정',
  blocks,
}: {
  title?: string
  blocks: readonly CompanySchoolScheduleBlock[]
}) {
  return (
    <section className="detail-info-form company-school-preferred-schedule" aria-label={title}>
      <header className="detail-info-form__header">
        <div className="detail-info-form__header-lead">
          <h2 className="detail-info-form__title">{title}</h2>
        </div>
      </header>
      <div className="company-school-preferred-schedule__list">
        {blocks.map(block => (
          <div className="company-school-preferred-schedule__block" key={block.key}>
            <p className="company-school-preferred-schedule__rank">{block.rankLabel}</p>
            <DetailInfoForm title={block.rankLabel} hideHeader mode="view">
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="희망 교육일 및 차시"
                  fullRow
                  readOnlyDisplay
                  view={renderSegments(block.dateSegments)}
                />
              </DetailInfoForm.Row>
              {block.timeRows.map(row =>
                row.length === 2 ? (
                  <DetailInfoForm.Row type="double" key={row[0]!.key}>
                    {row.map(cell => (
                      <DetailInfoForm.Field
                        key={cell.key}
                        label={cell.label}
                        readOnlyDisplay
                        view={renderSegments(cell.segments)}
                      />
                    ))}
                  </DetailInfoForm.Row>
                ) : (
                  <DetailInfoForm.Row type="single" key={row[0]!.key}>
                    <DetailInfoForm.Field
                      label={row[0]!.label}
                      fullRow
                      readOnlyDisplay
                      view={renderSegments(row[0]!.segments)}
                    />
                  </DetailInfoForm.Row>
                )
              )}
            </DetailInfoForm>
          </div>
        ))}
      </div>
    </section>
  )
}
