# 공통 UI 원칙

**작성 일자**: 2024-12-19  
**기준 문서**: MVP_ROADMAP_V2.md, JA코리아 사용자화면 프롬프트_1219.md  
**적용 범위**: Phase 5 사용자 화면 기반 UI 개선 및 이후 모든 화면

---

## 📋 개요

이 문서는 JAKorea CMS 프로젝트의 공통 UI 원칙을 정의합니다. 모든 화면 개발 시 이 원칙을 준수해야 합니다.

---

## 🎯 상태 표시 원칙

### 핵심 원칙

1. **상태는 반드시 문장으로 설명**
   - ❌ 아이콘/색상만으로 상태 표시
   - ✅ "신청이 접수되었습니다." 같은 명확한 문장 사용
   - ✅ Badge, Tag 등은 보조 수단으로만 사용

2. **단일 상태만 표시**
   - ❌ 여러 상태를 동시에 표시
   - ✅ 현재 상태 하나만 명확히 표시
   - ✅ 상태 전이 과정은 Timeline 등으로 별도 표시

3. **Enum 기반 조건 제어**
   - ❌ 하드코딩된 상태 문자열
   - ✅ 서버에서 받은 Enum 값 기반으로 조건부 렌더링
   - ✅ 상태 매핑은 상수로 정의

4. **reason_public 그대로 표시**
   - ❌ reason_public을 요약하거나 재작성
   - ✅ 서버에서 받은 reason_public을 그대로 표시
   - ✅ 의미 변경 금지

### 구현 예시

```typescript
// ✅ 올바른 예시
const getStatusMessage = (status: ApplicationStatus): string => {
  const messages: Record<ApplicationStatus, string> = {
    submitted: '신청이 접수되었습니다.',
    reviewing: '신청이 검토 중입니다.',
    approved: '신청이 승인되었습니다.',
    rejected: '신청이 반려되었습니다.',
    cancelled: '신청이 취소되었습니다.',
  }
  return messages[status] || '알 수 없는 상태입니다.'
}

// ❌ 잘못된 예시
const getStatusMessage = (status: string): string => {
  if (status === 'submitted') return '접수됨' // 너무 짧음
  if (status === 'reviewing') return '검토 중' // 문장이 아님
  return status // Enum 값 그대로 노출
}
```

---

## 🎯 CTA (Call-to-Action) 원칙

### 핵심 원칙

1. **최대 1개만 노출**
   - ❌ 여러 주요 버튼을 동시에 표시
   - ✅ 사용자가 지금 해야 할 행동 하나만 명확히 표시
   - ✅ 보조 액션은 드롭다운 메뉴 등으로 숨김

2. **명확한 행동 안내**
   - ❌ "다음 단계", "처리하기" 같은 모호한 문구
   - ✅ "신청하기", "보고서 제출하기" 같은 구체적 행동
   - ✅ 사용자가 "지금 뭘 해야 하지?"라고 고민하면 실패

3. **targetUrl 기반 네비게이션**
   - ❌ 프론트엔드에서 임의로 판단하여 라우팅
   - ✅ 서버에서 받은 targetUrl을 그대로 사용
   - ✅ targetUrl이 없으면 CTA를 표시하지 않음

### 구현 예시

```typescript
// ✅ 올바른 예시
{nextAction && nextAction.targetUrl && (
  <Button 
    type="primary" 
    onClick={() => navigate(nextAction.targetUrl)}
  >
    {nextAction.label || '다음 단계로 이동'}
  </Button>
)}

// ❌ 잘못된 예시
<Space>
  <Button type="primary">신청하기</Button>
  <Button>상세 보기</Button>
  <Button>문의하기</Button>
</Space>
```

---

## 🎯 안내 문구 원칙

### 핵심 원칙

1. **고정 문구 준수**
   - ❌ 의미를 변경하거나 요약
   - ✅ 서버에서 받은 문구를 그대로 표시
   - ✅ 필요 시 문구 변경은 서버와 협의

2. **순서 변경 불가**
   - ❌ 문장 순서를 임의로 변경
   - ✅ 서버에서 정의한 순서 그대로 표시
   - ✅ 순서가 중요한 경우 명시적으로 문서화

3. **안정적인 어조**
   - ❌ 사용자 불안을 유발하는 표현
   - ✅ 명확하고 안정적인 어조 사용
   - ✅ "오류", "실패" 같은 부정적 표현 최소화

### 구현 예시

```typescript
// ✅ 올바른 예시
<Alert
  message={serverResponse.guideMessage}
  type="info"
/>

// ❌ 잘못된 예시
<Alert
  message={`${serverResponse.guideMessage} (요약)`} // 요약 금지
  type="info"
/>
```

---

## 🚫 FORBIDDEN 원칙

### 절대 금지 사항

1. **상태(Enum) 추론 또는 생성**
   - ❌ 프론트엔드에서 상태를 계산하거나 추론
   - ✅ 서버에서 받은 상태 값만 사용
   - ✅ 상태 매핑은 상수로만 정의

2. **관리자/운영 정보 노출**
   - ❌ reason_internal, 로그, 디버그 정보 노출
   - ✅ 사용자에게 필요한 정보만 표시
   - ✅ 관리자 전용 정보는 별도 화면에서만 표시

3. **문의 유도 문구**
   - ❌ "문의하세요", "담당자 연락" 같은 문구
   - ✅ 명확한 안내 문구로 대체
   - ✅ 문의가 필요한 경우 시스템 내 문의 기능 제공

4. **복수 주요 CTA 동시 노출**
   - ❌ 여러 주요 버튼을 동시에 표시
   - ✅ 단일 CTA만 표시
   - ✅ 보조 액션은 드롭다운 등으로 숨김

5. **프론트엔드 임의 판단**
   - ❌ 신청 가능 여부를 프론트엔드에서 판단
   - ❌ 상태 전이를 프론트엔드에서 결정
   - ✅ 서버 응답 기반으로만 UI 구성

### 구현 예시

```typescript
// ❌ 잘못된 예시
const canApply = program.status === 'active' && new Date() < program.endDate
{canApply && <Button>신청하기</Button>} // 프론트엔드 판단 금지

// ✅ 올바른 예시
{program.applicationAvailable && program.applicationUrl && (
  <Button onClick={() => navigate(program.applicationUrl)}>
    신청하기
  </Button>
)} // 서버 응답 기반
```

---

## 🎨 컴포넌트 사용 가이드

### Ant Design 컴포넌트 활용

1. **상태 표시**
   - `Badge`: 상태 보조 표시 (색상/아이콘)
   - `Tag`: 카테고리/타입 표시
   - `Alert`: 중요 안내 메시지
   - `Typography.Text`: 상태 문장 표시

2. **CTA 버튼**
   - `Button type="primary"`: 단일 주요 CTA
   - `Button type="default"`: 보조 액션 (드롭다운 메뉴 내)
   - `Button danger`: 삭제 등 위험한 액션

3. **안내 문구**
   - `Alert`: 중요 안내
   - `Typography.Paragraph`: 일반 안내 문구
   - `Empty`: 데이터 없음 상태

4. **레이아웃**
   - `Card`: 정보 그룹핑
   - `Descriptions`: 상세 정보 표시
   - `Tabs`: 정보 분류
   - `Timeline`: 상태 전이 표시

### 공통 컴포넌트 패턴

```typescript
// 상태 표시 컴포넌트 예시
interface StatusDisplayProps {
  status: string
  statusLabels: Record<string, string>
  statusColors: Record<string, string>
}

export function StatusDisplay({ status, statusLabels, statusColors }: StatusDisplayProps) {
  return (
    <Space>
      <Badge status={statusColors[status] as any} />
      <Text>{statusLabels[status] || status}</Text>
    </Space>
  )
}

// 단일 CTA 컴포넌트 예시
interface SingleCTAProps {
  label: string
  targetUrl?: string
  onClick?: () => void
  type?: 'primary' | 'default' | 'danger'
}

export function SingleCTA({ label, targetUrl, onClick, type = 'primary' }: SingleCTAProps) {
  const navigate = useNavigate()
  
  const handleClick = () => {
    if (targetUrl) {
      navigate(targetUrl)
    } else if (onClick) {
      onClick()
    }
  }
  
  return (
    <Button type={type} onClick={handleClick}>
      {label}
    </Button>
  )
}
```

---

## 📝 체크리스트

### 화면 개발 시 확인 사항

- [ ] 상태는 문장으로 명확히 표시되었는가?
- [ ] 단일 상태만 표시되는가?
- [ ] Enum 기반 조건 제어를 사용하는가?
- [ ] reason_public을 그대로 표시하는가?
- [ ] 주요 CTA는 1개만 노출되는가?
- [ ] CTA 문구가 명확한가?
- [ ] targetUrl 기반 네비게이션을 사용하는가?
- [ ] 안내 문구를 고정 문구로 표시하는가?
- [ ] 문구 순서를 변경하지 않았는가?
- [ ] 상태를 추론하거나 생성하지 않았는가?
- [ ] 관리자/운영 정보를 노출하지 않았는가?
- [ ] 문의 유도 문구를 사용하지 않았는가?
- [ ] 프론트엔드에서 임의 판단하지 않았는가?

---

## 🔗 관련 문서

- [MVP 로드맵 V2](./MVP_ROADMAP_V2.md)
- [프로젝트 가이드](./PROJECT_GUIDE.md)
- [JA코리아 사용자화면 프롬프트](./JA코리아%20사용자화면%20프롬프트_1219.md)

---

**마지막 업데이트**: 2024-12-19

