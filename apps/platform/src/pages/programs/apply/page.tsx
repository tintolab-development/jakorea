import { useCallback, useEffect, useRef, useState } from 'react'
import type { WritingFormDraft, WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import {
  getMockApplyFormDraft,
  getProgramIdFromPath,
  parsePortalProgramId,
  ProgramBackButton,
  programApplyCompletePath,
  programDetailPath,
  resolveProgramApplyFormCase,
  useProgramApplicationForm,
  useProgramDetail,
  useSubmitProgramApplication,
} from '@/features/program'
import { usePortalProfileQuery } from '@/features/auth/sign-in/hooks/use-portal-profile-query'
import {
  getProgramApplicationApiErrorMessage,
  messageForApplicationBlockedReason,
} from '@/features/program/lib/application-api-error'
import {
  buildApplicationAnswersFromDraft,
  writingFormDraftFromApplicationForm,
} from '@/features/program/lib/application-form-draft'
import {
  isApplyScheduleChoiceParagraphId,
  shouldShowApplyPreferredSchedule,
} from '@/features/program/lib/apply-form-schedule'
import {
  preferredScheduleBlocksFromDraftAnswers,
  toPortalPreferredScheduleBlocks,
  toPreferredScheduleAnswerValue,
  findIncompletePreferredScheduleMessage,
} from '@/features/program/lib/preferred-schedule-blocks'
import {
  ApplyPreferredSchedule,
  type ApplyPreferredScheduleBlock,
} from '@/features/program/ui/apply-preferred-schedule/apply-preferred-schedule'
import {
  ApplyTrainedTeachersBasicInfo,
  basicInfoAnswerFromValues,
  basicInfoValuesFromDraftAnswer,
  emptyTrainedTeachersBasicInfo,
  findIncompleteTrainedTeachersBasicInfoMessage,
  type ApplyTrainedTeachersBasicInfoValues,
} from '@/features/program/ui/apply-trained-teachers-basic-info/apply-trained-teachers-basic-info'
import { FormTemplateHost, FormTemplateRenderer } from '@/features/form-template'
import { getAccessToken } from '@/shared/lib/auth-token'
import { getDevAuthLoggedIn, isRemoteApiConfigured, resolveLoginRequiredPath } from '@/shared/lib'
import { PFButton, PFCheckbox, PFText, PFTextarea, PFTextInput } from '@/shared/ui'
import shell from '../program-page-shell.module.css'
import styles from './page.module.css'
import { useNavigate } from 'react-router-dom'

function createEmptyPreferredBlock(): ApplyPreferredScheduleBlock {
  return { date: '', classPeriod: '', startTime: '', endTime: '' }
}

export function ProgramApplyPage() {
  const navigate = useNavigate()
  const [isReady, setIsReady] = useState(false)
  const programId = getProgramIdFromPath()
  const { program, isLoading } = useProgramDetail(programId, { fresh: true })
  const numericProgramId = parsePortalProgramId(programId)
  const remoteApplyEnabled =
    isRemoteApiConfigured() && numericProgramId != null && Boolean(getAccessToken())
  const applicationFormQuery = useProgramApplicationForm(
    remoteApplyEnabled ? programId : null,
  )
  const submitMutation = useSubmitProgramApplication(numericProgramId)
  const profileQuery = usePortalProfileQuery({ enabled: remoteApplyEnabled })

  useEffect(() => {
    if (!programId) {
      return
    }

    if (!getDevAuthLoggedIn()) {
      navigate(resolveLoginRequiredPath(`/programs/${programId}/apply`))
      return
    }

    setIsReady(true)
  }, [navigate, programId])

  const [draft, setDraft] = useState<WritingFormDraft | null>(null)
  const [preferredBlocks, setPreferredBlocks] = useState<ApplyPreferredScheduleBlock[]>([
    createEmptyPreferredBlock(),
  ])
  const [basicInfo, setBasicInfo] = useState<ApplyTrainedTeachersBasicInfoValues>(
    emptyTrainedTeachersBasicInfo,
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  /** bundle 객체 참조가 바뀌어도 입력 mid-edit 을 덮어쓰지 않도록 수화 키로만 재초기화 */
  const hydratedFormKeyRef = useRef<string | null>(null)

  const applyCase = program ? resolveProgramApplyFormCase(program) : null
  const showTrainedTeachersApply =
    applyCase === 'trained-teachers' ||
    program?.registrationKind === 'trainedTeachers' ||
    program?.programType === 'TRAINED_TEACHER'

  const profileSchool =
    profileQuery.data?.schoolName?.trim() ||
    profileQuery.data?.affiliationName?.trim() ||
    ''
  const profileRegionLabel = [
    profileQuery.data?.regionSido?.trim(),
    profileQuery.data?.regionSigungu?.trim(),
  ]
    .filter(Boolean)
    .join(' ')
  const profileTeacherName = profileQuery.data?.name?.trim() || ''
  const profileTeacherMobile = profileQuery.data?.phone?.trim() || ''
  const profileTeacherEmail = profileQuery.data?.email?.trim() || ''
  const showPreferredEducationForm = program?.educationForm === 'participant_choice'
  const remoteForm = applicationFormQuery.bundle?.form
  const remoteFormKey =
    remoteApplyEnabled && applicationFormQuery.status === 'ready' && remoteForm
      ? [
          programId,
          applicationFormQuery.bundle?.option.formBindingId,
          remoteForm.templateVersionId,
          remoteForm.draftApplicationId ?? 'none',
          remoteForm.draftFormResponseId ?? 'none',
        ].join(':')
      : null

  useEffect(() => {
    if (!program) {
      hydratedFormKeyRef.current = null
      setDraft(null)
      return
    }

    if (remoteApplyEnabled) {
      if (applicationFormQuery.status === 'ready' && remoteForm && remoteFormKey) {
        if (hydratedFormKeyRef.current === remoteFormKey) return
        const remoteDraft = writingFormDraftFromApplicationForm(
          remoteForm.form,
          remoteForm.draftAnswers,
        )
        if (remoteDraft) {
          hydratedFormKeyRef.current = remoteFormKey
          setDraft(remoteDraft)
          const draftAnswers = remoteForm.draftAnswers
          const fromPreferred = preferredScheduleBlocksFromDraftAnswers(
            draftAnswers,
            PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule,
          )
          setPreferredBlocks(fromPreferred ?? [createEmptyPreferredBlock()])
          const fromBasic = basicInfoValuesFromDraftAnswer(
            draftAnswers?.[PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo],
          )
          setBasicInfo({
            ...(fromBasic ?? emptyTrainedTeachersBasicInfo()),
            schoolName: fromBasic?.schoolName?.trim() || profileSchool,
            regionLabel: fromBasic?.regionLabel?.trim() || profileRegionLabel,
            teacherName: fromBasic?.teacherName?.trim() || profileTeacherName,
            teacherMobile: fromBasic?.teacherMobile?.trim() || profileTeacherMobile,
            teacherEmail: fromBasic?.teacherEmail?.trim() || profileTeacherEmail,
          })
          return
        }
      }
      if (
        applicationFormQuery.status === 'loading' ||
        applicationFormQuery.status === 'idle'
      ) {
        hydratedFormKeyRef.current = null
        setDraft(null)
        return
      }
      const mockKey = `mock-fallback:${program.id}`
      if (hydratedFormKeyRef.current === mockKey) return
      hydratedFormKeyRef.current = mockKey
      setDraft(getMockApplyFormDraft(program))
      setPreferredBlocks([createEmptyPreferredBlock()])
      setBasicInfo({
        ...emptyTrainedTeachersBasicInfo(),
        schoolName: profileSchool,
        regionLabel: profileRegionLabel,
        teacherName: profileTeacherName,
        teacherMobile: profileTeacherMobile,
        teacherEmail: profileTeacherEmail,
      })
      return
    }

    const mockKey = `mock:${program.id}`
    if (hydratedFormKeyRef.current === mockKey) return
    hydratedFormKeyRef.current = mockKey
    setDraft(getMockApplyFormDraft(program))
    setPreferredBlocks([createEmptyPreferredBlock()])
    setBasicInfo(emptyTrainedTeachersBasicInfo())
  }, [
    program,
    programId,
    remoteApplyEnabled,
    applicationFormQuery.status,
    remoteForm,
    remoteFormKey,
    profileSchool,
    profileRegionLabel,
    profileTeacherName,
    profileTeacherMobile,
    profileTeacherEmail,
  ])

  useEffect(() => {
    setBasicInfo(prev => ({
      ...prev,
      schoolName: prev.schoolName.trim() ? prev.schoolName : profileSchool || prev.schoolName,
      regionLabel: prev.regionLabel.trim()
        ? prev.regionLabel
        : profileRegionLabel || prev.regionLabel,
      teacherName: prev.teacherName.trim()
        ? prev.teacherName
        : profileTeacherName || prev.teacherName,
      teacherMobile: prev.teacherMobile.trim()
        ? prev.teacherMobile
        : profileTeacherMobile || prev.teacherMobile,
      teacherEmail: prev.teacherEmail.trim()
        ? prev.teacherEmail
        : profileTeacherEmail || prev.teacherEmail,
    }))
  }, [
    profileSchool,
    profileRegionLabel,
    profileTeacherName,
    profileTeacherMobile,
    profileTeacherEmail,
  ])

  const updateParagraph = useCallback<FormUpdateParagraph>((id, updater) => {
    setDraft(prev => {
      if (prev == null) return prev
      return {
        ...prev,
        paragraphs: prev.paragraphs.map(paragraph =>
          paragraph.id === id ? updater(paragraph) : paragraph
        ),
      }
    })
  }, [])

  const blockedMessage = messageForApplicationBlockedReason(
    applicationFormQuery.blockedReason,
  )
  const canSubmitRemote =
    remoteApplyEnabled &&
    applicationFormQuery.status === 'ready' &&
    applicationFormQuery.bundle != null &&
    applicationFormQuery.blockedReason == null &&
    applicationFormQuery.bundle.option.canApply !== false

  const profileSchoolLocked = Boolean(
    profileQuery.data?.schoolName?.trim() || profileQuery.data?.affiliationName?.trim(),
  )

  const renderParagraphSlot = useCallback(
    (paragraph: WritingFormParagraph) => {
      if (program == null) return undefined

      if (
        showTrainedTeachersApply &&
        paragraph.id === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo
      ) {
        return (
          <ApplyTrainedTeachersBasicInfo
            value={basicInfo}
            onChange={setBasicInfo}
            schoolNameLocked={profileSchoolLocked}
            showPreferredEducationForm={showPreferredEducationForm}
            profile={{
              schoolName: profileSchool,
              regionLabel: profileRegionLabel,
              teacherName: profileTeacherName,
              teacherMobile: profileTeacherMobile,
              teacherEmail: profileTeacherEmail,
            }}
          />
        )
      }

      const isTrainedPreferred =
        showTrainedTeachersApply &&
        paragraph.id === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule

      if (
        isTrainedPreferred ||
        (program.detailCase === 'general' &&
          isApplyScheduleChoiceParagraphId(paragraph.id) &&
          shouldShowApplyPreferredSchedule(program))
      ) {
        return (
          <ApplyPreferredSchedule
            maxBlocks={program.maxPreferredScheduleCount}
            value={preferredBlocks}
            onChange={setPreferredBlocks}
          />
        )
      }

      if (
        paragraph.kind === 'single_item' &&
        paragraph.variant === 'multiple_choice' &&
        paragraph.allowMultiple
      ) {
        const selectedIds = paragraph.selectedPreviewMultipleIds ?? []
        if (paragraph.items.length === 0) {
          return (
            <PFText as="p" typo="bd-md-md" color="neutral-cool-600">
              선택 가능한 교육 일정이 없습니다.
            </PFText>
          )
        }
        return (
          <div className={styles.multipleChoice}>
            {paragraph.items.map(item => (
              <PFCheckbox
                key={item.id}
                className={styles.multipleChoiceItem}
                size="large"
                checked={selectedIds.includes(item.id)}
                onCheckedChange={checked => {
                  updateParagraph(paragraph.id, current => {
                    if (current.kind !== 'single_item' || current.variant !== 'multiple_choice') {
                      return current
                    }
                    const prev = current.selectedPreviewMultipleIds ?? []
                    const next = checked
                      ? [...prev.filter(id => id !== item.id), item.id]
                      : prev.filter(id => id !== item.id)
                    return { ...current, selectedPreviewMultipleIds: next }
                  })
                }}
              >
                {item.label}
              </PFCheckbox>
            ))}
          </div>
        )
      }

      if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') {
        return undefined
      }

      const isSingleLine = paragraph.itemInputRows === 1
      const items = paragraph.items ?? []
      const placeholder = paragraph.bodyPlaceholder || '답변을 입력해 주세요'

      const commitBody = (next: string) => {
        updateParagraph(paragraph.id, current =>
          current.kind === 'single_item' && current.variant === 'short_essay'
            ? { ...current, bodyText: next }
            : current
        )
      }

      if (items.length === 0) {
        if (isSingleLine) {
          return (
            <PFTextInput
              variant="formPage"
              value={paragraph.bodyText}
              placeholder={placeholder}
              onValueChange={commitBody}
            />
          )
        }
        return (
          <PFTextarea
            variant="formPage"
            value={paragraph.bodyText}
            placeholder={placeholder}
            onValueChange={commitBody}
          />
        )
      }

      return (
        <div className={styles.shortEssayItems}>
          {items.map(item => {
            const onItemChange = (nextValue: string) => {
              updateParagraph(paragraph.id, current => {
                if (current.kind !== 'single_item' || current.variant !== 'short_essay') {
                  return current
                }
                return {
                  ...current,
                  bodyText: current.items?.[0]?.id === item.id ? nextValue : current.bodyText,
                  items: (current.items ?? []).map(entry =>
                    entry.id === item.id ? { ...entry, bodyText: nextValue } : entry
                  ),
                }
              })
            }

            const control = isSingleLine ? (
              <PFTextInput
                variant="formPage"
                label={paragraph.showItemTitle ? item.label?.trim() || undefined : undefined}
                value={item.bodyText}
                placeholder={item.placeholder || placeholder}
                onValueChange={onItemChange}
              />
            ) : (
              <PFTextarea
                variant="formPage"
                label={paragraph.showItemTitle ? item.label?.trim() || undefined : undefined}
                value={item.bodyText}
                placeholder={item.placeholder || placeholder}
                onValueChange={onItemChange}
              />
            )

            return (
              <div key={item.id} className={styles.shortEssayItem}>
                {control}
              </div>
            )
          })}
        </div>
      )
    },
    [
      program,
      preferredBlocks,
      basicInfo,
      showTrainedTeachersApply,
      showPreferredEducationForm,
      profileSchoolLocked,
      profileSchool,
      profileRegionLabel,
      profileTeacherName,
      profileTeacherMobile,
      profileTeacherEmail,
      updateParagraph,
    ]
  )

  const formLoading =
    remoteApplyEnabled &&
    (applicationFormQuery.status === 'loading' || applicationFormQuery.status === 'idle')

  if (!isReady || isLoading || formLoading || !program || !draft) {
    return null
  }

  const handleBack = () => {
    navigate(programDetailPath(program.id))
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    if (blockedMessage && !canSubmitRemote) {
      setSubmitError(blockedMessage)
      return
    }
    const bundle = applicationFormQuery.bundle
    if (
      canSubmitRemote &&
      bundle?.option.recruitmentId != null &&
      bundle.option.formBindingId != null &&
      bundle.option.applicationType
    ) {
      const preferredScheduleBlocks = showTrainedTeachersApply
        ? toPortalPreferredScheduleBlocks(preferredBlocks)
        : undefined
      if (showTrainedTeachersApply) {
        const preferredError = findIncompletePreferredScheduleMessage(preferredBlocks)
        if (preferredError) {
          setSubmitError(preferredError)
          return
        }
      }
      const preferredAnswer = showTrainedTeachersApply
        ? toPreferredScheduleAnswerValue(preferredBlocks)
        : null
      if (showTrainedTeachersApply && !preferredAnswer) {
        setSubmitError('진행 희망 교육 일정을 한 개 이상 입력해 주세요.')
        return
      }
      const basicAnswer = showTrainedTeachersApply
        ? basicInfoAnswerFromValues(basicInfo)
        : null
      if (showTrainedTeachersApply) {
        const basicError = findIncompleteTrainedTeachersBasicInfoMessage(basicInfo)
        if (basicError) {
          setSubmitError(basicError)
          return
        }
      }
      if (showTrainedTeachersApply && !basicAnswer) {
        setSubmitError('기본 정보(신청 기관명)를 입력해 주세요.')
        return
      }

      const overrides: Record<string, unknown> = {}
      if (preferredAnswer != null) {
        overrides[PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule] =
          preferredAnswer
      }
      if (basicAnswer != null) {
        overrides[PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo] = basicAnswer
      }

      const answers = buildApplicationAnswersFromDraft(draft, {
        overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
      })

      const classCount = Number.parseInt(basicInfo.classCount, 10)
      const studentCount = Number.parseInt(basicInfo.studentCount, 10)

      try {
        await submitMutation.mutateAsync({
          recruitmentId: bundle.option.recruitmentId,
          applicationType: bundle.option.applicationType,
          formBindingId: bundle.option.formBindingId,
          answers,
          preferredScheduleBlocks,
          ...(Number.isFinite(classCount) && classCount > 0
            ? { requestedClassCount: classCount }
            : {}),
          ...(Number.isFinite(studentCount) && studentCount > 0
            ? { requestedStudentCount: studentCount }
            : {}),
        })
        navigate(programApplyCompletePath(program.id))
      } catch (error) {
        setSubmitError(getProgramApplicationApiErrorMessage(error))
      }
      return
    }
    if (remoteApplyEnabled) {
      setSubmitError(
        blockedMessage ?? '신청을 제출할 수 없습니다. 모집 기간과 회원 자격을 확인해 주세요.',
      )
      return
    }
    navigate(programApplyCompletePath(program.id))
  }

  return (
    <section className={[shell.page, styles.page].join(' ')}>
      <div className={shell.inner}>
        <div className={styles.back}>
          <ProgramBackButton size="large" label="이전으로" onClick={handleBack} />
        </div>

        <PFText as="h1" typo="hd-lg" color="black" className={styles.pageTitle}>
          프로그램 신청하기
        </PFText>

        <div className={styles.summary}>
          <PFText as="h2" typo="hl-sm" color="black">
            {program.title}
          </PFText>
          <PFText as="p" typo="bd-md-md" color="primary-500">
            {program.applicationPeriodLabel}
          </PFText>
        </div>

        {blockedMessage ? (
          <PFText as="p" typo="bd-md-md" color="neutral-cool-700" className={styles.blockedNotice}>
            {blockedMessage}
          </PFText>
        ) : null}

        <div className={styles.form}>
          <FormTemplateHost surface="platformUser">
            <FormTemplateRenderer
              draft={draft}
              interactionMode="user"
              surface="platformUser"
              onUpdateParagraph={updateParagraph}
              renderParagraphSlot={renderParagraphSlot}
            />
          </FormTemplateHost>

          {submitError ? (
            <PFText as="p" typo="bd-md-md" color="neutral-cool-700" className={styles.submitError}>
              {submitError}
            </PFText>
          ) : null}

          <div className={styles.actions}>
            <PFButton
              size="xlarge"
              width={240}
              type="button"
              disabled={submitMutation.isPending || Boolean(blockedMessage && remoteApplyEnabled)}
              onClick={() => {
                void handleSubmit()
              }}
            >
              신청하기
            </PFButton>
          </div>
        </div>
      </div>
    </section>
  )
}
