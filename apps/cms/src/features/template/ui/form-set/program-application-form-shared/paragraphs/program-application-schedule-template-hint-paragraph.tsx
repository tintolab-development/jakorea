import '@/features/template/ui/form-editor/form-editor.css'

const SCHEDULE_HINT = '프로그램 등록 / 모집 폼의 설정값에 따라 상이'

/** 프로그램 참여자 신청(개인/학교) 템플릿 편집용 공통 안내 박스 */
export function ProgramApplicationScheduleTemplateHintParagraph() {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: 200,
        boxSizing: 'border-box',
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        alignSelf: 'stretch',
        borderRadius: 8,
        background: 'rgba(61, 61, 61, 0.04)',
      }}
    >
      <span className="form-editor-template-field-hint-text">{SCHEDULE_HINT}</span>
    </div>
  )
}
