/**
 * 기본 정보 섹션 (프로그램 상세 정보 탭)
 * - 상단 테이블: 최초 등록일, 마지막 수정일, 프로그램 진행 방식, 프로그램 진행 상태
 * - 하위 테이블: 썸네일, 프로그램명, 운영 기간, 수강자 유형, 교육 분야, 교육 대상, 교육 대상 상세, 후원사, 후원사 담당자, 문의처, 비고
 * - 수강자 모집 테이블: 모집 인원, 모집 현황, 모집 기간, 결과 발표일 및 방법
 * - 강사 모집 테이블: 모집 인원, 모집 현황, 기간, 1차/2차/최종 발표 (표시)
 * - 수정 모드: react-hook-form Controller, 기존 프로그램 값이 default로 채워짐
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Image, Input, Radio, Select, DatePicker } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { Controller } from 'react-hook-form'
import { useSponsorStore } from '@/features/sponsor/model/sponsor-store'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '../model/program-detail-edit-schema'
import { FileSelectField } from '@/shared/ui/file-select-field'
import {
  formatDate,
  formatDateOnly,
  formatDateRange,
  getRecruitmentStatus,
  getInstructorRecruitmentStatus,
  getThumbnailFilename,
  RECRUITMENT_RADIO_OPTIONS,
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
  TARGET_LEVEL_LABEL,
  TYPE_LABEL,
  LIFECYCLE_OPTIONS,
  BUSINESS_AREA_OPTIONS,
} from './program-detail-info-constants'
import { RecruitmentStatusBadge } from '@/shared/ui/recruitment-status-badge'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

const { TextArea } = Input

export interface BasicInfoSectionProps {
  program: Program
  sponsorName?: string
  createdByName?: string
  updatedByName?: string
  lifecycleStatus?: ProgramLifecycleStatus
  onLifecycleStatusChange?: (status: ProgramLifecycleStatus) => void
  isEditMode?: boolean
  /** 수정 모드일 때만 전달, react-hook-form 인스턴스 */
  form?: UseFormReturn<ProgramDetailEditFormValues>
}

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)
const toIso = (d: Dayjs | null) => (d ? d.toISOString() : undefined)

export function BasicInfoSection({
  program,
  sponsorName,
  createdByName,
  updatedByName,
  lifecycleStatus,
  onLifecycleStatusChange,
  isEditMode = false,
  form,
}: BasicInfoSectionProps) {
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null)
  const { sponsors, fetchSponsors } = useSponsorStore()

  useEffect(() => {
    fetchSponsors()
  }, [fetchSponsors])

  const thumbnailUrl = program.keyVisualImage || program.posterImage
  const thumbnailFilename = thumbnailUrl ? getThumbnailFilename(thumbnailUrl) : ''

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
    ? (TARGET_LEVEL_LABEL[program.targetLevel] ?? program.targetLevel)
    : '-'
  const contactLine1Parts = [
    sponsorName && `문의처 : ${sponsorName}`,
    program.contactPhone && `Tel : ${program.contactPhone}`,
    program.contactEmail && `E-mail : ${program.contactEmail}`,
  ].filter(Boolean)
  const contactLine1 = contactLine1Parts.length ? contactLine1Parts.join(' | ') : '-'
  const contactLine2 = '운영시간 : 평일 9:00~16:00 (점심시간 12:00~13:00 제외)'

  const isFormEdit = isEditMode && form

  return (
    <section className="program-detail-info-tab__section">
      <h3 className="program-detail-info-tab__section-title">기본 정보</h3>

      <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-detail-info-tab__table--top">
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
            <col style={{ width: '200px' }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>최초 등록일</th>
              <td>
                {formatDate(program.createdAt)} | {createdByName ?? '-'}
              </td>
              <th>마지막 수정일</th>
              <td>
                {formatDate(program.updatedAt)} | {updatedByName ?? '-'}
              </td>
            </tr>
            <tr>
              <th>
                프로그램 진행 방식{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="type"
                    control={form.control}
                    render={({ field }) => (
                      <Radio.Group
                        value={field.value}
                        options={[
                          { value: 'online', label: '온라인' },
                          { value: 'offline', label: '오프라인' },
                          { value: 'hybrid', label: '온/오프라인' },
                        ]}
                        onChange={e => field.onChange(e.target.value)}
                      />
                    )}
                  />
                ) : (
                  (TYPE_LABEL[typeValue] ?? typeValue ?? '-')
                )}
              </td>
              <th>
                프로그램 진행 상태{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                <Select<ProgramLifecycleStatus>
                  value={lifecycleStatus}
                  options={LIFECYCLE_OPTIONS}
                  placeholder="진행 상태 선택"
                  className="program-detail-info-tab__lifecycle-select"
                  disabled={!onLifecycleStatusChange}
                  onChange={value => value != null && onLifecycleStatusChange?.(value)}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--sub">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic program-detail-info-tab__table--sub">
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
            <col style={{ width: '200px' }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>
                썸네일 이미지{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
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
                        {isEditMode && (displayThumbnailUrl || selectedThumbnailFile) && (
                          <button
                            type="button"
                            className="program-detail-info-tab__thumbnail-remove"
                            onClick={() => {
                              setSelectedThumbnailFile(null)
                              if (form) {
                                form.setValue('keyVisualImage', undefined)
                                form.setValue('posterImage', undefined)
                              }
                            }}
                            aria-label="썸네일 이미지 제거"
                          >
                            <CloseOutlined />
                          </button>
                        )}
                      </div>
                      <FileSelectField
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        disabled={!isEditMode}
                        className={
                          isEditMode
                            ? 'file-select-field--edit program-detail-info-tab__file-select'
                            : 'program-detail-info-tab__file-select'
                        }
                        guideLines={[
                          '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다. / 가로 사이즈 500px 권장, 세로 사이즈 무관',
                          '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
                        ]}
                        onFilesChange={files => {
                          const file = files[0]
                          setSelectedThumbnailFile(file ?? null)
                          if (file && form) {
                            const url = URL.createObjectURL(file)
                            form.setValue('keyVisualImage', url)
                            form.setValue('posterImage', url)
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <th>
                프로그램 명{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="title"
                    control={form.control}
                    render={({ field }) => <Input {...field} placeholder="프로그램명" />}
                  />
                ) : (
                  program.title
                )}
              </td>
              <th>
                프로그램 운영 기간{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__date-range">
                    <Controller
                      name="startDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <Controller
                      name="endDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                  </div>
                ) : (
                  formatDateRange(program.startDate, program.endDate)
                )}
              </td>
            </tr>
            <tr>
              <th>
                수강자 유형{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="category"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={CATEGORY_OPTIONS}
                        style={{ width: '100%' }}
                        onChange={v => v && field.onChange(v)}
                      />
                    )}
                  />
                ) : (
                  categoryLabel
                )}
              </td>
              <th>
                교육 분야{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="businessArea"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? undefined}
                        options={BUSINESS_AREA_OPTIONS}
                        onChange={v => field.onChange(v ?? undefined)}
                        style={{ width: '100%' }}
                        allowClear
                      />
                    )}
                  />
                ) : (
                  (program.businessArea ?? '-')
                )}
              </td>
            </tr>
            <tr>
              <th>교육 대상</th>
              <td>
                {isFormEdit && form ? (
                  <Controller
                    name="targetLevel"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? undefined}
                        options={Object.entries(TARGET_LEVEL_LABEL).map(([value, label]) => ({
                          value,
                          label,
                        }))}
                        onChange={v =>
                          field.onChange((v as 'elementary' | 'middle' | 'high') || undefined)
                        }
                        placeholder="대상"
                        style={{ width: '100%' }}
                        allowClear
                      />
                    )}
                  />
                ) : (
                  targetLabel || '-'
                )}
              </td>
              <th>교육 대상 상세</th>
              <td>
                {isFormEdit && form ? (
                  <Controller
                    name="district"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value || undefined)}
                        placeholder="경기, 광주, 대구, 대전, 부산, 서울, 인천, 전북 지역"
                      />
                    )}
                  />
                ) : (
                  program.district || '-'
                )}
              </td>
            </tr>
            <tr>
              <th>
                후원사{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="sponsorId"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        placeholder="후원사 선택"
                        allowClear={false}
                        showSearch
                        optionFilterProp="label"
                        options={sponsors.map(s => ({ value: s.id, label: s.name }))}
                        onChange={v => field.onChange(v ?? '')}
                        className="program-detail-info-tab__sponsor-select"
                      />
                    )}
                  />
                ) : program.sponsorId ? (
                  <Link
                    to={`/sponsors/${program.sponsorId}`}
                    className="program-detail-info-tab__sponsor-link"
                  >
                    {sponsorName ?? '-'}
                  </Link>
                ) : (
                  (sponsorName ?? '-')
                )}
              </td>
              <th>
                후원사 담당자{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td className="program-detail-info-tab__sponsor-manager-cell">
                {isFormEdit ? (
                  <div className="program-detail-info-tab__sponsor-manager-inputs">
                    <Controller
                      name="managerName"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="담당자명 (예: OO팀 이순신 책임)"
                          className="program-detail-info-tab__manager-name-input"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__contact-divider" aria-hidden>
                      |
                    </span>
                    <span className="program-detail-info-tab__contact-phone-readonly">
                      {form.watch('contactPhone') || '-'}
                    </span>
                  </div>
                ) : (
                  [program.managerName, program.contactPhone].filter(Boolean).join(' | ') || '-'
                )}
              </td>
            </tr>
            <tr>
              <th>
                문의처{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td colSpan={3} className="program-detail-info-tab__contact-cell">
                {isFormEdit ? (
                  <div className="program-detail-info-tab__contact-inputs">
                    <Input
                      placeholder="문의처명"
                      value={sponsorName ?? ''}
                      readOnly
                      className="program-detail-info-tab__contact-name-readonly"
                    />
                    <span className="program-detail-info-tab__contact-divider" aria-hidden>
                      |
                    </span>
                    <span className="program-detail-info-tab__contact-label">Tel</span>
                    <Controller
                      name="contactPhone"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="02-6085-6028"
                          className="program-detail-info-tab__contact-phone-input"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__contact-divider" aria-hidden>
                      |
                    </span>
                    <span className="program-detail-info-tab__contact-label">E-mail</span>
                    <Controller
                      name="contactEmail"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="ujat@jakorea.org"
                          className="program-detail-info-tab__contact-email-input"
                        />
                      )}
                    />
                  </div>
                ) : (
                  `${contactLine1} | ${contactLine2}`
                )}
              </td>
            </tr>
            <tr>
              <th>비고</th>
              <td colSpan={3}>
                {isFormEdit ? (
                  <Controller
                    name="oneLineIntroduction"
                    control={form.control}
                    render={({ field }) => (
                      <TextArea {...field} value={field.value ?? ''} rows={3} placeholder="비고" />
                    )}
                  />
                ) : (
                  (program.oneLineIntroduction ?? '-')
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 수강자 모집 */}
      <h3 className="program-detail-info-tab__section-title">수강자 모집</h3>
      <div className="program-detail-info-tab__table-wrapper">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
            <col style={{ width: '200px' }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>
                수강자 모집 인원{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit && form ? (
                  <div className="program-detail-info-tab__capacity-row">
                    <span className="program-detail-info-tab__capacity-approved">
                      {program.approvedStudentCount ?? '-'}
                    </span>
                    <span className="program-detail-info-tab__capacity-divider">/</span>
                    <Controller
                      name="rounds"
                      control={form.control}
                      render={({ field }) => {
                        const cap = field.value?.[0]?.capacity ?? 0
                        return (
                          <Input
                            type="number"
                            min={0}
                            value={cap || ''}
                            onChange={e => {
                              const n = parseInt(e.target.value, 10)
                              const next = (field.value ?? []).map((r, i) =>
                                i === 0 ? { ...r, capacity: isNaN(n) ? 0 : n } : r
                              )
                              field.onChange(next)
                            }}
                            className="program-detail-info-tab__capacity-input"
                          />
                        )
                      }}
                    />
                    <span className="program-detail-info-tab__detail-note">
                      (신청자가 아닌 승인된 수강자 기준)
                    </span>
                  </div>
                ) : totalCapacity > 0 ? (
                  `${program.approvedStudentCount != null ? `${program.approvedStudentCount} / ` : ''}${totalCapacity}건 (신청자가 아닌 승인된 수강자 기준)`
                ) : (
                  '-'
                )}
              </td>
              <th>
                수강자 모집 현황{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit && form ? (
                  <Radio.Group
                    value={
                      getRecruitmentStatus({
                        ...program,
                        applicationStartDate: form.watch('applicationStartDate'),
                        applicationEndDate: form.watch('applicationEndDate'),
                      }) ?? 'scheduled'
                    }
                    options={RECRUITMENT_RADIO_OPTIONS}
                    className="program-detail-info-tab__recruitment-radio"
                  />
                ) : (
                  <RecruitmentStatusBadge status={getRecruitmentStatus(program)} size="fixed" />
                )}
              </td>
            </tr>
            <tr>
              <th>
                수강자 모집 기간{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__date-range">
                    <Controller
                      name="applicationStartDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__date-separator">~</span>
                    <Controller
                      name="applicationEndDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(toIso(d))}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                  </div>
                ) : program.applicationStartDate && program.applicationEndDate ? (
                  `${formatDateOnly(program.applicationStartDate)} ~ ${formatDateOnly(program.applicationEndDate)}`
                ) : (
                  '-'
                )}
              </td>
              <th>
                결과 발표일 및 방법{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__result-row">
                    <Controller
                      name="resultAnnouncementDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <Controller
                      name="resultAnnouncementMethod"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="홈페이지 공지 및 담당교사 개별 안내"
                          className="program-detail-info-tab__result-method-input"
                        />
                      )}
                    />
                  </div>
                ) : (program.resultAnnouncementDate ?? program.applicationEndDate) ? (
                  `${formatDateOnly(program.resultAnnouncementDate ?? program.applicationEndDate)} | ${program.resultAnnouncementMethod ?? '홈페이지 공지 및 담당교사 개별 안내'}`
                ) : (
                  '-'
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 강사 모집 */}
      <h3 className="program-detail-info-tab__section-title">강사 모집</h3>
      <div className="program-detail-info-tab__table-wrapper">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
            <col style={{ width: '200px' }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>
                강사 모집 인원{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit && form ? (
                  <div className="program-detail-info-tab__capacity-row">
                    <span className="program-detail-info-tab__capacity-approved">
                      {program.instructors ?? '-'}
                    </span>
                    <span className="program-detail-info-tab__capacity-divider">/</span>
                    <Controller
                      name="instructorCapacity"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? ''}
                          onChange={e => {
                            const n = parseInt(e.target.value, 10)
                            field.onChange(isNaN(n) ? undefined : n)
                          }}
                          className="program-detail-info-tab__capacity-input"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__detail-note">
                      (신청자가 아닌 승인된 강사 기준)
                    </span>
                  </div>
                ) : program.instructors != null ? (
                  `${program.instructorCapacity != null ? `${program.instructors} / ${program.instructorCapacity}건` : `${program.instructors}건`} (신청자가 아닌 승인된 강사 기준)`
                ) : (
                  '-'
                )}
              </td>
              <th>
                강사 모집 현황{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Radio.Group
                    value={getInstructorRecruitmentStatus(program) ?? 'scheduled'}
                    options={RECRUITMENT_RADIO_OPTIONS}
                    className="program-detail-info-tab__recruitment-radio"
                  />
                ) : (
                  <RecruitmentStatusBadge status={getInstructorRecruitmentStatus(program)} size="fixed" />
                )}
              </td>
            </tr>
            <tr>
              <th>
                강사 모집 기간{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__date-range">
                    <Controller
                      name="instructorApplicationStartDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__date-separator">~</span>
                    <Controller
                      name="instructorApplicationEndDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                  </div>
                ) : program.instructorApplicationStartDate &&
                  program.instructorApplicationEndDate ? (
                  formatDateRange(
                    program.instructorApplicationStartDate,
                    program.instructorApplicationEndDate
                  )
                ) : (
                  '-'
                )}
              </td>
              <th>
                1차 서류 합격자 발표{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__result-row">
                    <Controller
                      name="documentPassAnnouncementDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <Controller
                      name="documentPassAnnouncementMethod"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="합격자 개별 안내"
                          className="program-detail-info-tab__result-method-input"
                        />
                      )}
                    />
                  </div>
                ) : program.documentPassAnnouncementDate ? (
                  `${formatDateOnly(program.documentPassAnnouncementDate)}${program.documentPassAnnouncementMethod ? ` | ${program.documentPassAnnouncementMethod}` : ''}`
                ) : (
                  '-'
                )}
              </td>
            </tr>
            <tr>
              <th>
                2차 면접 심사{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__date-range">
                    <Controller
                      name="interviewStartDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <span className="program-detail-info-tab__date-separator">~</span>
                    <Controller
                      name="interviewEndDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                  </div>
                ) : program.interviewStartDate && program.interviewEndDate ? (
                  `${formatDateRange(program.interviewStartDate, program.interviewEndDate)}${program.interviewMethod ? ` | ${program.interviewMethod}` : ''}`
                ) : (
                  '-'
                )}
              </td>
              <th>
                최종 합격자 발표{isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <div className="program-detail-info-tab__result-row">
                    <Controller
                      name="finalPassAnnouncementDate"
                      control={form.control}
                      render={({ field }) => (
                        <DatePicker
                          value={toDayjs(field.value)}
                          onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                          format="YYYY. MM. DD"
                          className="program-detail-info-tab__date-picker"
                        />
                      )}
                    />
                    <Controller
                      name="finalPassAnnouncementMethod"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="합격자 개별 안내"
                          className="program-detail-info-tab__result-method-input"
                        />
                      )}
                    />
                  </div>
                ) : program.finalPassAnnouncementDate ? (
                  `${formatDateOnly(program.finalPassAnnouncementDate)}${program.finalPassAnnouncementMethod ? ` | ${program.finalPassAnnouncementMethod}` : ''}`
                ) : (
                  '-'
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
