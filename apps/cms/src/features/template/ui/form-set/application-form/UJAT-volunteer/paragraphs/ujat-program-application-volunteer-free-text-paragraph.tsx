import type { CSSProperties } from 'react'
import { CmsTextArea } from '@/shared/ui/cms-textarea'

type FreeTextQuestion = {
  label: string
  hint?: string
  placeholder?: string
}

const FREE_TEXT_QUESTIONS: readonly FreeTextQuestion[] = [
  { label: '1. 자기소개 및 지원동기를 자유롭게 작성해 주세요.' },
  { label: '2. 교육봉사, 강사 아르바이트 등 교육 진행 경험을 간략히 적어주세요.' },
  { label: '3. 초등학생 대상 경제 교육의 필요성에 대해 본인의 생각을 자유롭게 작성해 주세요.' },
  {
    label:
      '4. 초·중·고 당시 학교에서 JA Korea 경제금융교육을 들은 경험 혹은 진행하는 프로그램에 지원하여 참여한 경험 등을 간략하게 적어 주세요.',
    hint: "(경험이 없을 경우 '없음'으로 작성해 주세요.)",
  },
]

const DEFAULT_PLACEHOLDER = '자유롭게 작성해 주세요'

const cardStyle: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  borderRadius: 'var(--8, 8px)',
  border: '1px solid var(--table-line, #e0e0e0)',
  background: 'var(--main-WT, #fff)',
  overflow: 'hidden',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  padding: '12px 20px',
  borderBottom: '1px solid var(--table-line, #e0e0e0)',
  background:
    'linear-gradient(0deg, rgba(231, 235, 239, 0.6) 0%, rgba(231, 235, 239, 0.6) 100%), var(--main-WT, #fff)',
}

const headerLabelStyle: CSSProperties = {
  color: 'var(--main-BK, #3d3d3d)',
  fontFamily: 'Pretendard, system-ui, sans-serif',
  fontSize: 15,
  fontWeight: 600,
  lineHeight: '150%',
}

const headerHintStyle: CSSProperties = {
  color: 'var(--disabled-txt, rgba(61, 61, 61, 0.5))',
  fontFamily: 'Pretendard, system-ui, sans-serif',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '150%',
}

const bodyStyle: CSSProperties = {
  padding: '16px 20px',
}

/** UJAT 프로그램 봉사자 신청 폼 — 자유 작성 항목 */
export function UjatProgramApplicationVolunteerFreeTextParagraph() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {FREE_TEXT_QUESTIONS.map((q, idx) => (
        <div key={idx} style={cardStyle}>
          <div style={headerStyle}>
            <span style={headerLabelStyle}>{q.label}</span>
            {q.hint ? <span style={headerHintStyle}>{q.hint}</span> : null}
          </div>
          <div style={bodyStyle}>
            <CmsTextArea
              inputSize="medium"
              rows={3}
              placeholder={q.placeholder ?? DEFAULT_PLACEHOLDER}
              width="100%"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
