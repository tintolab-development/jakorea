import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getPortalMe, getPortalProfile } from '@/features/auth/sign-in/api/client'
import { mapPortalMemberToPlatformProfile } from '@/features/mypage/lib/map-portal-member-profile'
import { hasTeacherMypageProfile } from '@/features/mypage/lib/member-profile'
import { fetchPortalConsents } from '@/features/mypage/settings/api/consents'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import {
  fetchPortalApplicationForm,
  fetchPortalApplicationOptions,
} from '../api/application-client'
import type { PortalApplicationOption } from '../api/application-types'
import {
  pickApplicationOption,
  type ProgramApplicationSelection,
} from '../api/pick-application-option'
import { getApplicationApiErrorCode } from '../lib/application-api-error'
import {
  resolveProgramApplyGateModal,
  type ProgramApplyGateModalKind,
} from '../lib/application-apply-gate'
import {
  findMissingApplyConsents,
  resolveRequiredApplyConsentTypes,
  type RequiredApplyConsentType,
} from '../lib/application-consent-guard'
import { isTeacherRestrictedApplication } from '../lib/teacher-apply-restriction'
import { parsePortalProgramId } from '../api/mappers'
import { useProgramMinorPortraitGate } from './use-program-minor-portrait-gate'

/** 필수 동의 하단 시트 문구 — `minor`: 만 14세 미만 회원 프로그램 초상권(보호자 본인인증 흐름) */
export type ProgramRequiredConsentVariant = 'default' | 'minor'

/** 대상 아님 모달 문구 — `teacher`: 교사 회원 신청 제한(원버튼) */
export type ProgramNotEligibleVariant = 'default' | 'teacher'

export function useProgramApplyGate(
  programId: string | null | undefined,
  selection?: ProgramApplicationSelection | null,
) {
  const queryClient = useQueryClient()
  const [gateModal, setGateModal] = useState<ProgramApplyGateModalKind | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [missingConsents, setMissingConsents] = useState<RequiredApplyConsentType[]>([])
  const [requiredConsentVariant, setRequiredConsentVariant] =
    useState<ProgramRequiredConsentVariant>('default')
  const [notEligibleVariant, setNotEligibleVariant] =
    useState<ProgramNotEligibleVariant>('default')
  /** 마지막 `findMissingRequiredConsents` 가 미성년 시도 미완료로 막았는지 */
  const minorPortraitPendingRef = useRef(false)
  /** `runApplyGate` 에서 넘긴 신청서 경로 (상세 → 신청서) */
  const minorReturnToRef = useRef<string | undefined>(undefined)
  const minorPortrait = useProgramMinorPortraitGate(programId, {
    onLeave: () => setGateModal(null),
  })
  const { checkPending: checkMinorPortraitPending, rememberReturnTo: rememberMinorReturnTo } =
    minorPortrait
  const startMinorPortrait = minorPortrait.flowProps.onStart

  const readGateModalForOptions = useCallback(
    (canApply?: boolean, blockedReason?: string | null) => {
      const modal = resolveProgramApplyGateModal(canApply, blockedReason)
      return modal === 'proceed' ? null : modal
    },
    [],
  )

  const fetchSelectedOption = useCallback(async () => {
    const numericId = parsePortalProgramId(programId)
    if (numericId == null) return null
    const options = await queryClient.fetchQuery({
      queryKey: platformQueryKeys.program.applicationOptions(String(numericId)),
      queryFn: ({ signal }) => fetchPortalApplicationOptions(numericId, signal),
    })
    return pickApplicationOption(options, selection)
  }, [programId, queryClient, selection])

  /**
   * 교사 회원(교사 겸직 강사 포함) — 일반(개인) 참여자·전 프로그램 봉사자 모집 신청 제한.
   * 회원 조회가 모두 실패하면 막지 않는다(fail-open, 서버 게이트에 맡김).
   */
  const isTeacherRestrictedOption = useCallback(
    async (option: PortalApplicationOption | null) => {
      const applicationType =
        option?.applicationType ??
        (selection?.applicationTypes?.length === 1 ? selection.applicationTypes[0] : undefined)
      const programType = selection?.programType
      // 교사 여부와 무관하게 제한 대상 모집이 아니면 회원 조회를 생략한다.
      if (!isTeacherRestrictedApplication({ isTeacher: true, programType, applicationType })) {
        return false
      }
      const [me, profile] = await Promise.allSettled([
        queryClient.fetchQuery({
          queryKey: platformQueryKeys.auth.me(),
          queryFn: ({ signal }) => getPortalMe(signal),
          staleTime: 5 * 60_000,
        }),
        queryClient.fetchQuery({
          queryKey: platformQueryKeys.auth.memberProfile(),
          queryFn: ({ signal }) => getPortalProfile(signal),
          staleTime: 5 * 60_000,
        }),
      ])
      const memberProfile = mapPortalMemberToPlatformProfile({
        me: me.status === 'fulfilled' ? me.value : null,
        profile: profile.status === 'fulfilled' ? profile.value : null,
      })
      return isTeacherRestrictedApplication({
        isTeacher: hasTeacherMypageProfile(memberProfile),
        programType,
        applicationType,
      })
    },
    [queryClient, selection?.applicationTypes, selection?.programType],
  )

  /**
   * 일부 대상 불일치 응답은 application-options에서 canApply/blockedReason가
   * 완전히 내려오지 않고 form-bindings 조회에서 403으로 확정된다.
   * 신청서 화면으로 이동하기 전에 같은 모집 양식을 사전 조회해 이동 게이트를 완성한다.
   */
  const preflightSelectedForm = useCallback(
    async (option: PortalApplicationOption | null) => {
      const numericId = parsePortalProgramId(programId)
      const bindingId = option?.formBindingId
      const recruitmentId = option?.recruitmentId
      const applicationType = option?.applicationType?.trim()

      if (
        numericId == null ||
        bindingId == null ||
        recruitmentId == null ||
        !applicationType ||
        option?.canApply === true
      ) {
        return null
      }

      try {
        await queryClient.fetchQuery({
          queryKey: platformQueryKeys.program.applicationForm({
            programId: String(numericId),
            bindingId,
            recruitmentId,
            applicationType,
          }),
          queryFn: ({ signal }) =>
            fetchPortalApplicationForm(
              numericId,
              bindingId,
              { recruitmentId, applicationType },
              signal,
            ),
          retry: false,
          staleTime: 0,
        })
      } catch (error) {
        return readGateModalForOptions(undefined, getApplicationApiErrorCode(error))
      }

      return null
    },
    [programId, queryClient, readGateModalForOptions],
  )

  /**
   * 필수 동의(초상권, UJAT 는 서약·동의 4종) 미완료 항목. 조회 실패는 막지 않는다(fail-open).
   * 이미 동의했는데 마이페이지에서 방금 작성한 경우를 위해 항상 서버에서 다시 읽는다.
   */
  const findMissingRequiredConsents = useCallback(async (): Promise<
    RequiredApplyConsentType[]
  > => {
    // 만 14세 미만: 회원 단위 초상권과 무관하게 신청 시도마다 보호자 인증 + 프로그램 초상권 동의서.
    const minor = await checkMinorPortraitPending()
    minorPortraitPendingRef.current = minor.pending
    if (minor.pending) return ['PORTRAIT_RIGHTS']
    try {
      const summaries = await queryClient.fetchQuery({
        queryKey: platformQueryKeys.mypage.consents(),
        queryFn: ({ signal }) => fetchPortalConsents(signal),
        staleTime: 0,
      })
      const missing = findMissingApplyConsents(
        summaries,
        resolveRequiredApplyConsentTypes({ programType: selection?.programType }),
      )
      // 미성년은 이번 시도에서 프로그램 초상권을 이미 받았으므로 회원 단위 초상권은 보지 않는다.
      return minor.isMinor ? missing.filter(type => type !== 'PORTRAIT_RIGHTS') : missing
    } catch {
      return []
    }
  }, [checkMinorPortraitPending, queryClient, selection?.programType])

  const openRequiredConsentModal = useCallback(
    (missing: RequiredApplyConsentType[]) => {
      const isMinorPortrait = minorPortraitPendingRef.current
      if (isMinorPortrait) {
        rememberMinorReturnTo(minorReturnToRef.current)
        // 만 14세 미만: 「필수 항목에 동의해 주세요」 시트 없이 보호자 본인인증부터 연다.
        // (보호자 본인인증 → 보호자 정보 입력 안내 → 프로그램 초상권 동의서)
        startMinorPortrait()
      }
      minorReturnToRef.current = undefined
      setRequiredConsentVariant(isMinorPortrait ? 'minor' : 'default')
      setMissingConsents(missing)
      setGateModal('required-consent')
    },
    [rememberMinorReturnTo, startMinorPortrait],
  )

  /** 교사 회원 신청 제한 — 대상 아님 모달(원버튼) */
  const openTeacherRestrictedModal = useCallback(() => {
    setNotEligibleVariant('teacher')
    setGateModal('not-eligible')
  }, [])

  const runApplyGate = useCallback(
    async (
      onProceed: () => void,
      /** `minorPortraitReturnTo` — 미성년 동의서 완료 후 이동할 신청서 경로 (기본값: 현재 경로) */
      gateOptions?: { minorPortraitReturnTo?: string },
    ) => {
      minorReturnToRef.current = gateOptions?.minorPortraitReturnTo
      const remote = isRemoteApiConfigured()
      const numericId = parsePortalProgramId(programId)
      if (!remote || numericId == null || !getAccessToken()) {
        onProceed()
        return
      }

      setIsChecking(true)
      try {
        const option = await fetchSelectedOption()
        if (await isTeacherRestrictedOption(option)) {
          openTeacherRestrictedModal()
          return
        }
        const modal = readGateModalForOptions(option?.canApply, option?.blockedReason ?? null)
        if (modal) {
          setGateModal(modal)
          return
        }

        const preflightModal = await preflightSelectedForm(option)
        if (preflightModal) {
          setGateModal(preflightModal)
          return
        }

        // 모집 전·마감 등 canApply=false 는 신청서 배너에 맡기고, 신청 가능한 경우에만 동의를 확인한다.
        if (option?.canApply !== false) {
          const missing = await findMissingRequiredConsents()
          if (missing.length > 0) {
            openRequiredConsentModal(missing)
            return
          }
        }

        onProceed()
      } finally {
        setIsChecking(false)
      }
    },
    [
      fetchSelectedOption,
      findMissingRequiredConsents,
      isTeacherRestrictedOption,
      openRequiredConsentModal,
      openTeacherRestrictedModal,
      preflightSelectedForm,
      programId,
      readGateModalForOptions,
    ],
  )

  const closeGateModal = useCallback(() => {
    setGateModal(null)
    setNotEligibleVariant('default')
  }, [])

  return {
    gateModal,
    setGateModal,
    closeGateModal,
    isChecking,
    runApplyGate,
    readGateModalForOptions,
    /** 신청서 직접 진입 — 교사 회원 신청 제한 모집인지 */
    isTeacherRestrictedOption,
    openTeacherRestrictedModal,
    /** `ProgramApplyGateModals.notEligibleVariant` 로 넘긴다 */
    notEligibleVariant,
    missingConsents,
    findMissingRequiredConsents,
    openRequiredConsentModal,
    /** `ProgramApplyGateModals` 에 펼쳐 넘긴다 — 미성년 프로그램 초상권(보호자 본인인증) 흐름 */
    minorPortraitGateModalProps: {
      requiredConsentVariant,
      minorPortrait: minorPortrait.flowProps,
    },
  }
}
