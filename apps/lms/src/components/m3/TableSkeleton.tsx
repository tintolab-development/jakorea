/**
 * Material Design 3 Table Skeleton
 * 테이블 로딩 상태를 위한 스켈레톤 UI
 */

import MdSkeleton from './MdSkeleton'
import './TableSkeleton.css'

interface TableSkeletonProps {
  columns?: number
  rows?: number
}

export default function TableSkeleton({ columns = 7, rows = 8 }: TableSkeletonProps) {
  return (
    <div className="table-skeleton-container">
      <table className="table-skeleton">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index}>
                <MdSkeleton variant="text" height="20px" width={index === columns - 1 ? '80px' : undefined} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex}>
                  {colIndex === 0 ? (
                    // 이름 컬럼: 중간 너비
                    <MdSkeleton variant="text" height="20px" width="80px" />
                  ) : colIndex === columns - 1 ? (
                    // 마지막 컬럼(작업): 버튼 형태
                    <MdSkeleton variant="rectangular" height="32px" width="60px" />
                  ) : (
                    // 일반 컬럼
                    <MdSkeleton variant="text" height="20px" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

