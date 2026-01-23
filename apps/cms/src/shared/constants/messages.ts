/**
 * 메시지 텍스트 상수
 * 성공/에러/알림 메시지 중앙 관리
 */

export const MESSAGES = {
  success: {
    created: '등록되었습니다.',
    updated: '수정되었습니다.',
    deleted: '삭제되었습니다.',
    submitted: '제출되었습니다.',
    approved: '승인되었습니다.',
    rejected: '거절되었습니다.',
    cancelled: '취소되었습니다.',
    saved: '저장되었습니다.',
    uploaded: '업로드되었습니다.',
    downloaded: '다운로드되었습니다.',
    exported: '내보내기가 완료되었습니다.',
    imported: '가져오기가 완료되었습니다.',
  },
  error: {
    create: '등록에 실패했습니다.',
    update: '수정에 실패했습니다.',
    delete: '삭제에 실패했습니다.',
    submit: '제출에 실패했습니다.',
    approve: '승인에 실패했습니다.',
    reject: '거절에 실패했습니다.',
    cancel: '취소에 실패했습니다.',
    save: '저장에 실패했습니다.',
    upload: '업로드에 실패했습니다.',
    download: '다운로드에 실패했습니다.',
    export: '내보내기에 실패했습니다.',
    import: '가져오기에 실패했습니다.',
    network: '네트워크 오류가 발생했습니다.',
    unknown: '오류가 발생했습니다.',
    notFound: '요청한 데이터를 찾을 수 없습니다.',
    unauthorized: '권한이 없습니다.',
    forbidden: '접근이 거부되었습니다.',
  },
  confirm: {
    delete: '정말 삭제하시겠습니까?',
    cancel: '정말 취소하시겠습니까?',
    submit: '제출하시겠습니까?',
    approve: '승인하시겠습니까?',
    reject: '거절하시겠습니까?',
  },
  info: {
    noData: '데이터가 없습니다.',
    loading: '로딩 중...',
    searching: '검색 중...',
  },
} as const
