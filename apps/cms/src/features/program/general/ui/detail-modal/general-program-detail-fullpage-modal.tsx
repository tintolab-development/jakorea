/**
 * 일반 프로그램 상세 풀페이지 모달 — `/programs/general?programId=…&lnb=…&tab=…`
 * LNB·breadcrumb·queryParam 복원만 구성 (본문 화면은 추후 API 연동)
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Spin, Typography } from 'antd'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import {
  buildSearchParams,
  makeBreadcrumbItem,
} from '@/shared/lib/detail-fullpage-query-stack'
import { useProgramDetail } from '@/pages/programs/use-program-detail'
import type { Program } from '@/types/domain'
import {
  getGeneralSurveyMenuItems,
  getGeneralVolunteerInterviewEnabled,
  hasGeneralInstructorApplications,
  hasGeneralVolunteerApplications,
  type GeneralSurveyMenuItem,
} from '@/features/program/general/lib/general-program-detail-meta'
import {
  parseGeneralDetailLnb,
  type GeneralDetailLnbKey,
} from '@/features/program/general/lib/general-program-detail-url'
import { GeneralProgramDetailSidebar } from './general-program-detail-sidebar'
import '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal.css'
import './general-program-detail-fullpage-modal.css'

const TAB_PARAM = 'tab'
const LNB_PARAM = 'lnb'

const GENERAL_DETAIL_QUERY_PARAMS = ['programId', LNB_PARAM, TAB_PARAM] as const

const INFO_TABS = ['info', 'recruitment', 'application'] as const
const VOLUNTEER_INTERVIEW_TABS = ['vol_doc1', 'vol_doc_passed', 'vol_interview2'] as const
const PROGRESS_TABS = [
  'progress_institutions',
  'progress_instructors',
  'progress_volunteers',
] as const

export interface GeneralProgramDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  program: Program | null
  programIdHint?: string | null
}

function defaultTabForLnb(
  lnb: GeneralDetailLnbKey,
  interview: boolean,
  surveyKeys: string[]
): string {
  switch (lnb) {
    case 'info':
      return 'info'
    case 'institution_applications':
    case 'instructor_applications':
      return 'main'
    case 'volunteer_applications':
      return interview ? 'vol_doc1' : 'vol_all'
    case 'progress':
      return 'progress_institutions'
    case 'survey':
      return surveyKeys[0] ?? 'main'
    case 'managers':
      return 'main'
    default:
      return 'info'
  }
}

function isVolunteerTabValid(tab: string, interview: boolean): boolean {
  if (!interview) return tab === 'vol_all' || tab === 'main'
  return (VOLUNTEER_INTERVIEW_TABS as readonly string[]).includes(tab)
}

function normalizeGeneralDetailParams(
  programId: string,
  searchParams: URLSearchParams,
  program: Program
): URLSearchParams | null {
  const interview = getGeneralVolunteerInterviewEnabled(program)
  const surveyKeys = getGeneralSurveyMenuItems(program).map(s => s.key)
  const showInstructor = hasGeneralInstructorApplications(program)
  const showVolunteer = hasGeneralVolunteerApplications(program)

  const next = new URLSearchParams(searchParams)
  next.set('programId', programId)

  let lnb: GeneralDetailLnbKey = parseGeneralDetailLnb(searchParams) ?? 'info'
  let tab = searchParams.get(TAB_PARAM) ?? ''

  const setInvalid = (l: GeneralDetailLnbKey, t: string) => {
    lnb = l
    tab = t
  }

  if (tab === '') {
    tab = defaultTabForLnb(lnb, interview, surveyKeys)
  }

  if (lnb === 'info') {
    if (!(INFO_TABS as readonly string[]).includes(tab)) {
      setInvalid('info', 'info')
    }
  } else if (lnb === 'institution_applications') {
    if (tab !== 'main') setInvalid('institution_applications', 'main')
  } else if (lnb === 'instructor_applications') {
    if (!showInstructor) setInvalid('info', 'info')
    else if (tab !== 'main') setInvalid('instructor_applications', 'main')
  } else if (lnb === 'volunteer_applications') {
    if (!showVolunteer) setInvalid('info', 'info')
    else if (!isVolunteerTabValid(tab, interview)) {
      setInvalid('volunteer_applications', defaultTabForLnb('volunteer_applications', interview, surveyKeys))
    }
  } else if (lnb === 'progress') {
    if (!(PROGRESS_TABS as readonly string[]).includes(tab)) {
      setInvalid('progress', 'progress_institutions')
    }
  } else if (lnb === 'survey') {
    if (surveyKeys.length === 0) {
      if (tab !== 'main') setInvalid('survey', 'main')
    } else if (!(surveyKeys as readonly string[]).includes(tab)) {
      setInvalid('survey', surveyKeys[0] ?? 'main')
    }
  } else if (lnb === 'managers') {
    if (tab !== 'main') setInvalid('managers', 'main')
  }

  if (next.get(LNB_PARAM) !== lnb) next.set(LNB_PARAM, lnb)
  if (next.get(TAB_PARAM) !== tab) next.set(TAB_PARAM, tab)

  const changed =
    searchParams.get('programId') !== programId ||
    searchParams.get(LNB_PARAM) !== lnb ||
    searchParams.get(TAB_PARAM) !== tab

  return changed ? next : null
}

function generalLnbBreadcrumbLabel(lnb: GeneralDetailLnbKey): string {
  switch (lnb) {
    case 'info':
      return '프로그램 정보'
    case 'institution_applications':
      return '기관 신청 목록'
    case 'instructor_applications':
      return '강사 신청 목록'
    case 'volunteer_applications':
      return '봉사자 신청 목록'
    case 'progress':
      return '프로그램 진행 현황'
    case 'survey':
      return '설문 관리'
    case 'managers':
      return '담당자 정보'
    default:
      return '프로그램 정보'
  }
}

function generalChildBreadcrumbLabel(
  lnb: GeneralDetailLnbKey,
  tab: string,
  surveyItems: GeneralSurveyMenuItem[]
): string | null {
  if (lnb === 'info') {
    if (tab === 'info') return '공통 정보'
    if (tab === 'recruitment') return '모집 정보'
    if (tab === 'application') return '신청 정보'
    return null
  }
  if (lnb === 'volunteer_applications') {
    if (tab === 'vol_doc1') return '1차 서류 심사 대상자'
    if (tab === 'vol_doc_passed') return '1차 서류 합격자'
    if (tab === 'vol_interview2') return '2차 면접 대상자'
    return null
  }
  if (lnb === 'progress') {
    if (tab === 'progress_institutions') return '참여 기관'
    if (tab === 'progress_instructors') return '참여 강사'
    if (tab === 'progress_volunteers') return '참여 봉사자'
    return null
  }
  if (lnb === 'survey') {
    return surveyItems.find(item => item.key === tab)?.label ?? null
  }
  return null
}

function generalLnbBreadcrumbTargetTab(
  lnb: GeneralDetailLnbKey,
  activeTab: string,
  interview: boolean,
  surveyKeys: string[]
): string {
  if (lnb === 'volunteer_applications' && interview) {
    if ((VOLUNTEER_INTERVIEW_TABS as readonly string[]).includes(activeTab)) return activeTab
    return 'vol_doc1'
  }
  return defaultTabForLnb(lnb, interview, surveyKeys)
}

export function GeneralProgramDetailFullPageModal({
  open,
  onClose,
  program,
  programIdHint = null,
}: GeneralProgramDetailFullPageModalProps) {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const programId = program?.id ?? programIdHint ?? searchParams.get('programId') ?? undefined

  const { program: detailProgram, loading } = useProgramDetail(open ? programId : undefined)
  const displayProgram = useMemo(
    () => detailProgram ?? program ?? null,
    [detailProgram, program]
  )

  const interviewEnabled = displayProgram
    ? getGeneralVolunteerInterviewEnabled(displayProgram)
    : false
  const surveyItems = useMemo(
    () => (displayProgram ? getGeneralSurveyMenuItems(displayProgram) : []),
    [displayProgram]
  )
  const surveyKeys = useMemo(() => surveyItems.map(s => s.key), [surveyItems])
  const showInstructorApplications = displayProgram
    ? hasGeneralInstructorApplications(displayProgram)
    : false
  const showVolunteerApplications = displayProgram
    ? hasGeneralVolunteerApplications(displayProgram)
    : false

  const activeLnb: GeneralDetailLnbKey = open
    ? (parseGeneralDetailLnb(searchParams) ?? 'info')
    : 'info'
  const activeTab = open ? (searchParams.get(TAB_PARAM) ?? 'info') : 'info'

  useEffect(() => {
    if (!open || !programId || !displayProgram) return
    const normalized = normalizeGeneralDetailParams(programId, searchParams, displayProgram)
    if (normalized) setSearchParams(normalized, { replace: true })
  }, [open, programId, displayProgram, searchParams, setSearchParams])

  const setLnbTab = useCallback(
    (lnb: GeneralDetailLnbKey, tab: string) => {
      const next = new URLSearchParams(searchParams)
      next.set(LNB_PARAM, lnb)
      next.set(TAB_PARAM, tab)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
    },
    [programId, searchParams, setSearchParams]
  )

  const headerBreadcrumbItems = (() => {
    const listParams = buildSearchParams(searchParams, {
      delete: GENERAL_DETAIL_QUERY_PARAMS,
    })
    const items = [makeBreadcrumbItem('프로그램 목록', location.pathname, listParams)]

    if (!displayProgram) return items

    const programParams = buildSearchParams(searchParams, {
      delete: GENERAL_DETAIL_QUERY_PARAMS,
      set: {
        programId,
        [LNB_PARAM]: 'info',
        [TAB_PARAM]: 'info',
      },
    })

    const lnbLabel = generalLnbBreadcrumbLabel(activeLnb)
    const childLabel = generalChildBreadcrumbLabel(activeLnb, activeTab, surveyItems)
    const lnbTab = generalLnbBreadcrumbTargetTab(
      activeLnb,
      activeTab,
      interviewEnabled,
      surveyKeys
    )
    const lnbParams = buildSearchParams(searchParams, {
      delete: GENERAL_DETAIL_QUERY_PARAMS,
      set: {
        programId,
        [LNB_PARAM]: activeLnb,
        [TAB_PARAM]: lnbTab,
      },
    })
    const childParams = childLabel
      ? buildSearchParams(searchParams, {
          delete: GENERAL_DETAIL_QUERY_PARAMS,
          set: {
            programId,
            [LNB_PARAM]: activeLnb,
            [TAB_PARAM]: activeTab,
          },
        })
      : null

    items.push(makeBreadcrumbItem(displayProgram.title, location.pathname, programParams))

    if (!childLabel) {
      items.push({ label: lnbLabel })
    } else {
      items.push(makeBreadcrumbItem(lnbLabel, location.pathname, lnbParams))
      items.push(
        childParams
          ? makeBreadcrumbItem(childLabel, location.pathname, childParams)
          : { label: childLabel }
      )
    }

    return items
  })()

  if (!open) return null

  return (
    <DetailFullPageModal
      open={open}
      onClose={onClose}
      title={displayProgram?.title ?? '프로그램 상세'}
      headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
      className="program-detail-fullpage-modal general-program-detail-fullpage-modal program-detail-fullpage-modal--program-list-overview"
      sidebar={
        programId ? (
          <GeneralProgramDetailSidebar
            activeLnb={activeLnb}
            activeTab={activeTab}
            showInstructorApplications={showInstructorApplications}
            showVolunteerApplications={showVolunteerApplications}
            volunteerInterviewEnabled={interviewEnabled}
            surveyItems={surveyItems}
            onSelectChildTab={setLnbTab}
          />
        ) : null
      }
    >
      {loading && !displayProgram ? (
        <div className="detail-fullpage-modal__loading">
          <Spin size="large" />
        </div>
      ) : displayProgram ? (
        <div
          className="general-program-detail-fullpage-modal__main"
          aria-label={generalChildBreadcrumbLabel(activeLnb, activeTab, surveyItems) ?? generalLnbBreadcrumbLabel(activeLnb)}
        />
      ) : (
        <Typography.Text type="secondary">프로그램 정보를 찾을 수 없습니다.</Typography.Text>
      )}
    </DetailFullPageModal>
  )
}
