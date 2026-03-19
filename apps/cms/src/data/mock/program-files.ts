/**
 * 프로그램 파일 업로드 내역 Mock 데이터
 * 수강 프로그램 상세 모달 — 파일 및 사진 탭
 * mockPrograms의 programId와 연동, 필요 시 mockProgramPosts의 postId와 연동
 */

import type { ProgramFile, UUID } from '../../types'
import { mockPrograms } from './programs'
import { mockProgramPosts } from './program-posts'

/** HSBC/HKU Business Case Competition 2026 + 강서초등학교 게시글 첨부파일 */
const HSBC_ECONOMY_PROGRAM_ID = 'economy-prog-001' as UUID
const POST_HSBC_GS_002 = 'post-hsbc-gs-002' as UUID

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
  return (byProgramId.get(programId) ?? []).slice()
}

export const mockProgramFilesMap = new Map(mockProgramFiles.map(f => [f.id, f]))
