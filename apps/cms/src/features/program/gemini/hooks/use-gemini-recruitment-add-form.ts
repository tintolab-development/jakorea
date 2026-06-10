import { useCallback, useEffect, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import {
  loadGeminiRecruitmentAddDraft,
  type GeminiRecruitmentAddFormSnapshot,
} from '../lib/recruitment/add-local-save'

const WYSIWYG_RESET_KEY = 'gemini-visiting-training-recruitment-add'

function toPeriodTuple(
  start: string | null,
  end: string | null
): [Dayjs | null, Dayjs | null] | null {
  if (!start || !end) return null
  const a = dayjs(start)
  const b = dayjs(end)
  if (!a.isValid() || !b.isValid()) return null
  return [a, b]
}

function periodToIso(dates: [Dayjs | null, Dayjs | null] | null): {
  start: string | null
  end: string | null
} {
  const start = dates?.[0]
  const end = dates?.[1]
  if (start == null || end == null) {
    return { start: null, end: null }
  }
  return {
    start: start.startOf('day').toISOString(),
    end: end.startOf('day').toISOString(),
  }
}

function applySnapshot(snapshot: GeminiRecruitmentAddFormSnapshot) {
  return {
    title: snapshot.title ?? '',
    applicationPeriod: toPeriodTuple(
      snapshot.applicationPeriodStart,
      snapshot.applicationPeriodEnd
    ),
    trainingRequestPeriod: toPeriodTuple(
      snapshot.trainingRequestPeriodStart,
      snapshot.trainingRequestPeriodEnd
    ),
    minStudentCount:
      typeof snapshot.minStudentCount === 'number' && Number.isFinite(snapshot.minStudentCount)
        ? snapshot.minStudentCount
        : undefined,
    trainingContentMarkdown: snapshot.trainingContentMarkdown ?? '',
  }
}

export function useGeminiRecruitmentAddForm(open: boolean) {
  const [hydrated, setHydrated] = useState(false)
  const [title, setTitle] = useState('')
  const [applicationPeriod, setApplicationPeriod] = useState<[Dayjs | null, Dayjs | null] | null>(
    null
  )
  const [trainingRequestPeriod, setTrainingRequestPeriod] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null)
  const [minStudentCount, setMinStudentCount] = useState<number | undefined>(undefined)
  const [trainingContentMarkdown, setTrainingContentMarkdown] = useState('')

  useEffect(() => {
    if (!open) {
      setHydrated(false)
      return
    }

    const saved = loadGeminiRecruitmentAddDraft()
    if (saved?.form) {
      const next = applySnapshot(saved.form)
      setTitle(next.title)
      setApplicationPeriod(next.applicationPeriod)
      setTrainingRequestPeriod(next.trainingRequestPeriod)
      setMinStudentCount(next.minStudentCount)
      setTrainingContentMarkdown(next.trainingContentMarkdown)
    } else {
      setTitle('')
      setApplicationPeriod(null)
      setTrainingRequestPeriod(null)
      setMinStudentCount(15)
      setTrainingContentMarkdown('')
    }
    setHydrated(true)
  }, [open])

  const editorOpen = open && hydrated
  const { editor, editorMinHeight, getMarkdown } = useNoticeWysiwygEditor(
    editorOpen,
    trainingContentMarkdown,
    `${WYSIWYG_RESET_KEY}-${hydrated ? 'ready' : 'pending'}`,
    {
      placeholder: '모집 내용을 입력해 주세요. (ex. 연수 모집 절차, 연수 내용 등)',
    }
  )

  const handleMinStudentCountChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '')
    setMinStudentCount(digits ? Number(digits) : undefined)
  }, [])

  const buildSaveSnapshot = useCallback((): GeminiRecruitmentAddFormSnapshot => {
    const application = periodToIso(applicationPeriod)
    const trainingRequest = periodToIso(trainingRequestPeriod)
    return {
      title,
      applicationPeriodStart: application.start,
      applicationPeriodEnd: application.end,
      trainingRequestPeriodStart: trainingRequest.start,
      trainingRequestPeriodEnd: trainingRequest.end,
      minStudentCount: minStudentCount ?? null,
      trainingContentMarkdown: getMarkdown(),
    }
  }, [
    applicationPeriod,
    getMarkdown,
    minStudentCount,
    title,
    trainingRequestPeriod,
  ])

  return {
    hydrated,
    title,
    setTitle,
    applicationPeriod,
    setApplicationPeriod,
    trainingRequestPeriod,
    setTrainingRequestPeriod,
    minStudentCount,
    handleMinStudentCountChange,
    editor,
    editorMinHeight,
    buildSaveSnapshot,
  }
}
