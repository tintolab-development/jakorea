/**
 * 프로그램 파일 업로드 내역 Mock 데이터
 * 수강 프로그램 상세 모달 — 파일 및 사진 탭
 * mockPrograms의 programId와 연동, 필요 시 mockProgramPosts의 postId와 연동
 */

import type { ProgramFile, UUID } from '../../types'
import { mockPrograms } from './programs'
import {
  GENERAL_PARTICIPATING_SCHOOLS_PROGRAM_ID,
  mockProgramPosts,
  UJAT_EDUCATION_IN_PROGRESS_PROGRAM_ID,
} from './program-posts'

/** HSBC/HKU Business Case Competition 2026 + 강서초등학교 게시글 첨부파일 */
const HSBC_ECONOMY_PROGRAM_ID = 'economy-prog-001' as UUID
const POST_HSBC_GS_002 = 'post-hsbc-gs-002' as UUID
const POST_GENERAL_ORG_SCHOOL1_002 = 'post-general-org-school1-002' as UUID

function date(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

/** programId별 첨부 파일 목록 생성. 게시글별로 다른 파일 연동 (postId) */
function buildFiles(): ProgramFile[] {
  const programIds = mockPrograms.slice(0, 10).map(p => p.id)
  const postsByProgram = new Map<UUID, Array<{ id: UUID; attachmentCount: number }>>()
  mockProgramPosts.forEach(p => {
    const list = postsByProgram.get(p.programId) ?? []
    list.push({ id: p.id, attachmentCount: p.attachmentCount })
    postsByProgram.set(p.programId, list)
  })

  const fileTemplates: Array<{ name: string; fileType: string }> = [
    { name: '(2026) JA Korea 경제금융교육 강사단 지침 및 일정표', fileType: 'pdf' },
    { name: '강사 대기실 변경 안내도_기존 대기실', fileType: 'pdf' },
    { name: '참여학교_학급별_교육일정_2026_1학기', fileType: 'xls' },
    { name: '교재 배송 현황', fileType: 'xlsx' },
    { name: '만족도 설문 문항 (참고용)', fileType: 'pdf' },
    { name: '교육자료_1회차_요약', fileType: 'pdf' },
    { name: '공지 이미지_대기실 위치', fileType: 'png' },
    { name: 'FAQ_질의응답 정리', fileType: 'pdf' },
  ]

  const files: ProgramFile[] = []
  let idSeq = 1

  programIds.forEach((programId, idx) => {
    const programPosts = postsByProgram.get(programId) ?? []
    if (programPosts.length > 0) {
      programPosts.forEach((post, postIdx) => {
        const fileCount = Math.min(post.attachmentCount, 3)
        for (let i = 0; i < fileCount; i++) {
          const template = fileTemplates[(idx + postIdx * 2 + i) % fileTemplates.length]
          const uploadedAt = date(25 - idx - postIdx - i)
          files.push({
            id: `pfile-${String(idSeq).padStart(3, '0')}` as UUID,
            programId,
            postId: post.id,
            fileName: template.name + (fileCount > 1 ? `_${i + 1}` : ''),
            fileType: template.fileType,
            fileSize: (100 + idx * 50 + postIdx * 10 + i * 20) * 1024,
            fileUrl: `#mock-file-${programId}-${idSeq}`,
            uploadedAt,
            createdAt: uploadedAt,
            updatedAt: uploadedAt,
          })
          idSeq += 1
        }
      })
    } else {
      const fileCount = idx === 0 ? 5 : idx < 3 ? 3 : 2
      for (let i = 0; i < fileCount; i++) {
        const template = fileTemplates[(idx + i) % fileTemplates.length]
        const uploadedAt = date(25 - idx - i)
        files.push({
          id: `pfile-${String(idSeq).padStart(3, '0')}` as UUID,
          programId,
          postId: undefined,
          fileName: template.name + (fileCount > 1 && i > 0 ? ` (${i + 1})` : ''),
          fileType: template.fileType,
          fileSize: (100 + idx * 50 + i * 20) * 1024,
          fileUrl: `#mock-file-${programId}-${idSeq}`,
          uploadedAt,
          createdAt: uploadedAt,
          updatedAt: uploadedAt,
        })
        idSeq += 1
      }
    }
  })

  // UJAT — 시안용 명시 첨부 (자동 생성 파일 대체)
  const UJAT_PROGRAM_ID = 'ujat-progress-education-in-progress' as UUID
  const ujatExplicitPostIds = new Set<UUID>([
    'post-ujat-gwangju-jinwol-2',
    'post-ujat-gwangju-jinwol-4',
    'post-ujat-gwangju-jinwol-5',
    'post-ujat-seoul-5-1',
    'post-ujat-seoul-3-1',
    'post-ujat-seoul-4-2',
    'post-ujat-seoul-2-2',
  ] as UUID[])
  const withoutUjatExplicitAutoFiles = files.filter(
    f => !f.postId || !ujatExplicitPostIds.has(f.postId)
  )
  files.length = 0
  files.push(...withoutUjatExplicitAutoFiles)

  const ujatGwangjuLectureAt = new Date(2026, 0, 10, 10, 0, 0).toISOString()
  const ujatGwangjuVolunteerAt = new Date(2026, 0, 3, 16, 30, 0).toISOString()
  const ujatGwangjuScheduleAt = new Date(2025, 11, 20, 11, 0, 0).toISOString()
  const ujatSeoul5NoticeAt = new Date(2026, 0, 14, 14, 0, 0).toISOString()
  const ujatSeoul3NoticeAt = new Date(2026, 0, 12, 14, 0, 0).toISOString()
  const ujatSeoul4VolunteerAt = new Date(2026, 0, 14, 9, 30, 0).toISOString()
  const ujatSeoul2NoticeAt = new Date(2026, 0, 6, 10, 0, 0).toISOString()

  files.push(
    {
      id: 'pfile-ujat-gwangju-001' as UUID,
      programId: UJAT_PROGRAM_ID,
      postId: 'post-ujat-gwangju-jinwol-2' as UUID,
      fileName: '(2026) JA Korea 초등 경제교육 강사단 지침 및 일정표',
      fileType: 'pdf',
      fileSize: 18 * 1024 * 1024,
      fileUrl: '#mock-file-ujat-gwangju-001',
      uploadedAt: ujatGwangjuLectureAt,
      createdAt: ujatGwangjuLectureAt,
      updatedAt: ujatGwangjuLectureAt,
    },
    {
      id: 'pfile-ujat-gwangju-002' as UUID,
      programId: UJAT_PROGRAM_ID,
      postId: 'post-ujat-gwangju-jinwol-2' as UUID,
      fileName: '2회차 강의 자료_모의 면접 체크리스트',
      fileType: 'xlsx',
      fileSize: 2 * 1024 * 1024,
      fileUrl: '#mock-file-ujat-gwangju-002',
      uploadedAt: ujatGwangjuLectureAt,
      createdAt: ujatGwangjuLectureAt,
      updatedAt: ujatGwangjuLectureAt,
    },
    {
      id: 'pfile-ujat-gwangju-003' as UUID,
      programId: UJAT_PROGRAM_ID,
      postId: 'post-ujat-gwangju-jinwol-4' as UUID,
      fileName: '4월 17일 학급 이동 동선 안내도',
      fileType: 'png',
      fileSize: 840 * 1024,
      fileUrl: '#mock-file-ujat-gwangju-003',
      uploadedAt: ujatGwangjuVolunteerAt,
      createdAt: ujatGwangjuVolunteerAt,
      updatedAt: ujatGwangjuVolunteerAt,
    },
    {
      id: 'pfile-ujat-gwangju-004' as UUID,
      programId: UJAT_PROGRAM_ID,
      postId: 'post-ujat-gwangju-jinwol-5' as UUID,
      fileName: '진월초등학교_4월 교육 일정표',
      fileType: 'pdf',
      fileSize: 3 * 1024 * 1024,
      fileUrl: '#mock-file-ujat-gwangju-004',
      uploadedAt: ujatGwangjuScheduleAt,
      createdAt: ujatGwangjuScheduleAt,
      updatedAt: ujatGwangjuScheduleAt,
    },
    {
      id: 'pfile-ujat-seoul5-001' as UUID,
      programId: UJAT_PROGRAM_ID,
      postId: 'post-ujat-seoul-5-1' as UUID,
      fileName: '서울신동초_1학기 교육 안내문',
      fileType: 'pdf',
      fileSize: 12 * 1024 * 1024,
      fileUrl: '#mock-file-ujat-seoul5-001',
      uploadedAt: ujatSeoul5NoticeAt,
      createdAt: ujatSeoul5NoticeAt,
      updatedAt: ujatSeoul5NoticeAt,
    },
    {
      id: 'pfile-ujat-seoul5-002' as UUID,
      programId: UJAT_PROGRAM_ID,
      postId: 'post-ujat-seoul-5-1' as UUID,
      fileName: '교재 배송 확인서_서울신동초',
      fileType: 'xlsx',
      fileSize: 1 * 1024 * 1024,
      fileUrl: '#mock-file-ujat-seoul5-002',
      uploadedAt: ujatSeoul5NoticeAt,
      createdAt: ujatSeoul5NoticeAt,
      updatedAt: ujatSeoul5NoticeAt,
    },
    {
      id: 'pfile-ujat-seoul3-001' as UUID,
      programId: UJAT_PROGRAM_ID,
      postId: 'post-ujat-seoul-3-1' as UUID,
      fileName: '서울숭인초_교육 일정표_2026_1학기',
      fileType: 'pdf',
      fileSize: 5 * 1024 * 1024,
      fileUrl: '#mock-file-ujat-seoul3-001',
      uploadedAt: ujatSeoul3NoticeAt,
      createdAt: ujatSeoul3NoticeAt,
      updatedAt: ujatSeoul3NoticeAt,
    },
    {
      id: 'pfile-ujat-seoul4-001' as UUID,
      programId: UJAT_PROGRAM_ID,
      postId: 'post-ujat-seoul-4-2' as UUID,
      fileName: '1회차 수업_학급별 인원 현황',
      fileType: 'xls',
      fileSize: 512 * 1024,
      fileUrl: '#mock-file-ujat-seoul4-001',
      uploadedAt: ujatSeoul4VolunteerAt,
      createdAt: ujatSeoul4VolunteerAt,
      updatedAt: ujatSeoul4VolunteerAt,
    },
    {
      id: 'pfile-ujat-seoul2-001' as UUID,
      programId: UJAT_PROGRAM_ID,
      postId: 'post-ujat-seoul-2-2' as UUID,
      fileName: '프로그램 참여 신청 서류 안내',
      fileType: 'pdf',
      fileSize: 2 * 1024 * 1024,
      fileUrl: '#mock-file-ujat-seoul2-001',
      uploadedAt: ujatSeoul2NoticeAt,
      createdAt: ujatSeoul2NoticeAt,
      updatedAt: ujatSeoul2NoticeAt,
    }
  )

  // 일반 프로그램 참여 기관 상세 — 강서초등학교 게시글·파일 사이드바 시안
  const generalOrgUploadedAt = new Date(2026, 0, 15, 10, 0, 0).toISOString()
  const generalOrgVolunteerAt = new Date(2026, 5, 21, 14, 0, 0).toISOString()
  const generalOrgExcelAt = new Date(2026, 5, 12, 11, 0, 0).toISOString()
  files.push(
    {
      id: 'pfile-general-org-001' as UUID,
      programId: GENERAL_PARTICIPATING_SCHOOLS_PROGRAM_ID,
      postId: POST_GENERAL_ORG_SCHOOL1_002,
      fileName: '(2026) JA Korea 경제금융교육 강사단 지침 및 일정표',
      fileType: 'pdf',
      fileSize: 18 * 1024 * 1024,
      fileUrl: '#mock-file-general-org-001',
      uploadedAt: generalOrgUploadedAt,
      createdAt: generalOrgUploadedAt,
      updatedAt: generalOrgUploadedAt,
    },
    {
      id: 'pfile-general-org-002' as UUID,
      programId: GENERAL_PARTICIPATING_SCHOOLS_PROGRAM_ID,
      postId: POST_GENERAL_ORG_SCHOOL1_002,
      fileName: '2회차 강의 자료_모의 면접 체크리스트',
      fileType: 'xlsx',
      fileSize: 2 * 1024 * 1024,
      fileUrl: '#mock-file-general-org-002',
      uploadedAt: new Date(2026, 0, 10, 10, 0, 0).toISOString(),
      createdAt: new Date(2026, 0, 10, 10, 0, 0).toISOString(),
      updatedAt: new Date(2026, 0, 10, 10, 0, 0).toISOString(),
    },
    {
      id: 'pfile-general-org-003' as UUID,
      programId: GENERAL_PARTICIPATING_SCHOOLS_PROGRAM_ID,
      fileName: '6월 자원봉사자 프로그램 참여자 모집 안내',
      fileType: 'png',
      fileSize: 3 * 1024 * 1024,
      fileUrl: '#mock-file-general-org-003',
      uploadedAt: generalOrgVolunteerAt,
      createdAt: generalOrgVolunteerAt,
      updatedAt: generalOrgVolunteerAt,
    },
    {
      id: 'pfile-general-org-004' as UUID,
      programId: GENERAL_PARTICIPATING_SCHOOLS_PROGRAM_ID,
      fileName: '엑셀 (Excel) 활동 샘플',
      fileType: 'xls',
      fileSize: 1 * 1024 * 1024,
      fileUrl: '#mock-file-general-org-004',
      uploadedAt: generalOrgExcelAt,
      createdAt: generalOrgExcelAt,
      updatedAt: generalOrgExcelAt,
    }
  )

  // HSBC/HKU Business Case Competition 2026 모집 안내_강서초등학교 — 김틴토 강사님 게시글 첨부 2개
  const hsbcUploadedAt = new Date(2026, 0, 10, 10, 0, 0).toISOString()
  files.push(
    {
      id: 'pfile-hsbc-gs-001' as UUID,
      programId: HSBC_ECONOMY_PROGRAM_ID,
      postId: POST_HSBC_GS_002,
      fileName: '(2026) 나를 보여주는 기술_면접 가이드',
      fileType: 'pdf',
      fileSize: 18 * 1024 * 1024,
      fileUrl: '#mock-file-hsbc-gs-001',
      uploadedAt: hsbcUploadedAt,
      createdAt: hsbcUploadedAt,
      updatedAt: hsbcUploadedAt,
    },
    {
      id: 'pfile-hsbc-gs-002' as UUID,
      programId: HSBC_ECONOMY_PROGRAM_ID,
      postId: POST_HSBC_GS_002,
      fileName: '2회차 강의 자료_모의 면접 체크리스트',
      fileType: 'xlsx',
      fileSize: 2 * 1024 * 1024,
      fileUrl: '#mock-file-hsbc-gs-002',
      uploadedAt: hsbcUploadedAt,
      createdAt: hsbcUploadedAt,
      updatedAt: hsbcUploadedAt,
    }
  )

  return files
}

export const mockProgramFiles: ProgramFile[] = buildFiles()

const byProgramId = new Map<UUID, ProgramFile[]>()
mockProgramFiles.forEach(file => {
  const list = byProgramId.get(file.programId) ?? []
  list.push(file)
  byProgramId.set(file.programId, list)
})
byProgramId.forEach(list =>
  list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
)

/** 프로그램 ID로 파일 목록 조회 (최신순) */
export function getProgramFilesByProgramId(programId: UUID): ProgramFile[] {
  const list = byProgramId.get(programId) ?? []
  if (list.length > 0) return list.slice()
  if (programId.startsWith('general-prog')) {
    return (byProgramId.get(GENERAL_PARTICIPATING_SCHOOLS_PROGRAM_ID) ?? []).slice()
  }
  if (programId.startsWith('ujat-progress-')) {
    return (byProgramId.get(UJAT_EDUCATION_IN_PROGRESS_PROGRAM_ID) ?? []).slice()
  }
  return []
}

export const mockProgramFilesMap = new Map(mockProgramFiles.map(f => [f.id, f]))

/** 게시글 등록 시 업로드된 첨부파일을 목록에 추가 (우측 첨부파일 카드 갱신용) */
export interface AddProgramFileItem {
  fileName: string
  fileUrl?: string
  fileSize?: number
}

let createdFileIdSeq = 10000

export function addProgramFiles(
  programId: UUID,
  postId: UUID,
  items: AddProgramFileItem[]
): ProgramFile[] {
  const now = new Date().toISOString()
  const added: ProgramFile[] = []
  for (const item of items) {
    const id = `pfile-created-${++createdFileIdSeq}` as UUID
    const ext = item.fileName.substring(item.fileName.lastIndexOf('.')).toLowerCase()
    const file: ProgramFile = {
      id,
      programId,
      postId,
      fileName: item.fileName,
      fileType: ext.replace('.', '') || undefined,
      fileSize: item.fileSize,
      fileUrl: item.fileUrl,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    }
    added.push(file)
    let list = byProgramId.get(programId)
    if (!list) {
      list = []
      byProgramId.set(programId, list)
    }
    list.push(file)
  }
  const list = byProgramId.get(programId)
  if (list) {
    list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  }
  return added
}
