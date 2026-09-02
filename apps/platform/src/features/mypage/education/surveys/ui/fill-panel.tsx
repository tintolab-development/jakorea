import { useCallback, useMemo, useState } from 'react'
import type { WritingFormDraft, WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PFAlertModal, PFButton } from '@/shared/ui'
import { createEducationSurveyMockDraft } from '../lib/mock-survey-draft'
import { EducationSurveyFormBody } from './survey-form-body'
import { EducationSurveyHeader } from './survey-header'
import type { SurveySidecarState } from './platform-survey-paragraph-body'
import styles from './fill-panel.module.css'

export type EducationSurveyFillPanelProps = {
  programTitle: string
}

const EMPTY_SIDECAR: SurveySidecarState = {
  dateValues: {},
  timeValues: {},
  fileNames: {},
}

export function EducationSurveyFillPanel({ programTitle }: EducationSurveyFillPanelProps) {
  const [draft, setDraft] = useState<WritingFormDraft>(() => createEducationSurveyMockDraft())
  const [sidecar, setSidecar] = useState<SurveySidecarState>(EMPTY_SIDECAR)
  const [alertOpen, setAlertOpen] = useState(false)

  const titleParagraph = useMemo(
    () =>
      draft.paragraphs.find(
        (paragraph): paragraph is Extract<
          WritingFormParagraph,
          { kind: 'description'; variant: 'survey_title_with_period' }
        > =>
          paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period',
      ),
    [draft.paragraphs],
  )

  const updateParagraph = useCallback<FormUpdateParagraph>((id, updater) => {
    setDraft(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.map(paragraph => (paragraph.id === id ? updater(paragraph) : paragraph)),
    }))
  }, [])

  const handleSubmit = () => {
    setAlertOpen(true)
  }

  return (
    <>
      <div className={styles.shell}>
        <div className={styles.inner}>
          {titleParagraph ? <EducationSurveyHeader paragraph={titleParagraph} /> : null}

          <EducationSurveyFormBody
            draft={draft}
            programTitle={programTitle}
            onUpdateParagraph={updateParagraph}
            sidecar={sidecar}
            onSidecarChange={setSidecar}
          />

          <div className={styles.actions}>
            <PFButton size="xlarge" width={240} type="button" onClick={handleSubmit}>
              제출하기
            </PFButton>
          </div>
        </div>
      </div>

      <PFAlertModal
        open={alertOpen}
        title="안내"
        description="설문이 제출되었습니다."
        onConfirm={() => setAlertOpen(false)}
      />
    </>
  )
}
