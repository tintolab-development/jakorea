/**
 * 상세 정보 섹션 (프로그램 상세 정보 탭)
 * - 프로그램 설명, 모집 안내, 학습 지원 내용, 추가 내용, 첨부 파일
 */

import { useState } from 'react'
import { Image } from 'antd'
import type { Program } from '@/types/domain'
import { FileSelectField } from '@/shared/ui/file-select-field'
import {
  DEFAULT_PROGRAM_DESCRIPTION,
  DEFAULT_RECRUITMENT_GUIDE,
  DEFAULT_LEARNING_SUPPORT,
  DEFAULT_ADDITIONAL_HTML,
  DEFAULT_ATTACHMENT_NAMES,
} from './program-detail-info-constants'

export interface DetailInfoSectionProps {
  program: Program
}

export function DetailInfoSection({ program }: DetailInfoSectionProps) {
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([])

  const displayFileNames = selectedFileNames.length > 0
    ? selectedFileNames
    : program.attachmentFileNames?.length
      ? program.attachmentFileNames
      : DEFAULT_ATTACHMENT_NAMES

  return (
    <section className="program-detail-info-tab__section">
      <div className="program-detail-info-tab__section-header-row">
        <h3 className="program-detail-info-tab__section-title">상세 정보</h3>
        <p className="program-detail-info-tab__detail-note">
          공란인 경우, 상세 페이지에서 항목 미노출 됩니다.
        </p>
      </div>
      <div className="program-detail-info-tab__table-wrapper">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
          <tbody>
            <tr>
              <th>프로그램 설명</th>
              <td>
                <div className="program-detail-info-tab__content-block">
                  {program.description || DEFAULT_PROGRAM_DESCRIPTION}
                </div>
              </td>
            </tr>
            <tr>
              <th>모집 안내</th>
              <td>
                <div className="program-detail-info-tab__content-block">
                  {program.recruitmentGuide || DEFAULT_RECRUITMENT_GUIDE}
                </div>
              </td>
            </tr>
            <tr>
              <th>학습 지원 내용</th>
              <td>
                <div className="program-detail-info-tab__content-block">
                  {program.learningSupportContent || DEFAULT_LEARNING_SUPPORT}
                </div>
              </td>
            </tr>
            <tr>
              <th>추가 내용</th>
              <td>
                <div className="program-detail-info-tab__additional-content">
                  <div className="program-detail-info-tab__additional-image-wrap">
                    <Image
                      src={program.keyVisualImage || program.posterImage || 'https://via.placeholder.com/600x200/f0f0f0/999?text=추가+내용+이미지'}
                      alt="추가 내용"
                      className="program-detail-info-tab__additional-image"
                      fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='200' viewBox='0 0 600 200'%3E%3Crect fill='%23f5f5f5' width='600' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3E추가 내용 이미지%3C/text%3E%3C/svg%3E"
                    />
                  </div>
                  <div
                    className="program-detail-info-tab__editor-content toastui-editor-contents"
                    dangerouslySetInnerHTML={{
                      __html: program.additionalContentHtml || DEFAULT_ADDITIONAL_HTML,
                    }}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <th>첨부 파일</th>
              <td>
                <FileSelectField
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  multiple
                  fileNames={displayFileNames}
                  guideLines={[
                    '파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
                    '첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
                  ]}
                  onFilesChange={(files) => setSelectedFileNames(files.map(f => f.name))}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
