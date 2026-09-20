import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getUserInfoSelectedEntries,
  isUserInfoParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import { getMypageProfileLabel } from '@/features/mypage/lib/member-profile'
import { useSettingsView } from '@/features/mypage/settings/hooks/use-settings-view'
import { PFAlertModal, PFButton } from '@/shared/ui'
import {
  createEducationSurveySeedDraft,
  EDUCATION_SURVEY_SEED_CREATED_AT,
  type EducationSatisfactionAudience,
  type EducationSurveySeedKind,
} from '../lib/seed-survey-draft'
import { getMockEducationSurveyList } from '../lib/mock-survey-list'
import {
  formatEducationPeriodLabel,
  resolveSurveyUserInfoValues,
  type SurveyUserInfoProgramContext,
} from '../lib/resolve-user-info-values'
import { EMPTY_SURVEY_SIDECAR, type SurveySidecarState } from '../lib/survey-sidecar'
import { EducationSurveyFormBody } from './survey-form-body'
import { EducationSurveyHeader } from './survey-header'
import { EducationSurveyList } from './survey-list'
import styles from './fill-panel.module.css'

export type EducationSurveyFillPanelProps = {
  programTitle: string
  kind: EducationSurveySeedKind
  /** satisfaction 전용 — education/volunteer: student, lecture: teacher */
  satisfactionAudience?: EducationSatisfactionAudience
  /** 교육 진행 일정 등 프로그램 컨텍스트 (설문자 정보 자동 채움) */
  educationScheduleLines?: readonly string[]
  educationTargetLabel?: string
  educationGradeLabel?: string
  institutionName?: string
  institutionRegion?: string
}

export function EducationSurveyFillPanel({
  programTitle,
  kind,
  satisfactionAudience,
  educationScheduleLines,
  educationTargetLabel,
  educationGradeLabel,
  institutionName,
  institutionRegion,
}: EducationSurveyFillPanelProps) {
  const surveyList = useMemo(() => getMockEducationSurveyList(kind), [kind])
  const showList = surveyList.length >= 2
  const [selectedId, setSelectedId] = useState(() => surveyList[0]?.id ?? '')

  const selectedEntry = useMemo(
    () => surveyList.find(entry => entry.id === selectedId) ?? surveyList[0],
    [surveyList, selectedId],
  )

  const [draft, setDraft] = useState<WritingFormDraft>(() =>
    createEducationSurveySeedDraft(kind, {
      satisfactionAudience,
      listEntry: selectedEntry,
    }),
  )
  const [sidecar, setSidecar] = useState<SurveySidecarState>(EMPTY_SURVEY_SIDECAR)
  const [alertOpen, setAlertOpen] = useState(false)

  // 목록 선택 변경 시 draft·sidecar 교체
  useEffect(() => {
    if (selectedEntry == null) return
    setDraft(
      createEducationSurveySeedDraft(kind, {
        satisfactionAudience,
        listEntry: selectedEntry,
      }),
    )
    setSidecar(EMPTY_SURVEY_SIDECAR)
  }, [kind, satisfactionAudience, selectedEntry])

  const member = useMypageMember()
  const settings = useSettingsView()

  const programContext = useMemo<SurveyUserInfoProgramContext>(
    () => ({
      programTitle,
      educationPeriodLabel: formatEducationPeriodLabel(educationScheduleLines),
      applicantTypeLabel: getMypageProfileLabel(member.profile),
      educationTarget: educationTargetLabel,
      educationGrade: educationGradeLabel,
      institutionName,
      institutionRegion,
    }),
    [
      programTitle,
      educationScheduleLines,
      member.profile,
      educationTargetLabel,
      educationGradeLabel,
      institutionName,
      institutionRegion,
    ],
  )

  const userInfoFieldKeys = useMemo(() => {
    const keys: string[] = []
    for (const paragraph of draft.paragraphs) {
      if (!isUserInfoParagraph(paragraph)) continue
      for (const entry of getUserInfoSelectedEntries(paragraph)) {
        keys.push(entry.key)
      }
    }
    return keys
  }, [draft.paragraphs])

  const userInfoValues = useMemo(
    () =>
      resolveSurveyUserInfoValues(userInfoFieldKeys, {
        profile: settings.profile,
        program: programContext,
      }),
    [userInfoFieldKeys, settings.profile, programContext],
  )

  useEffect(() => {
    setDraft(prev => {
      let changed = false
      const paragraphs = prev.paragraphs.map(paragraph => {
        if (!isUserInfoParagraph(paragraph)) return paragraph
        const entries = getUserInfoSelectedEntries(paragraph)
        if (entries.length === 0) return paragraph

        const nextAnswers = { ...paragraph.fieldAnswers }
        let paragraphChanged = false
        for (const entry of entries) {
          const next = userInfoValues[entry.key] ?? ''
          if (nextAnswers[entry.key] !== next) {
            nextAnswers[entry.key] = next
            paragraphChanged = true
          }
        }
        if (!paragraphChanged) return paragraph
        changed = true
        return { ...paragraph, fieldAnswers: nextAnswers }
      })
      return changed ? { ...prev, paragraphs } : prev
    })
  }, [userInfoValues])

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

  const submitDescription =
    kind === 'satisfaction' ? '만족도조사가 제출되었습니다.' : '설문이 제출되었습니다.'

  const surveyCreatedAt =
    selectedEntry?.createdAt ?? selectedEntry?.startAt ?? EDUCATION_SURVEY_SEED_CREATED_AT

  const body = (
    <div className={styles.body}>
      {titleParagraph ? (
        <EducationSurveyHeader paragraph={titleParagraph} surveyCreatedAt={surveyCreatedAt} />
      ) : null}

      <EducationSurveyFormBody
        draft={draft}
        programTitle={programTitle}
        onUpdateParagraph={updateParagraph}
        sidecar={sidecar}
        onSidecarChange={setSidecar}
        userInfoValues={userInfoValues}
      />

      <div className={styles.actions}>
        <PFButton size="xlarge" width={240} type="button" onClick={handleSubmit}>
          제출하기
        </PFButton>
      </div>
    </div>
  )

  return (
    <>
      <div className={styles.shell}>
        <div className={showList ? styles.layoutWithList : styles.inner}>
          {showList ? (
            <>
              <EducationSurveyList
                items={surveyList}
                selectedId={selectedEntry?.id ?? selectedId}
                onSelect={setSelectedId}
              />
              {body}
            </>
          ) : (
            body
          )}
        </div>
      </div>

      <PFAlertModal
        open={alertOpen}
        title="안내"
        description={submitDescription}
        onConfirm={() => setAlertOpen(false)}
      />
    </>
  )
}
