import { Empty } from 'antd'
import type { User } from '@/types/user'
import { InstructorPaymentTab } from '@/features/user/detail/ui/instructor-payment-tab'

export interface UserDetailFullpageSettlementPanelProps {
  user: Omit<User, 'password'>
  showInstructorPayment: boolean
}

export function UserDetailFullpageSettlementPanel({
  user,
  showInstructorPayment,
}: UserDetailFullpageSettlementPanelProps) {
  if (showInstructorPayment) {
    return <InstructorPaymentTab instructorUserId={user.id} instructorName={user.name} />
  }
  return <Empty description="정산 현황은 강사 회원에서만 제공됩니다." />
}
