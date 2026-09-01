import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AlimtalkNestedTable } from '@/shared/ui/alimtalk-nested-table'
import { DsDemo, DsSection } from './section'

const DEMO_URL =
  'https://console.nhncloud.com/project/eSpBZ77a/notification/notification-hub#template'

export function AlimtalkNestedTableSection() {
  return (
    <DsSection
      id="alimtalk-nested-table"
      title="AlimTalk nested table"
      description="알림톡 템플릿 내용의 버튼·바로 연결 중첩 표입니다. 셀 48px, nested 영역 54px·회색 배경입니다."
    >
      <p className="ds-note">
        SSOT: <code>shared/ui/alimtalk-nested-table</code>. 소비처는 알림톡 발송 풀페이지 4번 섹션입니다.
        <code>DetailInfoForm</code> 값 슬롯은 nested 표 바깥에 padding 20px이 적용됩니다. 본문 셀은
        16/500/150% 가운데 정렬, nested 줄은 좌측 정렬·타이틀 min-width 60px·콜론 좌우 gap 8px입니다. nested가
        있는 행은 왼쪽 28×28 화살표 아이콘으로 접고 펼 수 있습니다. 상세(PC·URL·플러그인 아이디)는 유형 셀 안이 아니라
        해당 행 하단 전체 폭 영역에 표시됩니다. 아이템 리스트형은 <code>hideToggle</code>로 토글 열을 숨기고,{' '}
        <code>footer</code>로 요약 행을 붙입니다. 요약 열 <code>80px</code> · 아이템명·내용은 나머지 폭을
        균등 분할 · 셀 padding <code>12px 20px</code>.
      </p>
      <DsDemo label="AlimtalkNestedTable · 버튼">
        <DetailInfoForm title="템플릿 내용" hideHeader mode="view">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="버튼"
              fullRow
              view={
                <AlimtalkNestedTable
                  columns={['버튼 유형', '버튼명']}
                  rows={[
                    { cells: ['채널 추가', '채널 추가'] },
                    {
                      cells: ['웹 링크', 'test sample'],
                      nestedLines: [
                        { label: 'PC', value: DEMO_URL },
                        { label: '모바일', value: DEMO_URL },
                      ],
                    },
                    {
                      cells: ['앱 링크', 'test sample'],
                      nestedLines: [
                        { label: 'PC', value: DEMO_URL },
                        { label: '모바일', value: DEMO_URL },
                        { label: 'Android', value: DEMO_URL },
                        { label: 'iOS', value: DEMO_URL },
                      ],
                    },
                    { cells: ['배송 조회', 'test sample'] },
                    { cells: ['봇 키워드', 'test sample'] },
                    { cells: ['메시지 전달', 'test sample'] },
                    { cells: ['상담톡 전환', 'test sample'] },
                    { cells: ['봇 전환', 'test sample'] },
                    {
                      cells: ['이미지 보안 전송 플러그인', 'test sample'],
                      nestedLines: [{ label: '플러그인 아이디', value: 'jakorea' }],
                    },
                    {
                      cells: ['개인정보 이용 플러그인', 'test sample'],
                      nestedLines: [{ label: '플러그인 아이디', value: 'jakorea' }],
                    },
                  ]}
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </DsDemo>
      <DsDemo label="AlimtalkNestedTable · 바로 연결">
        <DetailInfoForm title="템플릿 내용" hideHeader mode="view">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="바로 연결"
              fullRow
              view={
                <AlimtalkNestedTable
                  columns={['바로 연결 유형', '바로 연결명']}
                  rows={[
                    {
                      cells: ['웹 링크', '바로연결명'],
                      nestedLines: [
                        { label: 'PC', value: DEMO_URL },
                        { label: '모바일', value: DEMO_URL },
                      ],
                    },
                    {
                      cells: ['앱 링크', '바로연결명 02'],
                      nestedLines: [
                        { label: 'PC', value: DEMO_URL },
                        { label: '모바일', value: DEMO_URL },
                        { label: 'Android', value: DEMO_URL },
                        { label: 'iOS', value: DEMO_URL },
                      ],
                    },
                    { cells: ['봇 키워드', 'test sample'] },
                    { cells: ['상담톡 전환', 'test sample'] },
                    { cells: ['봇 전환', 'test sample'] },
                    {
                      cells: ['비즈니스 폼', '톡에서 예약하기'],
                      nestedLines: [{ label: '비즈니스폼 아이디', value: 'jakorea' }],
                    },
                  ]}
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </DsDemo>
      <DsDemo label="AlimtalkNestedTable · 아이템 리스트 (hideToggle + footer)">
        <DetailInfoForm title="템플릿 내용" hideHeader mode="view">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="아이템 리스트"
              fullRow
              view={
                <AlimtalkNestedTable
                  hideToggle
                  columns={['아이템명', '아이템 내용']}
                  rows={[
                    { cells: ['아이템명 01', '아이템 내용 01 일이삼사오육칠팔구십일이삼'] },
                    { cells: ['아이템명 02', '아이템 내용 02'] },
                  ]}
                  footer={{
                    label: '요약',
                    cells: ['일이삼사오육', '일이삼사오육칠팔구십일이삼사'],
                  }}
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </DsDemo>
    </DsSection>
  )
}
