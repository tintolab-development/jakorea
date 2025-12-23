# 공통 컴포넌트 사용 가이드

**작성 일자**: 2024-12-19  
**기준 문서**: UI_PRINCIPLES.md  
**적용 범위**: 모든 화면 개발 시 공통 컴포넌트 활용

---

## 📋 개요

이 문서는 JAKorea CMS 프로젝트의 공통 컴포넌트 사용 방법을 설명합니다. 모든 화면 개발 시 이 가이드를 참고하여 일관된 UI를 구현합니다.

---

## 🎯 공통 컴포넌트 목록

### 1. StatusDisplay - 상태 표시 컴포넌트

**용도**: 상태를 문장으로 명확히 표시

**위치**: `@/shared/ui/status-display`

**사용 예시**:

```typescript
import { StatusDisplay } from '@/shared/ui'

const statusLabels = {
  submitted: '신청이 접수되었습니다.',
  reviewing: '신청이 검토 중입니다.',
  approved: '신청이 승인되었습니다.',
}

const statusColors = {
  submitted: 'default',
  reviewing: 'processing',
  approved: 'success',
}

<StatusDisplay 
  status={application.status}
  statusLabels={statusLabels}
  statusColors={statusColors}
/>
```

**Props**:
- `status`: 상태 값 (string)
- `statusLabels`: 상태별 라벨 매핑 (Record<string, string>)
- `statusColors`: 상태별 색상 매핑 (Record<string, string>, 선택)
- `showBadge`: Badge 표시 여부 (boolean, 기본값: true)

---

### 2. SingleCTA - 단일 CTA 컴포넌트

**용도**: 단일 주요 행동 버튼 표시

**위치**: `@/shared/ui/single-cta`

**사용 예시**:

```typescript
import { SingleCTA } from '@/shared/ui'

<SingleCTA
  label="신청하기"
  targetUrl="/applications/new"
  type="primary"
/>

// 또는 onClick 사용
<SingleCTA
  label="보고서 제출하기"
  onClick={() => handleSubmit()}
  type="primary"
  loading={isSubmitting}
/>
```

**Props**:
- `label`: 버튼 텍스트 (string, 필수)
- `targetUrl`: 이동할 URL (string, 선택)
- `onClick`: 클릭 핸들러 (함수, 선택)
- `type`: 버튼 타입 ('primary' | 'default' | 'danger', 기본값: 'primary')
- `loading`: 로딩 상태 (boolean, 기본값: false)
- `disabled`: 비활성화 여부 (boolean, 기본값: false)

**주의사항**:
- `targetUrl`과 `onClick` 중 하나는 반드시 제공해야 함
- 둘 다 없으면 버튼이 자동으로 비활성화됨

---

### 3. GuideMessage - 안내 문구 컴포넌트

**용도**: 고정 안내 문구 표시

**위치**: `@/shared/ui/guide-message`

**사용 예시**:

```typescript
import { GuideMessage, GuideParagraph } from '@/shared/ui'

// 단일 안내 메시지
<GuideMessage 
  message="신청 전 내용을 다시 한 번 확인해주세요."
  type="info"
/>

// 여러 안내 문구
<GuideParagraph
  messages={[
    "필요한 작업을 완료하시면 마이페이지 상태가 자동으로 업데이트됩니다.",
    "추가 안내사항은 마이페이지에서 확인하실 수 있습니다."
  ]}
  type="secondary"
/>
```

**Props (GuideMessage)**:
- `message`: 안내 메시지 (string, 필수)
- `type`: Alert 타입 ('info' | 'success' | 'warning' | 'error', 기본값: 'info')
- `showIcon`: 아이콘 표시 여부 (boolean, 기본값: true)

**Props (GuideParagraph)**:
- `messages`: 안내 문구 배열 (string[], 필수)
- `type`: 텍스트 타입 ('secondary' | 'success' | 'warning' | 'danger', 기본값: 'secondary')

**주의사항**:
- 서버에서 받은 문구를 그대로 사용 (요약/변경 금지)
- 문구 순서 변경 금지

---

### 4. ResultScreen - 결과 화면 컴포넌트

**용도**: 결과/완료 화면 표시

**위치**: `@/shared/ui/result-screen`

**사용 예시**:

```typescript
import { ResultScreen } from '@/shared/ui'

<ResultScreen
  status="success"
  title="신청이 승인되었습니다"
  subTitle="신청하신 프로그램 참여가 확정되었습니다."
  description="일정 및 활동 관련 안내는 문자 및 서비스 알림으로도 제공됩니다."
  guideMessages={[
    "일정 정보는 마이페이지에서 확인하실 수 있습니다.",
    "추가 안내사항은 마이페이지에서 확인하실 수 있습니다."
  ]}
  cta={{
    label: "마이페이지로 이동",
    targetUrl: "/mypage",
    type: "primary"
  }}
/>
```

**Props**:
- `status`: 결과 상태 ('success' | 'error' | 'info' | 'warning' | '404' | '403' | '500', 필수)
- `title`: 제목 (string, 필수)
- `subTitle`: 부제목 (string, 선택)
- `description`: 설명 (string, 선택)
- `guideMessages`: 안내 메시지 배열 (string[], 선택)
- `cta`: CTA 버튼 설정 (객체, 선택)
  - `label`: 버튼 텍스트 (string)
  - `targetUrl`: 이동할 URL (string, 선택)
  - `onClick`: 클릭 핸들러 (함수, 선택)
  - `type`: 버튼 타입 ('primary' | 'default' | 'danger', 기본값: 'primary')
- `extra`: 추가 컨텐츠 (ReactNode, 선택)

---

### 5. EmptyState - Empty State 컴포넌트

**용도**: 데이터 없음 상태 표시

**위치**: `@/shared/ui/empty-state`

**사용 예시**:

```typescript
import { EmptyState } from '@/shared/ui'

<EmptyState
  description="현재 승인된 일정이 없습니다."
  cta={{
    label: "프로그램 보기",
    targetUrl: "/programs",
    type: "primary"
  }}
/>
```

**Props**:
- `description`: 설명 문구 (string, 필수)
- `image`: 커스텀 이미지 (ReactNode, 선택)
- `cta`: CTA 버튼 설정 (객체, 선택)
  - `label`: 버튼 텍스트 (string)
  - `targetUrl`: 이동할 URL (string, 선택)
  - `onClick`: 클릭 핸들러 (함수, 선택)
  - `type`: 버튼 타입 ('primary' | 'default', 기본값: 'primary')

---

### 6. StatusTimeline - 상태 전이 Timeline 컴포넌트

**용도**: 상태 전이 과정 표시

**위치**: `@/shared/ui/status-timeline`

**사용 예시**:

```typescript
import { StatusTimeline } from '@/shared/ui'

const timelineItems = [
  {
    status: 'submitted',
    statusLabel: '접수',
    timestamp: application.submittedAt,
    description: '신청이 접수되었습니다.'
  },
  {
    status: 'reviewing',
    statusLabel: '검토',
    timestamp: application.reviewedAt,
    description: '신청이 검토 중입니다.'
  },
  {
    status: 'approved',
    statusLabel: '승인',
    timestamp: application.approvedAt,
    description: '신청이 승인되었습니다.'
  }
]

<StatusTimeline
  items={timelineItems}
  statusLabels={statusLabels}
  statusColors={statusColors}
/>
```

**Props**:
- `items`: Timeline 항목 배열 (StatusTimelineItem[], 필수)
  - `status`: 상태 값 (string)
  - `statusLabel`: 상태 라벨 (string)
  - `timestamp`: 타임스탬프 (string)
  - `description`: 설명 (string, 선택)
  - `color`: 색상 (string, 선택)
- `statusLabels`: 상태별 라벨 매핑 (Record<string, string>, 필수)
- `statusColors`: 상태별 색상 매핑 (Record<string, string>, 선택)

---

## 📝 사용 패턴

### 패턴 1: 상태 표시 + 단일 CTA

```typescript
import { StatusDisplay, SingleCTA } from '@/shared/ui'

<div>
  <StatusDisplay 
    status={application.status}
    statusLabels={statusLabels}
    statusColors={statusColors}
  />
  {application.nextAction && (
    <SingleCTA
      label={application.nextAction.label}
      targetUrl={application.nextAction.targetUrl}
    />
  )}
</div>
```

### 패턴 2: 결과 화면

```typescript
import { ResultScreen } from '@/shared/ui'

<ResultScreen
  status="success"
  title="작업이 완료되었습니다"
  description="추가 안내사항은 마이페이지에서 확인하실 수 있습니다."
  cta={{
    label: "마이페이지로 이동",
    targetUrl: "/mypage"
  }}
/>
```

### 패턴 3: Empty State + CTA

```typescript
import { EmptyState } from '@/shared/ui'

<EmptyState
  description="현재 데이터가 없습니다."
  cta={{
    label: "새로 만들기",
    targetUrl: "/new",
    type: "primary"
  }}
/>
```

---

## 🔗 관련 문서

- [공통 UI 원칙](./UI_PRINCIPLES.md)
- [프로젝트 가이드](./PROJECT_GUIDE.md)
- [MVP 로드맵 V2](./MVP_ROADMAP_V2.md)

---

**마지막 업데이트**: 2024-12-19




