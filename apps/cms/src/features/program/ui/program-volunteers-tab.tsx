/**
 * 프로그램 상세 - 봉사자 정보 탭
 * 풀페이지 모달 탭 카테고리 "봉사자 정보" 전용.
 * 추후 봉사자 목록/매칭 API 연동 시 실제 테이블로 교체.
 */

import { Typography } from 'antd'
import './program-volunteers-tab.css'

export interface ProgramVolunteersTabProps {
  programId: string
}

export function ProgramVolunteersTab({ programId: _programId }: ProgramVolunteersTabProps) {
  return (
    <div className="program-volunteers-tab">
      <div className="program-volunteers-tab__empty">
        <Typography.Text type="secondary">
          봉사자 정보 목록이 표시됩니다. (화면 연동 예정)
        </Typography.Text>
      </div>
    </div>
  )
}
