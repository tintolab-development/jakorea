/**
 * 템플릿 관리 - 파일 양식
 * P0: 목록/검색/등록/수정/상태변경(아카이브)까지 mock 기반
 */

import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Button,
  Dropdown,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
  Row,
  Col,
  Divider,
} from 'antd'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { PageHeader } from '@/shared/ui/page-header'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import dayjs from 'dayjs'
import { MoreOutlined, DownloadOutlined } from '@ant-design/icons'
import type {
  FileTemplate,
  FileTemplateCategory,
  TemplateAudience,
  TemplateStatus,
  CertificateTextField,
} from '@/types/template'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import {
  mockFileTemplates,
  getTemplateStatusColor,
  getTemplateStatusLabel,
} from '@/data/mock/templates'
import { MESSAGES } from '@/shared/constants'
import { downloadBlob } from '@/shared/utils/file-download'
import { CertificateBackgroundUpload } from '@/features/certificate-template/ui/certificate-background-upload'
import { CertificateTextFieldsEditor } from '@/features/certificate-template/ui/certificate-text-fields-editor'
import { CertificatePreview } from '@/features/certificate-template/ui/certificate-preview'
import { generateCertificatePdf } from '@/shared/utils/certificate-pdf-generator'
import ExcelJS from '@zurmokeeper/exceljs'
import jsPDF from 'jspdf'

const { Text } = Typography

const audienceOptions: Array<{ value: TemplateAudience; label: string }> = [
  { value: 'ADMIN_INTERNAL', label: '운영(내부)' },
  { value: 'SCHOOL', label: '학교' },
  { value: 'INSTRUCTOR', label: '강사' },
  { value: 'INDIVIDUAL', label: '학생' },
]

const categoryOptions: Array<{ value: FileTemplateCategory | 'all'; label: string }> = [
  { value: 'all', label: '전체 카테고리' },
  { value: 'instructor-resume', label: '강사 이력서' },
  { value: 'lecture-report', label: '강의 보고서' },
  { value: 'education-plan', label: '교육계획서' },
  { value: 'certificate', label: '수료증' },
  { value: 'activity-confirmation', label: '활동확인서' },
  { value: 'receipt', label: '영수증' },
  { value: 'payment-statement', label: '지급조서' },
  { value: 'employment-certificate', label: '경력증명서' },
]

function statusLabel(status: TemplateStatus) {
  return getTemplateStatusLabel(status)
}

const VALID_CATEGORIES = new Set<FileTemplateCategory | 'all'>([
  'all',
  'instructor-resume',
  'lecture-report',
  'education-plan',
  'certificate',
  'activity-confirmation',
  'receipt',
  'payment-statement',
  'employment-certificate',
])

export default function TemplateFilesPage() {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const [searchParams, setSearchParams] = useSearchParams()

  // 카테고리: URL 쿼리 ?category= 단일 소스
  const activeCategory = useMemo((): FileTemplateCategory | 'all' => {
    const q = searchParams.get('category')
    if (q && VALID_CATEGORIES.has(q as FileTemplateCategory | 'all')) {
      return q as FileTemplateCategory | 'all'
    }
    return 'all'
  }, [searchParams])

  // 현재 카테고리 이름 가져오기
  const currentCategoryName = useMemo(() => {
    if (activeCategory === 'all') return '파일 양식'
    const categoryOption = categoryOptions.find(opt => opt.value === activeCategory)
    return categoryOption?.label || '파일 양식'
  }, [activeCategory])

  const [rows, setRows] = useState<FileTemplate[]>(mockFileTemplates)

  const [pendingFilters, setPendingFilters] = useState({
    query: '',
    status: 'all' as TemplateStatus | 'all',
    category: activeCategory as FileTemplateCategory | 'all',
  })
  const [appliedFilters, setAppliedFilters] = useState({
    query: '',
    status: 'all' as TemplateStatus | 'all',
    category: activeCategory as FileTemplateCategory | 'all',
  })
  const [editing, setEditing] = useState<FileTemplate | null>(null)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | undefined>()
  const [textFields, setTextFields] = useState<CertificateTextField[]>([])
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  
  // activeCategory가 'certificate'일 때만 수료증 디자인 설정 표시
  // 사이드바에서 카테고리별 접근 가능하므로 모달 내 카테고리 필드 제거
  const isCertificate = activeCategory === 'certificate'

  // URL 쿼리(activeCategory) 변경 시 필터 상태 동기화
  useEffect(() => {
    setPendingFilters(prev => ({ ...prev, category: activeCategory }))
    setAppliedFilters(prev => ({ ...prev, category: activeCategory }))
  }, [activeCategory])

  // 카테고리 탭 클릭 시 URL 업데이트
  const handleCategoryTabChange = (key: string) => {
    const next = key === 'all' ? 'all' : (key as FileTemplateCategory)
    const nextParams = new URLSearchParams(searchParams)
    if (next === 'all') {
      nextParams.delete('category')
    } else {
      nextParams.set('category', next)
    }
    setSearchParams(nextParams, { replace: true })
  }

  const filtered = useMemo(() => {
    const q = appliedFilters.query.trim().toLowerCase()
    return rows
      .filter(r => (appliedFilters.status === 'all' ? true : r.status === appliedFilters.status))
      .filter(r =>
        appliedFilters.category === 'all' ? true : r.content.category === appliedFilters.category
      )
      .filter(r => {
        if (!q) return true
        return (
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags.some(t => t.toLowerCase().includes(q)) ||
          r.content.fileName.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
  }, [appliedFilters, rows])

  // 조회 버튼 클릭 시 필터 적용 및 URL 쿼리 동기화
  const handleSearch = () => {
    setAppliedFilters(pendingFilters)
    const nextParams = new URLSearchParams(searchParams)
    if (pendingFilters.category === 'all') {
      nextParams.delete('category')
    } else {
      nextParams.set('category', pendingFilters.category)
    }
    setSearchParams(nextParams, { replace: true })
  }


  const openCreate = () => {
    setEditing(null)
    setOpen(true)
    setBackgroundImageUrl(undefined)
    setTextFields([])
    setFieldValues({})
    form.resetFields()
    form.setFieldsValue({
      status: 'draft',
      audience: ['ADMIN_INTERNAL', 'SCHOOL', 'INSTRUCTOR', 'INDIVIDUAL'],
      tags: [],
      mimeType: 'application/pdf',
      version: 'v1.0',
      downloadUrl: '#',
      // 카테고리는 activeCategory에서 자동으로 설정됨 (모달 필드 제거)
    })
  }

  const openEdit = (row: FileTemplate) => {
    setEditing(row)
    setOpen(true)
    setBackgroundImageUrl(row.content.backgroundImageUrl)
    setTextFields(row.content.textFields || [])
    setFieldValues({})
    form.setFieldsValue({
      title: row.title,
      description: row.description,
      tags: row.tags,
      audience: row.audience,
      status: row.status,
      fileName: row.content.fileName,
      mimeType: row.content.mimeType,
      version: row.content.version,
      downloadUrl: row.content.downloadUrl,
      // 카테고리는 activeCategory에서 자동으로 설정됨 (모달 필드 제거)
    })
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const now = new Date().toISOString()
    // 카테고리는 activeCategory에서 가져옴 (모달 필드 제거)
    // activeCategory가 'all'인 경우 editing의 category를 사용하거나, 없으면 undefined
    const category = activeCategory !== 'all' 
      ? activeCategory 
      : editing?.content.category || undefined

    const next: FileTemplate = editing
      ? {
          ...editing,
          title: values.title,
          description: values.description,
          tags: values.tags || [],
          audience: values.audience,
          status: values.status,
          updatedAt: now,
          updatedBy: '관리자(운영)',
          content: {
            ...editing.content,
            fileName: values.fileName,
            mimeType: values.mimeType,
            version: values.version,
            downloadUrl: values.downloadUrl,
            category,
            ...(isCertificate && {
              backgroundImageUrl,
              textFields: textFields.length > 0 ? textFields : undefined,
            }),
          },
        }
      : {
          id: `tpl-file-${String(rows.length + 1).padStart(3, '0')}`,
          type: 'files',
          title: values.title,
          description: values.description,
          tags: values.tags || [],
          audience: values.audience,
          status: values.status,
          updatedAt: now,
          updatedBy: '관리자(운영)',
          content: {
            fileName: values.fileName,
            mimeType: values.mimeType,
            version: values.version,
            downloadUrl: values.downloadUrl,
            category: category || undefined,
            ...(isCertificate && {
              backgroundImageUrl,
              textFields: textFields.length > 0 ? textFields : undefined,
            }),
          },
        }

    setRows(prev => {
      if (editing) return prev.map(r => (r.id === editing.id ? next : r))
      return [next, ...prev]
    })

    message.success(
      editing ? MESSAGES.success.templateFileUpdated : MESSAGES.success.templateFileCreated
    )
    setOpen(false)
    setEditing(null)
  }

  const handleArchiveToggle = (row: FileTemplate) => {
    setRows(prev =>
      prev.map(r =>
        r.id === row.id
          ? {
              ...r,
              status: r.status === 'archived' ? 'published' : 'archived',
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    )
  }

  // 템플릿 복사 기능 (FR-H01)
  const handleCopyTemplate = (row: FileTemplate) => {
    const now = new Date().toISOString()
    const copiedTemplate: FileTemplate = {
      ...row,
      id: `tpl-file-${String(rows.length + 1).padStart(3, '0')}`,
      title: `${row.title} (복사본)`,
      status: 'draft',
      updatedAt: now,
      updatedBy: '관리자(운영)',
    }

    setRows(prev => [copiedTemplate, ...prev])
    message.success(MESSAGES.success.templateCopied)
    openEdit(copiedTemplate)
  }

  const handleDownload = async (row: FileTemplate) => {
    const downloadUrl = row.content.downloadUrl
    const originalFileName = row.content.fileName
    const mimeType = row.content.mimeType
    const isCertificateTemplate = row.content.category === 'certificate'
    const isLectureReport = row.content.category === 'lecture-report'
    const isEducationPlan = row.content.category === 'education-plan'
    const isInstructorResume = row.content.category === 'instructor-resume'
    
    // PDF로 변환해야 하는 카테고리인 경우 파일명을 PDF로 변경
    const shouldConvertToPdf = isLectureReport || isEducationPlan || isInstructorResume
    const fileName = shouldConvertToPdf 
      ? originalFileName.replace(/\.(xlsx?|xls|docx?|doc)$/i, '.pdf')
      : originalFileName

    try {
      // 수료증 템플릿이고 배경 이미지가 있는 경우: 실제 PDF 생성
      if (isCertificateTemplate && row.content.backgroundImageUrl) {
        try {
          const pdfBlob = await generateCertificatePdf(
            row.content.backgroundImageUrl,
            row.content.textFields || [],
            {} // 템플릿 다운로드 시에는 빈 값 사용 (실제 값은 발급 시 입력)
          )
          downloadBlob(pdfBlob, fileName)
          message.success(`${fileName} 다운로드를 완료했습니다`)
          return
        } catch (error) {
          console.error('PDF 생성 실패:', error)
          message.error('PDF 생성 중 오류가 발생했습니다')
          return
        }
      }

      // URL이 유효한지 확인 (# 또는 빈 문자열이 아닌 경우)
      if (downloadUrl && downloadUrl !== '#' && downloadUrl.trim() !== '') {
        // 실제 URL인 경우: 서버에서 파일 다운로드
        try {
          const response = await fetch(downloadUrl)
          if (response.ok) {
            const blob = await response.blob()
            downloadBlob(blob, fileName)
            message.success(`${fileName} 다운로드를 완료했습니다`)
          } else {
            throw new Error('파일을 가져올 수 없습니다')
          }
        } catch (error) {
          // URL이 유효하지 않거나 CORS 문제인 경우, 링크로 열기 시도
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = fileName
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          message.success(`${fileName} 다운로드를 시작합니다`)
        }
      } else {
        // Mock 데이터인 경우: 파일 타입에 따라 실제 형식의 파일 생성
        if (mimeType === 'application/pdf') {
          // 수료증이 아닌 PDF 템플릿인 경우
          if (!isCertificateTemplate) {
            message.warning('PDF 파일을 생성할 수 없습니다. 배경 이미지가 등록된 수료증 템플릿만 다운로드 가능합니다.')
            return
          }
          // 수료증이지만 배경 이미지가 없는 경우
          message.warning('배경 이미지가 등록되지 않은 수료증 템플릿은 다운로드할 수 없습니다.')
          return
        }
        
        // Excel 파일 (.xlsx, .xls)인 경우
        if (
          mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          mimeType === 'application/vnd.ms-excel'
        ) {
          // 강의보고서는 PDF로 변환
          if (isLectureReport) {
            try {
              // Excel 내용을 생성하여 PDF로 변환
              const workbook = new ExcelJS.Workbook()
              const worksheet = workbook.addWorksheet('강의보고서')
              
              // 강의보고서 양식 구조 생성
              worksheet.addRow(['강의보고서'])
              worksheet.addRow([''])
              worksheet.addRow(['프로그램명', ''])
              worksheet.addRow(['강의일자', ''])
              worksheet.addRow(['강의시간', ''])
              worksheet.addRow(['강사명', ''])
              worksheet.addRow([''])
              worksheet.addRow(['강의 내용'])
              worksheet.addRow([''])
              worksheet.addRow(['주제', ''])
              worksheet.addRow(['내용', ''])
              worksheet.addRow([''])
              worksheet.addRow(['참여자 현황'])
              worksheet.addRow([''])
              worksheet.addRow(['총 인원', ''])
              worksheet.addRow(['실제 참여', ''])
              worksheet.addRow([''])
              worksheet.addRow(['특이사항', ''])
              worksheet.addRow([''])
              worksheet.addRow(['비고', ''])
              
              // 헤더 스타일
              worksheet.getRow(1).font = { bold: true, size: 16 }
              worksheet.getRow(1).alignment = { horizontal: 'center' }
              worksheet.mergeCells('A1:B1')
              
              // 섹션 헤더 스타일
              worksheet.getRow(8).font = { bold: true, size: 12 }
              worksheet.getRow(13).font = { bold: true, size: 12 }
              
              // 컬럼 너비 설정
              worksheet.getColumn(1).width = 20
              worksheet.getColumn(2).width = 50
              
              // Excel을 이미지로 변환하기 위해 HTML로 렌더링 후 PDF 생성
              // 대신 Excel 내용을 직접 PDF로 작성
              const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
              })
              
              // PDF에 강의보고서 양식 작성
              pdf.setFontSize(18)
              pdf.text('강의보고서', 105, 20, { align: 'center' })
              
              pdf.setFontSize(12)
              let yPos = 35
              const lineHeight = 8
              
              pdf.text('프로그램명: ___________________', 20, yPos)
              yPos += lineHeight
              pdf.text('강의일자: ___________________', 20, yPos)
              yPos += lineHeight
              pdf.text('강의시간: ___________________', 20, yPos)
              yPos += lineHeight
              pdf.text('강사명: ___________________', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.setFontSize(14)
              pdf.text('강의 내용', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.setFontSize(12)
              pdf.text('주제: ___________________', 20, yPos)
              yPos += lineHeight
              pdf.text('내용:', 20, yPos)
              yPos += lineHeight
              // 내용 입력 영역 (여러 줄)
              pdf.rect(20, yPos - 3, 170, 40)
              yPos += 45
              
              pdf.setFontSize(14)
              pdf.text('참여자 현황', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.setFontSize(12)
              pdf.text('총 인원: ___________________', 20, yPos)
              yPos += lineHeight
              pdf.text('실제 참여: ___________________', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.text('특이사항:', 20, yPos)
              yPos += lineHeight
              pdf.rect(20, yPos - 3, 170, 20)
              yPos += 25
              
              pdf.text('비고:', 20, yPos)
              yPos += lineHeight
              pdf.rect(20, yPos - 3, 170, 15)
              
              // 파일명을 PDF 확장자로 변경
              const pdfFileName = fileName.replace(/\.(xlsx?|xls)$/i, '.pdf')
              
              const blob = pdf.output('blob')
              downloadBlob(blob, pdfFileName)
              message.success(`${pdfFileName} 다운로드를 완료했습니다`)
              return
            } catch (error) {
              console.error('PDF 생성 실패:', error)
              message.error('PDF 생성 중 오류가 발생했습니다')
              return
            }
          }
          
          // 강의보고서가 아닌 Excel 파일은 기존대로 Excel 생성
          try {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Sheet1')
            
            // 템플릿 정보를 Excel에 추가
            worksheet.addRow(['템플릿 정보'])
            worksheet.addRow(['제목', row.title])
            worksheet.addRow(['설명', row.description || ''])
            worksheet.addRow(['파일명', fileName])
            worksheet.addRow(['버전', row.content.version])
            worksheet.addRow(['카테고리', categoryOptions.find(opt => opt.value === row.content.category)?.label || ''])
            worksheet.addRow([''])
            worksheet.addRow(['참고', '이 파일은 템플릿 파일입니다. 실제 파일은 서버에서 제공됩니다.'])
            
            // 헤더 행 스타일 적용
            worksheet.getRow(1).font = { bold: true, size: 14 }
            worksheet.getRow(1).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0E0E0' },
            }
            
            // 컬럼 너비 자동 조정
            worksheet.columns.forEach((column) => {
              column.width = 30
            })
            
            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            })
            downloadBlob(blob, fileName)
            message.success(`${fileName} 다운로드를 완료했습니다`)
            return
          } catch (error) {
            console.error('Excel 파일 생성 실패:', error)
            message.error('Excel 파일 생성 중 오류가 발생했습니다')
            return
          }
        }
        
        // Word 파일 (.docx, .doc)인 경우 PDF로 변환하여 다운로드
        if (
          mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          mimeType === 'application/msword'
        ) {
          try {
            // PDF 생성
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4',
            })
            
            // 강사 이력서인 경우 특별한 양식 제공
            if (isInstructorResume) {
              pdf.setFontSize(18)
              pdf.text('강사 이력서', 105, 20, { align: 'center' })
              
              pdf.setFontSize(12)
              let yPos = 35
              const lineHeight = 8
              
              pdf.text('성명: ___________________', 20, yPos)
              yPos += lineHeight
              pdf.text('생년월일: ___________________', 20, yPos)
              yPos += lineHeight
              pdf.text('연락처: ___________________', 20, yPos)
              yPos += lineHeight
              pdf.text('이메일: ___________________', 20, yPos)
              yPos += lineHeight
              pdf.text('주소: ___________________', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.setFontSize(14)
              pdf.text('학력 사항', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.setFontSize(12)
              pdf.rect(20, yPos - 3, 170, 30)
              yPos += 35
              
              pdf.setFontSize(14)
              pdf.text('경력 사항', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.setFontSize(12)
              pdf.rect(20, yPos - 3, 170, 50)
              yPos += 55
              
              pdf.setFontSize(14)
              pdf.text('자격 사항', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.setFontSize(12)
              pdf.rect(20, yPos - 3, 170, 30)
              yPos += 35
              
              pdf.setFontSize(14)
              pdf.text('특기 사항', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.setFontSize(12)
              pdf.rect(20, yPos - 3, 170, 25)
            }
            // 교육계획서인 경우 특별한 양식 제공
            else if (isEducationPlan) {
              pdf.setFontSize(18)
              pdf.text('교육계획서', 105, 20, { align: 'center' })
              
              pdf.setFontSize(12)
              let yPos = 35
              const lineHeight = 8
              
              pdf.text('프로그램명: ___________________', 20, yPos)
              yPos += lineHeight
              pdf.text('교육기간: ___________________', 20, yPos)
              yPos += lineHeight
              pdf.text('교육대상: ___________________', 20, yPos)
              yPos += lineHeight
              pdf.text('교육장소: ___________________', 20, yPos)
              yPos += lineHeight
              pdf.text('담당강사: ___________________', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.setFontSize(14)
              pdf.text('교육 목표', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.setFontSize(12)
              pdf.rect(20, yPos - 3, 170, 30)
              yPos += 35
              
              pdf.setFontSize(14)
              pdf.text('교육 내용', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.setFontSize(12)
              pdf.rect(20, yPos - 3, 170, 50)
              yPos += 55
              
              pdf.setFontSize(14)
              pdf.text('교육 일정', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.setFontSize(12)
              pdf.rect(20, yPos - 3, 170, 40)
              yPos += 45
              
              pdf.setFontSize(14)
              pdf.text('평가 방법', 20, yPos)
              yPos += lineHeight * 1.5
              
              pdf.setFontSize(12)
              pdf.rect(20, yPos - 3, 170, 25)
              yPos += 30
              
              pdf.text('비고:', 20, yPos)
              yPos += lineHeight
              pdf.rect(20, yPos - 3, 170, 15)
            } else {
              // 일반 Word 파일인 경우 템플릿 정보만 표시
              pdf.setFontSize(16)
              pdf.text('템플릿 정보', 20, 20)
              
              pdf.setFontSize(12)
              let yPosition = 35
              const lineHeight = 10
              
              pdf.text(`제목: ${row.title}`, 20, yPosition)
              yPosition += lineHeight
              
              if (row.description) {
                // 설명이 길 경우 여러 줄로 나누기
                const descriptionLines = pdf.splitTextToSize(`설명: ${row.description}`, 170)
                pdf.text(descriptionLines, 20, yPosition)
                yPosition += descriptionLines.length * lineHeight
              }
              
              pdf.text(`파일명: ${fileName}`, 20, yPosition)
              yPosition += lineHeight
              
              pdf.text(`버전: ${row.content.version}`, 20, yPosition)
              yPosition += lineHeight
              
              const categoryLabel = categoryOptions.find(opt => opt.value === row.content.category)?.label || ''
              if (categoryLabel) {
                pdf.text(`카테고리: ${categoryLabel}`, 20, yPosition)
                yPosition += lineHeight
              }
              
              yPosition += lineHeight
              pdf.setFontSize(10)
              pdf.text('참고: 이 파일은 템플릿 파일입니다. 실제 파일은 서버에서 제공됩니다.', 20, yPosition)
            }
            
            // 파일명을 PDF 확장자로 변경
            const pdfFileName = fileName.replace(/\.(docx?|doc)$/i, '.pdf')
            
            const blob = pdf.output('blob')
            downloadBlob(blob, pdfFileName)
            message.success(`${pdfFileName} 다운로드를 완료했습니다`)
            return
          } catch (error) {
            console.error('PDF 생성 실패:', error)
            message.error('PDF 생성 중 오류가 발생했습니다')
            return
          }
        }
        
        // 기타 파일 타입의 경우 경고 메시지
        message.warning(`${fileName} 파일은 현재 생성할 수 없습니다. 실제 파일은 서버에서 제공됩니다.`)
      }
    } catch (error) {
      console.error('Download failed:', error)
      message.error('다운로드 중 오류가 발생했습니다')
    }
  }

  const getRowMenuItems = (row: FileTemplate): MenuProps['items'] => {
    // persona: published 상태만 실사용(복사/다운로드) 노출
    const canUse = row.status === 'published'
    const baseItems: MenuProps['items'] = [
      {
        key: 'download',
        label: '다운로드',
        icon: <DownloadOutlined />,
        disabled: !canUse,
        onClick: canUse ? () => handleDownload(row) : undefined,
      },
    ]

    if (canWrite) {
      baseItems.push(
        { type: 'divider' },
        {
          key: 'copy',
          label: '복사',
          disabled: !canUse,
          onClick: canUse ? () => handleCopyTemplate(row) : undefined,
        },
        {
          key: 'edit',
          label: '수정',
          onClick: () => openEdit(row),
        },
        { type: 'divider' },
        {
          key: 'toggle-archive',
          label: row.status === 'archived' ? '게시' : '아카이브',
          danger: row.status !== 'archived',
          onClick: () => handleArchiveToggle(row),
        }
      )
    }

    return baseItems
  }

  const columns: ColumnsType<FileTemplate> = [
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (v: string, row) => (
        <Space direction="vertical" size={2}>
          <Text strong>{v}</Text>
          {row.description && <Text type="secondary">{row.description}</Text>}
          <Space size={6} wrap>
            {row.tags.slice(0, 3).map(t => (
              <Tag key={t}>{t}</Tag>
            ))}
            {row.tags.length > 3 && <Tag>+{row.tags.length - 3}</Tag>}
          </Space>
        </Space>
      ),
    },
    {
      title: '카테고리',
      key: 'category',
      width: 140,
      render: (_: unknown, row) => {
        const category = row.content.category
        if (!category) return <Text type="secondary">-</Text>
        const option = categoryOptions.find(o => o.value === category)
        return <Tag color="blue">{option?.label || category}</Tag>
      },
    },
    {
      title: '파일',
      key: 'file',
      width: 260,
      render: (_: unknown, row) => {
        // PDF로 변환해야 하는 카테고리인 경우 파일명 확장자를 PDF로 표시
        const isLectureReport = row.content.category === 'lecture-report'
        const isEducationPlan = row.content.category === 'education-plan'
        const isInstructorResume = row.content.category === 'instructor-resume'
        const shouldShowPdf = isLectureReport || isEducationPlan || isInstructorResume
        
        const displayFileName = shouldShowPdf
          ? row.content.fileName.replace(/\.(xlsx?|xls|docx?|doc)$/i, '.pdf')
          : row.content.fileName
        
        const displayMimeType = shouldShowPdf
          ? 'application/pdf'
          : row.content.mimeType
        
        return (
          <Space direction="vertical" size={0}>
            <Text>{displayFileName}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {displayMimeType} · {row.content.version}
            </Text>
          </Space>
        )
      },
    },
    {
      title: '대상',
      dataIndex: 'audience',
      key: 'audience',
      width: 220,
      render: (audience: TemplateAudience[]) => (
        <Space size={6} wrap>
          {audience.slice(0, 3).map(a => (
            <Tag key={a}>{audienceOptions.find(o => o.value === a)?.label || a}</Tag>
          ))}
          {audience.length > 3 && <Tag>+{audience.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: TemplateStatus) => <Tag color={getTemplateStatusColor(s)}>{statusLabel(s)}</Tag>,
    },
    {
      title: '수정일',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '작업',
      key: 'action',
      width: 72,
      fixed: 'right' as const,
      render: (_: unknown, row) => (
        <div onClick={e => e.stopPropagation()}>
          <Dropdown
            menu={{ items: getRowMenuItems(row) }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} />
          </Dropdown>
        </div>
      ),
    },
  ]

  const categoryTabItems = useMemo(
    () =>
      categoryOptions.map(opt => ({
        key: opt.value,
        label: opt.label,
      })),
    []
  )

  return (
    <div>
      <PageHeader
        title={currentCategoryName}
        actions={
          canWrite ? (
            <Button type="primary" onClick={openCreate}>
              {activeCategory === 'all' ? '파일 양식 등록' : `${currentCategoryName} 양식 등록`}
            </Button>
          ) : undefined
        }
      />

      <Tabs
        activeKey={activeCategory}
        onChange={handleCategoryTabChange}
        items={categoryTabItems}
        style={{ marginBottom: 16 }}
      />

      <UnifiedFilterCard
        fields={[
          {
            key: 'query',
            type: 'search',
            label: '검색',
            placeholder: '제목/설명/태그/파일명 검색',
          },
          {
            key: 'category',
            type: 'select',
            label: '카테고리',
            placeholder: '전체 카테고리',
            options: categoryOptions,
          },
          {
            key: 'status',
            type: 'select',
            label: '상태',
            placeholder: '전체 상태',
            options: [
              { label: '전체 상태', value: 'all' },
              { label: '초안', value: 'draft' },
              { label: '검토', value: 'review' },
              { label: '게시', value: 'published' },
              { label: '아카이브', value: 'archived' },
            ],
          },
        ]}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => ({ ...prev, [key]: value }))
        }}
        onSearch={handleSearch}
      />

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        scroll={{ x: 1100 }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: total => `총 ${total}개`,
        }}
      />

      <Modal
        title={
          editing
            ? activeCategory === 'all'
              ? '파일 양식 수정'
              : `${currentCategoryName} 양식 수정`
            : activeCategory === 'all'
              ? '파일 양식 등록'
              : `${currentCategoryName} 양식 등록`
        }
        open={open}
        onCancel={() => {
          setOpen(false)
          setEditing(null)
          setBackgroundImageUrl(undefined)
          setTextFields([])
          setFieldValues({})
          form.resetFields()
        }}
        onOk={handleSubmit}
        okText={editing ? '수정' : '등록'}
        width={isCertificate ? '95%' : 720}
        centered
        styles={{
          body: {
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            padding: isCertificate ? '24px' : undefined,
          },
        }}
        style={{
          maxWidth: isCertificate ? '1400px' : undefined,
        }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="제목"
            rules={[{ required: true, message: '제목을 입력해주세요' }]}
          >
            <Input placeholder="예) 봉사활동 안내문(기본)" />
          </Form.Item>
          <Form.Item name="description" label="설명">
            <Input.TextArea rows={2} placeholder="템플릿 용도/주의사항을 짧게 적어주세요" />
          </Form.Item>

          <Space size={12} style={{ display: 'flex' }}>
            <Form.Item
              name="status"
              label="상태"
              rules={[{ required: true, message: '상태를 선택해주세요' }]}
              style={{ flex: 1 }}
            >
              <Select
                options={[
                  { value: 'draft', label: '초안' },
                  { value: 'review', label: '검토' },
                  { value: 'published', label: '게시' },
                  { value: 'archived', label: '아카이브' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="version"
              label="버전"
              rules={[{ required: true, message: '버전을 입력해주세요' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="v1.0" />
            </Form.Item>
          </Space>

          <Form.Item
            name="audience"
            label="대상"
            rules={[{ required: true, message: '대상을 선택해주세요' }]}
          >
            <Select mode="multiple" options={audienceOptions} placeholder="대상 선택" />
          </Form.Item>

          <Form.Item name="tags" label="태그">
            <Select mode="tags" tokenSeparators={[',']} placeholder="태그를 입력하세요 (Enter)" />
          </Form.Item>

          <Space size={12} style={{ display: 'flex' }}>
            <Form.Item
              name="fileName"
              label="파일명"
              rules={[{ required: true, message: '파일명을 입력해주세요' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="예) 안내문_v1.pdf" />
            </Form.Item>
            <Form.Item
              name="mimeType"
              label="MIME Type"
              rules={[{ required: true, message: 'MIME Type을 입력해주세요' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="application/pdf" />
            </Form.Item>
          </Space>

          <Form.Item
            name="downloadUrl"
            label="다운로드 URL(임시)"
            rules={[{ required: true, message: 'URL을 입력해주세요' }]}
          >
            <Input placeholder="초기에는 # 사용, 추후 스토리지 연동" />
          </Form.Item>

          {/* 수료증 카테고리 전용 섹션 - 카테고리가 'certificate'일 때만 표시 */}
          {isCertificate ? (
            <>
              <Divider>수료증 디자인 설정</Divider>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Form.Item label="배경 이미지" required>
                      <CertificateBackgroundUpload
                        value={backgroundImageUrl}
                        onChange={(url) => {
                          console.log('배경 이미지 URL 변경:', url)
                          setBackgroundImageUrl(url)
                        }}
                      />
                    </Form.Item>

                    <Form.Item label="텍스트 필드 설정">
                      <CertificateTextFieldsEditor
                        value={textFields}
                        onChange={setTextFields}
                      />
                    </Form.Item>
                  </Space>
                </Col>
                <Col xs={24} sm={24} md={24} lg={12} xl={12}>
                  <CertificatePreview
                    backgroundImageUrl={backgroundImageUrl}
                    textFields={textFields}
                    fieldValues={fieldValues}
                    onFieldValueChange={(key, value) => {
                      setFieldValues(prev => ({ ...prev, [key]: value }))
                    }}
                  />
                </Col>
              </Row>
            </>
          ) : null}
        </Form>
      </Modal>
    </div>
  )
}
