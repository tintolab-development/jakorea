/**
 * 기본 정보 섹션 (프로그램 상세 정보 탭)
 * - 상단 테이블: 등록일, 수정일, 모집 상태, 진행 상태
 * - 하위 테이블: 썸네일 ~ 비고
 */

import { useEffect, useState } from 'react'
import { Image, Radio, Select } from 'antd'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import { FileSelectField } from '@/shared/ui/file-select-field'
import {
  formatDate,
  formatDateOnly,
  formatDateRange,
  getRecruitmentStatusValue,
  getThumbnailFilename,
  RECRUITMENT_RADIO_OPTIONS,
  CATEGORY_LABEL,
  TARGET_LEVEL_LABEL,
  LIFECYCLE_OPTIONS,
} from './program-detail-info-constants'

export interface BasicInfoSectionProps {
  program: Program
  sponsorName?: string
  createdByName?: string
  updatedByName?: string
  lifecycleStatus?: ProgramLifecycleStatus
  onLifecycleStatusChange?: (status: ProgramLifecycleStatus) => void
}

export function BasicInfoSection({
  program,
  sponsorName,
  createdByName,
  updatedByName,
  lifecycleStatus,
  onLifecycleStatusChange,
}: BasicInfoSectionProps) {
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null)

  const recruitmentValue = getRecruitmentStatusValue(program)
  const thumbnailUrl = program.keyVisualImage || program.posterImage
  const thumbnailFilename = thumbnailUrl ? getThumbnailFilename(thumbnailUrl) : ''

  // 선택한 썸네일 파일의 미리보기 URL 생성/해제
  useEffect(() => {
    if (!selectedThumbnailFile) {
      setThumbnailPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(selectedThumbnailFile)
    setThumbnailPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedThumbnailFile])

  const displayThumbnailUrl = thumbnailPreviewUrl || thumbnailUrl
  const displayThumbnailFilename = selectedThumbnailFile
    ? selectedThumbnailFile.name
    : thumbnailUrl
      ? thumbnailFilename
      : '파일명.jpg'
  const totalCapacity = program.rounds?.reduce((sum, r) => sum + (r.capacity ?? 0), 0) ?? 0
  const categoryLabel = CATEGORY_LABEL[program.category] ?? program.category ?? '-'
  const typeValue = program.type
  const targetLabel = program.targetLevel
    ? TARGET_LEVEL_LABEL[program.targetLevel] ?? program.targetLevel
    : '-'
  const educationTarget = [targetLabel, program.district].filter(Boolean).join(' | ') || '-'
  const contactLine1Parts = [
    sponsorName && `문의처 : ${sponsorName}`,
    program.contactPhone && `Tel : ${program.contactPhone}`,
    program.contactEmail && `E-mail : ${program.contactEmail}`,
  ].filter(Boolean)
  const contactLine1 = contactLine1Parts.length ? contactLine1Parts.join(' | ') : '-'
  const contactLine2 = '운영시간 : 평일 9:00 ~ 16:00 (점심시간 12:00 ~ 13:00 제외)'

  return (
    <section className="program-detail-info-tab__section">
      <h3 className="program-detail-info-tab__section-title">기본 정보</h3>

      {/* 상단 테이블: 최초 등록일, 마지막 수정일, 모집 상태, 프로그램 진행 상태 */}
      <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-detail-info-tab__table--top">
          <tbody>
            <tr>
              <th>최초 등록일</th>
              <td>{formatDate(program.createdAt)} | {createdByName ?? '-'}</td>
              <th>마지막 수정일</th>
              <td>{formatDate(program.updatedAt)} | {updatedByName ?? '-'}</td>
            </tr>
            <tr>
              <th>모집 상태</th>
              <td>
                <Radio.Group value={recruitmentValue} options={RECRUITMENT_RADIO_OPTIONS} disabled />
              </td>
              <th>프로그램 진행 상태</th>
              <td>
                <Select<ProgramLifecycleStatus>
                  value={lifecycleStatus}
                  options={LIFECYCLE_OPTIONS}
                  placeholder="진행 상태 선택"
                  className="program-detail-info-tab__lifecycle-select"
                  onChange={value => value != null && onLifecycleStatusChange?.(value)}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 하위 테이블: 썸네일 이미지 ~ 비고 */}
      <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--sub">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-detail-info-tab__table--sub">
          <tbody>
            <tr>
              <th>썸네일 이미지</th>
              <td colSpan={3}>
                <div className="program-detail-info-tab__thumbnail-wrap">
                  <div className="program-detail-info-tab__thumbnail-row">
                    {displayThumbnailUrl ? (
                      <Image
                        src={displayThumbnailUrl}
                        alt={program.title}
                        className="program-detail-info-tab__thumbnail-img"
                        preview={{ mask: '확대 보기' }}
                      />
                    ) : (
                      <div className="program-detail-info-tab__thumbnail-placeholder-box">
                        이미지 없음
                      </div>
                    )}
                    <div className="program-detail-info-tab__thumbnail-meta">
                      <div className="program-detail-info-tab__thumbnail-filename-row">
                        <span className="program-detail-info-tab__thumbnail-filename">
                          {displayThumbnailFilename}
                        </span>
                      </div>
                      <FileSelectField
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        guideLines={[
                          '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다. / 가로 사이즈 500px 권장, 세로 사이즈 무관',
                          '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
                        ]}
                        onFilesChange={(files) => {
                          const file = files[0]
                          setSelectedThumbnailFile(file ?? null)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <th>프로그램 명</th>
              <td>{program.title}</td>
              <th>프로그램 운영 기간</th>
              <td>{formatDateRange(program.startDate, program.endDate)}</td>
            </tr>
            <tr>
              <th>수강 유형 구분</th>
              <td>{categoryLabel}</td>
              <th>교육 대상</th>
              <td>{educationTarget}</td>
            </tr>
            <tr>
              <th>모집 인원</th>
              <td>
                {totalCapacity > 0
                  ? `${totalCapacity} (신청자가 아닌 승인된 수강자 기준)`
                  : '-'}
              </td>
              <th>프로그램 진행 방식</th>
              <td>
                <Radio.Group
                  value={typeValue}
                  options={[
                    { value: 'online', label: '온라인' },
                    { value: 'offline', label: '오프라인' },
                  ]}
                  disabled
                />
              </td>
            </tr>
            <tr>
              <th>모집 기간</th>
              <td>
                {program.applicationStartDate && program.applicationEndDate
                  ? `${formatDateOnly(program.applicationStartDate)} ~ ${formatDateOnly(program.applicationEndDate)}`
                  : '-'}
              </td>
              <th>결과 발표일 및 방법</th>
              <td>
                {program.applicationEndDate
                  ? `${formatDateOnly(program.applicationEndDate)} | 홈페이지 공지 및 담당교사 개별 안내`
                  : '-'}
              </td>
            </tr>
            <tr>
              <th>교육 분야</th>
              <td>{program.businessArea ?? '-'}</td>
              <th>후원사</th>
              <td>{sponsorName ?? '-'}</td>
            </tr>
            <tr>
              <th>문의처</th>
              <td colSpan={3} className="program-detail-info-tab__contact-cell">
                {contactLine1} | {contactLine2}
              </td>
            </tr>
            <tr>
              <th>비고</th>
              <td colSpan={3}>{program.oneLineIntroduction ?? '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
