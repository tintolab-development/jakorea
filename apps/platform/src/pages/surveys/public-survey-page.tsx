import { useCallback, useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import {
  isUserInfoParagraph,
  type WritingFormDraft,
} from '@jakorea/form-schema/writing-form'
import { writingFormDraftFromApplicationForm } from '@/features/program/lib/application-form-draft'
import {
  buildEducationSurveyAnswers,
  validateEducationSurveyFill,
} from '@/features/mypage/education/surveys/lib/survey-answers'
import {
  EMPTY_SURVEY_SIDECAR,
  type SurveySidecarState,
} from '@/features/mypage/education/surveys/lib/survey-sidecar'
import {
  EducationSurveyFormBody,
  PUBLIC_SURVEY_REQUIRED_USER_INFO_FIELD_KEYS,
} from '@/features/mypage/education/surveys/ui/survey-form-body'
import { EducationSurveyHeader } from '@/features/mypage/education/surveys/ui/survey-header'
import { EducationSurveySubmitConfirm } from '@/features/mypage/education/surveys/ui/submit-confirm'
import { PFAlertModal, PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import { platformQueryKeys } from '@/shared/api/query-keys'
import {
  fetchPublicSurveyForm,
  publicSurveySubmitMatchesForm,
  resolvePublicSurveyKind,
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
    case 'PUBLIC_SURVEY_FORM_TYPE_NOT_ALLOWED':
      return '현재 설문을 불러올 수 없습니다. 관리자에게 문의해 주세요.'
    default:
      return '설문을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }
}

function getPublicSurveySubmitErrorMessage(error: unknown): string {
  switch (readPublicSurveyErrorCode(error)) {
    case 'FORM_ANSWER_REQUIRED':
      return '필수 문항에 답변해 주세요.'
    case 'FORM_ANSWER_NOT_ALLOWED':
      return '제출할 수 없는 항목이 포함되어 있습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.'
    case 'FORM_SUBMISSION_NOT_STARTED':
      return '아직 설문 작성 기간이 시작되지 않았습니다.'
    case 'FORM_SUBMISSION_CLOSED':
      return '설문 작성 기간이 종료되어 제출할 수 없습니다.'
    case 'PUBLIC_SURVEY_NOT_FOUND':
      return '유효하지 않거나 삭제된 설문 링크입니다.'
    default:
      return '설문 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  }
}

function stripPublicSurveyUserInfoAnswers(draft: WritingFormDraft): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph =>
      isUserInfoParagraph(paragraph) ? { ...paragraph, fieldAnswers: {} } : paragraph
    ),
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successAlertOpen, setSuccessAlertOpen] = useState(false)

  const surveyQuery = useQuery({
    queryKey: platformQueryKeys.publicSurvey.form(token),
    queryFn: ({ signal }) => fetchPublicSurveyForm(token, signal),
    enabled: token.length > 0,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const remoteDraft = useMemo(() => {
    if (!surveyQuery.data?.form) return null
    const fromForm = writingFormDraftFromApplicationForm(surveyQuery.data.form)
    if (!fromForm) return null
    return stripPublicSurveyUserInfoAnswers(fromForm)
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
    onSuccess: submitted => {
      setConfirmOpen(false)
      const form = surveyQuery.data
      if (form && !publicSurveySubmitMatchesForm(form, submitted)) {
        setSubmitError('제출이 올바른 설문에 저장되지 않았습니다. 관리자에게 문의해 주세요.')
        return
      }
      setSubmitError(null)
      setSuccessAlertOpen(true)
    },
    onError: error => {
      setConfirmOpen(false)
      setSubmitError(getPublicSurveySubmitErrorMessage(error))
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

  const surveyKind = resolvePublicSurveyKind(surveyQuery.data?.formType)

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
            {surveyKind === 'satisfaction'
              ? '만족도조사에 참여해 주셔서 감사합니다.'
              : '설문에 참여해 주셔서 감사합니다.'}
          </PFText>
        </div>
      </main>
    )
  }

  const titleParagraph = draft.paragraphs.find(
    paragraph =>
      paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period'
  )
  const programTitle =
    titleParagraph?.surveyTitle?.trim() ||
    (surveyKind === 'satisfaction' ? '만족도조사' : '설문조사')

  const handleSubmit = () => {
    if (submitMutation.isPending) return
    setSubmitError(null)
    const validation = validateEducationSurveyFill(draft, sidecar, {
      requireUserInfoAnswers: true,
      requiredUserInfoFieldKeys: PUBLIC_SURVEY_REQUIRED_USER_INFO_FIELD_KEYS,
    })
    if (!validation.ok) {
      setSubmitError(validation.message)
      return
    }
    setConfirmOpen(true)
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
          userInfoEditable
          userInfoRequiredFieldKeys={PUBLIC_SURVEY_REQUIRED_USER_INFO_FIELD_KEYS}
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
      <EducationSurveySubmitConfirm
        open={confirmOpen}
        kind={surveyKind}
        pending={submitMutation.isPending}
        onCancel={() => {
          if (submitMutation.isPending) return
          setConfirmOpen(false)
        }}
        onConfirm={() => {
          if (submitMutation.isPending) return
          submitMutation.mutate(buildEducationSurveyAnswers(draft, sidecar))
        }}
      />
      <PFAlertModal
        open={successAlertOpen}
        title="안내"
        description={
          surveyKind === 'satisfaction'
            ? '만족도조사가 제출되었습니다.'
            : '설문이 제출되었습니다.'
        }
        onConfirm={() => {
          setSuccessAlertOpen(false)
          setSubmitted(true)
        }}
      />
    </main>
  )
}
