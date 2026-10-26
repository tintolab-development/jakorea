import { beforeEach, describe, expect, it } from 'vitest'
import { createGeminiVisitingTrainingRecruitFormDraft } from '@/features/template/model/gemini-visiting-training-recruit-form-draft'
import {
  applyOperationalOverlayForCatalogId,
  collectOperationalOverlayForCatalogId,
  resetOperationalOverlayForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  resetAllOperationalOverlayStores,
  setOperationalOverlayScope,
} from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  buildGeminiRecruitmentPersistSnapshot,
  mapGeminiRecruitmentSnapshotToCreateRequest,
} from '@/features/program/gemini/api/visiting-training/adapters'
import { GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE } from './add-template'
import { createDefaultGeminiRecruitmentAddFormSnapshot } from './add-local-save'
import {
  buildGeminiRecruitmentSnapshotFromOverlay,
  seedGeminiRecruitmentOverlaysFromSnapshot,
} from './snapshot-from-overlay'

/**
 * Part3 1단계 저장 결과 고정 — 스토어(534bf7e77)에서 만든 스냅샷과
 * RHF 전환 뒤 결과가 같아야 한다(geminiRecruitment payload, 양식 extensionJson overlay).
 */
const CODE = GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE

const SNAPSHOT = {
  ...createDefaultGeminiRecruitmentAddFormSnapshot(),
  title: '찾아가는 연수',
  announcementPublished: 'unpublished' as const,
  educationTargetLevels: ['adult', 'university'],
  educationTargetDetail: '성인 학습 기관',
  applicationPeriodStart: '2026-11-01T00:00:00.000Z',
  applicationPeriodEnd: '2026-11-10T00:00:00.000Z',
  trainingRequestPeriodStart: '2026-11-11T00:00:00.000Z',
  trainingRequestPeriodEnd: '2026-11-20T00:00:00.000Z',
  minStudentCount: 20,
  educationForm: 'offline' as const,
  inquiryContactName: '담당자',
  inquiryTel: '02-0000-0000',
  inquiryEmail: 'gemini@jakorea.org',
  notesNotApplicable: false,
  notes: '비고',
  programDescription: '프로그램 설명',
  recruitmentGuide: '모집 안내',
  applicationMethod: '지원 방법',
  learningSupportContent: '학습 지원',
  additionalContentMarkdown: '추가',
  thumbnailFileName: 'thumb.png',
  thumbnailFileObjectId: 77,
  attachmentFileNames: ['a.pdf'],
}

function sorted(record: Record<string, unknown> | null | undefined) {
  if (record == null) return record
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)))
}

describe('gemini recruit save parity (part3 step1)', () => {
  beforeEach(() => {
    resetAllOperationalOverlayStores()
    setOperationalOverlayScope(CODE)
  })

  it('seed → snapshot → geminiRecruitment create payload', () => {
    seedGeminiRecruitmentOverlaysFromSnapshot(SNAPSHOT, CODE)
    const snapshot = buildGeminiRecruitmentSnapshotFromOverlay(
      createGeminiVisitingTrainingRecruitFormDraft()
    )
    expect(snapshot).toMatchSnapshot('snapshot')
    expect(buildGeminiRecruitmentPersistSnapshot(snapshot)).toMatchSnapshot('persist')
    expect(mapGeminiRecruitmentSnapshotToCreateRequest(snapshot)).toMatchSnapshot('create')
  })

  it('seed → 양식 extensionJson overlay', () => {
    seedGeminiRecruitmentOverlaysFromSnapshot(SNAPSHOT, CODE)
    expect(sorted(collectOperationalOverlayForCatalogId(CODE))).toMatchSnapshot('collect')
  })

  it('apply(양식 불러오기) → collect 는 받은 키를 그대로 돌려준다', () => {
    applyOperationalOverlayForCatalogId(CODE, {
      'geminiRecruit.title': '불러온 공고',
      'geminiRecruit.educationTargetLevels': ['adult'],
      'geminiRecruit.minStudentCount': null,
      'custom.passthrough': 'x',
    })
    expect(sorted(collectOperationalOverlayForCatalogId(CODE))).toMatchSnapshot('apply-collect')
    expect(
      buildGeminiRecruitmentSnapshotFromOverlay(createGeminiVisitingTrainingRecruitFormDraft())
    ).toMatchSnapshot('apply-snapshot')
  })

  it('reset(시드 억제) → collect·snapshot', () => {
    resetOperationalOverlayForCatalogId(CODE)
    expect(sorted(collectOperationalOverlayForCatalogId(CODE))).toMatchSnapshot('reset-collect')
    expect(
      buildGeminiRecruitmentSnapshotFromOverlay(createGeminiVisitingTrainingRecruitFormDraft())
    ).toMatchSnapshot('reset-snapshot')
  })

  it('기본 상태(시드 기본값) snapshot', () => {
    expect(
      buildGeminiRecruitmentSnapshotFromOverlay(createGeminiVisitingTrainingRecruitFormDraft())
    ).toMatchSnapshot('default-snapshot')
  })
})
