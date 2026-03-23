/**
 * 전체 파일 및 사진 모달
 * 수강 프로그램 상세 > 게시글 탭 > 파일 및 사진 "더보기" 클릭 시 노출
 * 프로그램에 등록된 모든 파일 표시, 파일명 검색 지원
 */

import { useState, useMemo, useEffect } from 'react'
import { Dropdown, type MenuProps } from 'antd'
import { TealHeaderModal } from '@/shared/ui'
import { AppButton } from '@/shared/ui'
import type { ProgramFile, ProgramPost } from '@/types/domain'
import dayjs from 'dayjs'
import './program-files-modal.css'

// ── 유틸 ─────────────────────────────────────────────

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${Math.round(mb)}MB`
  const kb = bytes / 1024
  return `${Math.round(kb)}KB`
}

function getFileExt(fileName: string, fileType?: string): string {
  const ext = fileType ?? fileName.split('.').pop() ?? ''
  return ext.toLowerCase()
}

// ── 파일 타입 아이콘 ──────────────────────────────────

function ImageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="#fff"/>
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <g opacity="0.5">
        <mask id="mask0_1220_42910" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30">
          <rect width="30" height="30" fill="#D9D9D9"/>
        </mask>
        <g mask="url(#mask0_1220_42910)">
          <path d="M15 24.0872C14.4844 24.0872 14.043 23.9035 13.6759 23.5363C13.3086 23.1692 13.125 22.7278 13.125 22.2122C13.125 21.6966 13.3086 21.2551 13.6759 20.8878C14.043 20.5207 14.4844 20.3372 15 20.3372C15.5156 20.3372 15.957 20.5207 16.3241 20.8878C16.6914 21.2551 16.875 21.6966 16.875 22.2122C16.875 22.7278 16.6914 23.1692 16.3241 23.5363C15.957 23.9035 15.5156 24.0872 15 24.0872ZM15 16.8756C14.4844 16.8756 14.043 16.692 13.6759 16.3247C13.3086 15.9576 13.125 15.5163 13.125 15.0006C13.125 14.485 13.3086 14.0436 13.6759 13.6766C14.043 13.3093 14.4844 13.1256 15 13.1256C15.5156 13.1256 15.957 13.3093 16.3241 13.6766C16.6914 14.0436 16.875 14.485 16.875 15.0006C16.875 15.5163 16.6914 15.9576 16.3241 16.3247C15.957 16.692 15.5156 16.8756 15 16.8756ZM15 9.66406C14.4844 9.66406 14.043 9.48052 13.6759 9.11344C13.3086 8.74615 13.125 8.30469 13.125 7.78906C13.125 7.27344 13.3086 6.83208 13.6759 6.465C14.043 6.09771 14.4844 5.91406 15 5.91406C15.5156 5.91406 15.957 6.09771 16.3241 6.465C16.6914 6.83208 16.875 7.27344 16.875 7.78906C16.875 8.30469 16.6914 8.74615 16.3241 9.11344C15.957 9.48052 15.5156 9.66406 15 9.66406Z" fill="#3D3D3D"/>
        </g>
      </g>
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

interface FileTypeIconProps {
  fileName: string
  fileType?: string
}

function FileTypeIcon({ fileName, fileType }: FileTypeIconProps) {
  const ext = getFileExt(fileName, fileType)

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return (
      <div className="program-files-modal__file-icon program-files-modal__file-icon--img">
        <ImageIcon />
      </div>
    )
  }
  if (ext === 'pdf') {
    return <div className="program-files-modal__file-icon program-files-modal__file-icon--pdf">PDF</div>
  }
  if (['xls', 'xlsx'].includes(ext)) {
    return <div className="program-files-modal__file-icon program-files-modal__file-icon--xls">XLS</div>
  }
  if (['doc', 'docx'].includes(ext)) {
    return <div className="program-files-modal__file-icon program-files-modal__file-icon--doc">DOC</div>
  }
  return <div className="program-files-modal__file-icon program-files-modal__file-icon--etc">FILE</div>
}

// ── 메인 컴포넌트 ─────────────────────────────────────

export interface ProgramFilesModalProps {
  open: boolean
  onCancel: () => void
  files: ProgramFile[]
  posts: ProgramPost[]
}

const FILE_SEARCH_DEBOUNCE_MS = 280

export function ProgramFilesModal({ open, onCancel, files, posts }: ProgramFilesModalProps) {
  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  useEffect(() => {
    if (searchInput.trim() === '') {
      setSearchDebounced('')
      return
    }
    const t = setTimeout(() => setSearchDebounced(searchInput), FILE_SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput])

  const postMap = useMemo(() => {
    const map = new Map<string, ProgramPost>()
    posts.forEach(p => map.set(p.id, p))
    return map
  }, [posts])

  const filtered = useMemo(() => {
    const q = searchDebounced.trim().toLowerCase()
    if (!q) return files
    return files.filter(f => f.fileName.toLowerCase().includes(q))
  }, [files, searchDebounced])

  const getMenuItems = (file: ProgramFile): MenuProps['items'] => [
    { key: 'download', label: '다운로드' },
    ...(file.postId ? [{ key: 'original', label: '원글보기' }] : []),
  ]

  return (
    <TealHeaderModal
      open={open}
      onCancel={onCancel}
      title="전체 파일 및 사진"
      width={740}
      className="program-files-modal"
      footer={
        <AppButton variant="cancel" size="large" onClick={onCancel}>
          닫기
        </AppButton>
      }
    >
      {/* 검색 */}
      <div className="program-files-modal__search-wrap">
        <span className="program-files-modal__search-icon">
          <SearchIcon />
        </span>
        <input
          className="program-files-modal__search"
          placeholder="파일명 검색"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
      </div>

      {/* 파일 목록 */}
      <div className="program-files-modal__list">
        {filtered.length === 0 ? (
          <p className="program-files-modal__empty">파일이 없습니다.</p>
        ) : (
          filtered.map(file => {
            const uploader = file.postId ? postMap.get(file.postId)?.authorName : undefined
            const dateStr = dayjs(file.uploadedAt).format('YYYY년 M월 D일')
            const size = formatFileSize(file.fileSize)

            return (
              <div key={file.id} className="program-files-modal__item">
                <FileTypeIcon fileName={file.fileName} fileType={file.fileType} />

                <div className="program-files-modal__file-info">
                  <div className="program-files-modal__file-name">{file.fileName}</div>
                  <div className="program-files-modal__file-meta">
                    <span>{dateStr}</span>
                    {uploader && (
                      <>
                        <span className="program-files-modal__file-meta-sep">|</span>
                        <span>{uploader}</span>
                      </>
                    )}
                    {size && (
                      <>
                        <span className="program-files-modal__file-meta-sep">|</span>
                        <span>{size}</span>
                      </>
                    )}
                  </div>
                </div>

                <Dropdown menu={{ items: getMenuItems(file) }} trigger={['click']} placement="bottomRight">
                  <button
                    type="button"
                    className="program-files-modal__menu-btn"
                    aria-label="파일 메뉴"
                  >
                    <DotsIcon />
                  </button>
                </Dropdown>
              </div>
            )
          })
        )}
      </div>
    </TealHeaderModal>
  )
}
