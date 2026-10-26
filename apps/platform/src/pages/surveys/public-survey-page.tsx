import { useCallback, useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { writingFormDraftFromApplicationForm } from '@/features/program/lib/application-form-draft'
import {
  buildEducationSurveyAnswers,
  validateEducationSurveyFill,
} from '@/features/mypage/education/surveys/lib/survey-answers'
import {
  EMPTY_SURVEY_SIDECAR,
  type SurveySidecarState,
} from '@/features/mypage/education/surveys/lib/survey-sidecar'
import { EducationSurveyFormBody } from '@/features/mypage/education/surveys/ui/survey-form-body'
import { EducationSurveyHeader } from '@/features/mypage/education/surveys/ui/survey-header'
import { PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import { platformQueryKeys } from '@/shared/api/query-keys'
import {
  fetchPublicSurveyForm,
  submitPublicSurveyResponse,
} from '@/features/public-survey/api/client'
import styles from './public-survey-page.module.css'

function readPublicSurveyErrorCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined
  const data = error.response?.data
  if (!data || typeof data !== 'object') return undefined
  const body = data as { error?: { code?: unknown }; code?: unknown }
  if (typeof body.error?.code === 'string') return body.error.code.trim().toUpperCase()
  if (typeof body.code === 'string') return body.code.trim().toUpperCase()
  return undefined
}

function getPublicSurveyErrorMessage(error: unknown): string {
  switch (readPublicSurveyErrorCode(error)) {
    case 'PUBLIC_SURVEY_NOT_FOUND':
      return '유효하지 않거나 삭제된 설문 링크입니다.'
    case 'FORM_SUBMISSION_NOT_STARTED':
      return '아직 설문 작성 기간이 시작되지 않았습니다.'
    case 'FORM_SUBMISSION_CLOSED':
      return '설문 작성 기간이 종료되었습니다.'
    case 'FORM_TEMPLATE_VERSION_NOT_PUBLISHED':
    case 'FORM_BINDING_NOT_FOUND':
      return '현재 설문을 불러올 수 없습니다. 관리자에게 문의해 주세요.'
    default:
      return '설문을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }
}

function PublicSurveyState({ message }: { message: string }) {
  return (
    <main className={styles.page}>
      <div className={styles.state} role="status">
        <PFText as="h1" typo="hl-lg" color="black">
          설문조사
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="neutral-cool-600">
          {message}
        </PFText>
      </div>
    </main>
  )
}

export function PublicSurveyPage() {
  const { shareToken = '' } = useParams<{ shareToken: string }>()
  const token = shareToken.trim()
  const [draft, setDraft] = useState<WritingFormDraft | null>(null)
  const [sidecar, setSidecar] = useState<SurveySidecarState>(EMPTY_SURVEY_SIDECAR)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const surveyQuery = useQuery({
    queryKey: platformQueryKeys.publicSurvey.form(token),
    queryFn: ({ signal }) => fetchPublicSurveyForm(token, signal),
    enabled: token.length > 0,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const remoteDraft = useMemo(() => {
    if (!surveyQuery.data?.form) return null
    return writingFormDraftFromApplicationForm(surveyQuery.data.form)
  }, [surveyQuery.data?.form])

  useEffect(() => {
    if (!remoteDraft) return
    setDraft(remoteDraft)
    setSidecar(EMPTY_SURVEY_SIDECAR)
    setSubmitError(null)
    setSubmitted(false)
  }, [remoteDraft])

  const submitMutation = useMutation({
    mutationFn: (answers: Record<string, unknown>) => submitPublicSurveyResponse(token, answers),
    onSuccess: () => {
      setSubmitted(true)
      setSubmitError(null)
    },
    onError: error => {
      const code = readPublicSurveyErrorCode(error)
      setSubmitError(
        code === 'FORM_SUBMISSION_CLOSED'
          ? '설문 작성 기간이 종료되어 제출할 수 없습니다.'
          : '설문 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      )
    },
  })

  const updateParagraph = useCallback<FormUpdateParagraph>((id, updater) => {
    setDraft(current =>
      current
        ? {
            ...current,
            paragraphs: current.paragraphs.map(paragraph =>
              paragraph.id === id ? updater(paragraph) : paragraph
            ),
          }
        : current
    )
  }, [])

  if (!token) return <PublicSurveyState message="유효하지 않은 설문 링크입니다." />
  if (surveyQuery.isError) {
    return <PublicSurveyState message={getPublicSurveyErrorMessage(surveyQuery.error)} />
  }
  if (surveyQuery.isPending) {
    return <PFLoadingSpinner centered label="설문을 불러오는 중" />
  }
  if (draft == null) {
    return <PublicSurveyState message="현재 설문을 불러올 수 없습니다. 관리자에게 문의해 주세요." />
  }
  if (submitted) {
    return (
      <main className={styles.page}>
        <div className={styles.state} role="status">
          <PFText as="h1" typo="hl-lg" color="black">
            제출이 완료되었습니다.
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="neutral-cool-600">
            설문에 참여해 주셔서 감사합니다.
          </PFText>
        </div>
      </main>
    )
  }

  const titleParagraph = draft.paragraphs.find(
    paragraph =>
      paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period'
  )
  const programTitle = titleParagraph?.surveyTitle?.trim() || '만족도조사'

  const handleSubmit = () => {
    setSubmitError(null)
    const validation = validateEducationSurveyFill(draft, sidecar)
    if (!validation.ok) {
      setSubmitError(validation.message)
      return
    }
    submitMutation.mutate(buildEducationSurveyAnswers(draft, sidecar))
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        {titleParagraph ? (
          <EducationSurveyHeader paragraph={titleParagraph} />
        ) : (
          <header className={styles.fallbackHeader}>
            <PFText as="h1" typo="hd-sm" color="black">
              {programTitle}
            </PFText>
          </header>
        )}

        <EducationSurveyFormBody
          draft={draft}
          programTitle={programTitle}
          onUpdateParagraph={updateParagraph}
          sidecar={sidecar}
          onSidecarChange={setSidecar}
        />

        {submitError ? (
          <PFText as="p" role="alert" typo="bd-md-rg" color="error" className={styles.error}>
            {submitError}
          </PFText>
        ) : null}

        <div className={styles.actions}>
          <PFButton
            type="button"
            size="xlarge"
            width={240}
            disabled={submitMutation.isPending}
            onClick={handleSubmit}
          >
            {submitMutation.isPending ? '제출 중...' : '제출하기'}
          </PFButton>
        </div>
      </div>
    </main>
  )
}
