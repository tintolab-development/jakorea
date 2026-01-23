/**
 * 페이지네이션 관련 상수
 */

export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: ['10', '20', '50', '100'] as (string | number)[],
  showSizeChanger: true,
  showTotal: (total: number) => `총 ${total}개`,
}
