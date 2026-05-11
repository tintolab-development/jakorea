import { Fragment, useMemo, useState } from 'react'
import '@/features/template/ui/paragraph/single-item/user-info.css'
import './ujat-program-application-preferred-education-schedule-paragraph.css'
import { ProgramApplicationScheduleTemplateHintParagraph } from '@/features/template/ui/form-set/application-form/shared/paragraphs/program-application-schedule-template-hint-paragraph'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/paragraph-body-interaction-mode'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

/** 템플릿 편집(authoring) — 교육 진행 희망일 값 영역 */
const AUTHORING_PREFERRED_DATES_HINT = '관리자가 선택한 진행 가능일이 노출됩니다.'

const AUTHORING_SCHEDULE_PLACEHOLDER_HINT =
  '봉사자 모집 폼에서 관리자가 설정한 일정 및 시간대가 노출됩니다.'

/**
 * Mock: 프로그램 등록 > 교육 진행 일정 설정에서 내려올 금요일 후보(추후 API 연동).
 * `paragraphInteractionMode === 'user'`(미리보기 등)에서만 노출.
 */
const MOCK_FRIDAY_SCHEDULE_OPTIONS: readonly { id: string; display: string }[] = (() => {
  const rows: { id: string; display: string }[] = []
  const fridays: Array<[number, number, number]> = [
    [2026, 4, 3],
    [2026, 4, 10],
    [2026, 4, 17],
    [2026, 4, 24],
    [2026, 5, 1],
    [2026, 5, 8],
    [2026, 5, 15],
    [2026, 5, 22],
    [2026, 5, 29],
    [2026, 6, 5],
    [2026, 6, 12],
    [2026, 6, 19],
    [2026, 6, 26],
    [2026, 7, 3],
    [2026, 7, 10],
    [2026, 7, 17],
    [2026, 7, 24],
    [2026, 7, 31],
    [2026, 8, 7],
    [2026, 8, 14],
    [2026, 8, 21],
    [2026, 8, 28],
    [2026, 9, 4],
    [2026, 9, 11],
    [2026, 9, 18],
    [2026, 9, 25],
    [2026, 10, 2],
    [2026, 10, 9],
    [2026, 10, 16],
    [2026, 10, 23],
    [2026, 10, 30],
    [2026, 11, 6],
    [2026, 11, 13],
    [2026, 11, 20],
    [2026, 11, 27],
  ]
  for (const [y, m, d] of fridays) {
    const yy = String(y).slice(-2)
    rows.push({
      id: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      display: `${yy}년 ${m}월 ${d}일(금)`,
    })
  }
  return rows
})()

const INITIAL_SELECTED_IDS = new Set<string>([
  '2026-04-24',
  '2026-05-08',
  '2026-10-30',
  '2026-11-20',
])

function PreferredScheduleSummaryRow({
  paragraphInteractionMode,
  orderedSelected,
}: {
  paragraphInteractionMode: ParagraphBodyInteractionMode
  orderedSelected: readonly { id: string; display: string }[]
}) {
  const editContent =
    paragraphInteractionMode === 'authoring' ? (
      <span className="form-editor-template-field-hint-text">{AUTHORING_PREFERRED_DATES_HINT}</span>
    ) : orderedSelected.length === 0 ? (
      <span className="form-editor-template-field-hint-text">선택된 일정이 없습니다.</span>
    ) : (
      <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
        {orderedSelected.map((o, i) => (
          <Fragment key={o.id}>
            {i > 0 ? <DetailInfoForm.InputsSeparator /> : null}
            <span>{o.display}</span>
          </Fragment>
        ))}
      </div>
    )

  return (
    <div className="ujat-preferred-education-schedule__summary-row">
      <DetailInfoForm title="진행 희망 교육 일정" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="교육 진행 희망일" fullRow edit={editContent} view="-" />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

type UjatProgramApplicationPreferredEducationScheduleParagraphProps = {
  paragraphInteractionMode?: ParagraphBodyInteractionMode
}

/**
 * UJAT 프로그램 학교 신청 폼 — 진행 희망 교육 일정
 * - 템플릿 편집(`authoring`): 봉사자 모집 일정 안내 박스 + 희망일 행 안내 문구
 * - 미리보기 등(`user`): mock 일정 그리드 + 선택 반영
 */
export function UjatProgramApplicationPreferredEducationScheduleParagraph({
  paragraphInteractionMode = 'authoring',
}: UjatProgramApplicationPreferredEducationScheduleParagraphProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(INITIAL_SELECTED_IDS))

  const orderedSelected = useMemo(() => {
    const set = selectedIds
    return MOCK_FRIDAY_SCHEDULE_OPTIONS.filter(o => set.has(o.id))
  }, [selectedIds])

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (paragraphInteractionMode === 'authoring') {
    return (
      <>
        <ProgramApplicationScheduleTemplateHintParagraph
          hintText={AUTHORING_SCHEDULE_PLACEHOLDER_HINT}
        />
        <PreferredScheduleSummaryRow
          paragraphInteractionMode={paragraphInteractionMode}
          orderedSelected={orderedSelected}
        />
      </>
    )
  }

  return (
    <div className="program-registration-paragraph">
      <div className="ujat-preferred-education-schedule__grid-wrap">
        <div className="user-info-grid user-info-grid--edit">
          {MOCK_FRIDAY_SCHEDULE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              className={[
                'user-info-grid__item',
                selectedIds.has(opt.id) ? 'user-info-grid__item--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => toggle(opt.id)}
            >
              {opt.display}
            </button>
          ))}
        </div>
      </div>
      <PreferredScheduleSummaryRow
        paragraphInteractionMode={paragraphInteractionMode}
        orderedSelected={orderedSelected}
      />
    </div>
  )
}
