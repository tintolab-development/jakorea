/** 관리자 권한 승인 모달 feeGrade → API roleCode */
export function adminPermissionFeeGradeToRoleCode(feeGrade: string): string {
  switch (feeGrade.trim()) {
    case 'manager':
      return 'MASTER'
    case 'partner':
      return 'PARTNER'
    case 'viewer':
      return 'VIEWER'
    default:
      return feeGrade.trim().toUpperCase()
  }
}
