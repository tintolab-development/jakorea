# 디자인 요청사항

## 색상 Variation 요청

### 현재 구현 상태

Ant Design Theme Provider에 다음과 같은 색상 variation이 추가되었습니다:

#### 도메인별 색상

- **스폰서 (Sponsor)**: 주황 계열 (`#ff7a45`)
  - Light: `#fff1e8`
  - Dark: `#d4380d`
- **학교 (School)**: 청록 계열 (`#13c2c2`)
  - Light: `#e6fffb`
  - Dark: `#08979c`
- **강사 (Instructor)**: 보라 계열 (`#722ed1`)
  - Light: `#f9f0ff`
  - Dark: `#531dab`
- **프로그램 (Program)**: 파랑 계열 (`#2f54eb`)
  - Light: `#f0f5ff`
  - Dark: `#1d39c4`
- **신청 (Application)**: 분홍 계열 (`#eb2f96`)
  - Light: `#fff0f6`
  - Dark: `#c41d7f`
- **일정 (Schedule)**: 주황 계열 (`#fa8c16`)
  - Light: `#fff7e6`
  - Dark: `#d46b08`
- **매칭 (Matching)**: 녹색 계열 (`#52c41a`)
  - Light: `#f6ffed`
  - Dark: `#389e0d`
- **정산 (Settlement)**: 주황 계열 (`#fa541c`)
  - Light: `#fff2e8`
  - Dark: `#d4380d`

### 디자이너 요청사항

1. **색상 팔레트 검토 및 개선**
   - 각 도메인별 색상이 시각적으로 구분되도록 조정
   - 브랜드 아이덴티티와 일관성 유지
   - 접근성 고려 (색상 대비율)

2. **색상 사용 가이드라인**
   - 각 색상이 사용되는 UI 컴포넌트 정의
   - Tag, Badge, Card 등에서의 색상 적용 규칙
   - 상태별 색상 (active, pending, completed 등)

3. **추가 색상 Variation**
   - 필요시 추가 도메인별 색상 제안
   - 그라데이션 또는 색상 조합 제안

4. **UI/UX 개선 요청 (신규)**
   - **사용자 경험 개선**: 화면 전환, 로딩 상태, 에러 처리 등
   - **시각적 피드백**: 호버 효과, 클릭 피드백, 애니메이션
   - **레이아웃 개선**: 여백, 정렬, 그리드 시스템
   - **타이포그래피**: 폰트 크기, 줄 간격, 가독성
   - **컴포넌트 스타일링**: 버튼, 카드, 테이블 등 세련된 디자인
   - **반응형 고려**: 1920x1080 고정이지만 내부 요소 배치 최적화

5. **Ant Design 컴포넌트 다양하게 활용 요청**
   - Ant Design에서 제공하는 모든 컴포넌트를 적극 활용
   - 각 상황에 맞는 최적의 컴포넌트 선택
   - 컴포넌트 조합을 통한 풍부한 UI 구성
   - 예시:
     - **Layout**: Layout, Sider, Header, Content, Footer
     - **Navigation**: Menu, Breadcrumb, Tabs, Pagination
     - **Data Entry**: Form, Input, Select, DatePicker, Upload, Switch, Checkbox, Radio
     - **Data Display**: Table, Card, Descriptions, List, Tree, Timeline, Tag, Badge, Avatar
     - **Feedback**: Modal, Drawer, Message, Notification, Alert, Progress, Spin, Skeleton
     - **Other**: Button, Divider, Space, Typography, Tooltip, Popover, Dropdown, Popconfirm

### 구현 위치

- `src/app/providers/theme-provider.tsx`: Ant Design Theme 설정
- `src/app/providers/theme-provider.css`: CSS 변수
- `src/shared/constants/colors.ts`: 색상 상수
- 각 도메인별 UI 컴포넌트에서 색상 적용 예정

### 참고

- Ant Design 공식 문서: https://ant.design/docs/react/customize-theme
- 현재 색상은 임시로 설정되었으며, 디자이너 검토 후 최종 확정 예정
