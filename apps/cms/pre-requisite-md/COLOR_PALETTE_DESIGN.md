# 🎨 색상 팔레트 디자인 가이드

**작성일**: 2024-12-19  
**역할**: 시니어 디자이너  
**브랜드 컬러**: #01A1AF (메인), #296075, #22404B (서브)

---

## 📋 브랜드 컬러 정의

### 메인 컬러
- **Primary**: `#01A1AF` (청록/시안 계열)
  - 브랜드 아이덴티티의 핵심 색상
  - 주요 CTA, 강조 요소에 사용

### 서브 컬러
- **Secondary 1**: `#296075` (어두운 청록)
  - 보조 강조, 호버 상태
  - 텍스트, 아이콘에 사용

- **Secondary 2**: `#22404B` (매우 어두운 청록/네이비)
  - 배경, 구분선
  - 텍스트 (제목, 본문)

---

## 🎨 도메인별 색상 팔레트

### 색상 구성 원칙
1. **메인 컬러 계열 우선**: 브랜드 컬러를 기반으로 한 청록 계열
2. **색상 조화**: 유사 색상(analogous)과 보색(complementary) 활용
3. **시각적 구분**: 각 도메인이 명확히 구분되도록
4. **접근성**: WCAG 2.1 AA 기준 대비율 충족

### 도메인별 색상 배정

| 도메인 | Primary | Light | Dark | 색상 계열 | 사용 이유 |
|--------|---------|-------|------|----------|----------|
| **프로그램** | `#01A1AF` | `#E6F7F9` | `#296075` | 청록 (메인) | 핵심 도메인, 브랜드 컬러 직접 사용 |
| **학교** | `#13C2C2` | `#E6FFFB` | `#08979C` | 청록 (밝은) | 교육 기관, 메인 컬러와 유사 계열 |
| **강사** | `#722ED1` | `#F9F0FF` | `#531DAB` | 보라 | 전문성 강조, 메인과 보색 관계 |
| **스폰서** | `#FA8C16` | `#FFF7E6` | `#D46B08` | 주황 | 후원/지원 의미, 따뜻한 톤 |
| **신청** | `#EB2F96` | `#FFF0F6` | `#C41D7F` | 분홍 | 신청/액션, 활발한 느낌 |
| **일정** | `#FADB14` | `#FFFBE6` | `#D4B106` | 노랑 | 일정/시간, 주의 환기 |
| **매칭** | `#52C41A` | `#F6FFED` | `#389E0D` | 녹색 | 매칭/연결, 성공/완료 의미 |
| **정산** | `#FF4D4F` | `#FFF1F0` | `#CF1322` | 빨강 | 정산/금액, 중요도 강조 |

### 색상 선택 근거

#### 1. 프로그램 (#01A1AF) - 메인 컬러
- 브랜드 핵심 색상 직접 사용
- 가장 중요한 도메인

#### 2. 학교 (#13C2C2) - 밝은 청록
- 교육 기관 특성 반영
- 메인 컬러와 유사 계열로 일관성 유지

#### 3. 강사 (#722ED1) - 보라
- 전문성과 권위 표현
- 메인 청록과 보색 관계로 대비 효과

#### 4. 스폰서 (#FA8C16) - 주황
- 후원/지원의 따뜻함 표현
- 메인과 보색 관계

#### 5. 신청 (#EB2F96) - 분홍
- 신청/액션의 활발함 표현
- 주의 환기 효과

#### 6. 일정 (#FADB14) - 노랑
- 일정/시간의 중요성 강조
- 주의 환기 효과

#### 7. 매칭 (#52C41A) - 녹색
- 매칭/연결의 성공 의미
- 완료/확정 상태 표현

#### 8. 정산 (#FF4D4F) - 빨강
- 정산/금액의 중요도 강조
- 주의/경고 의미

---

## 🎯 색상 사용 가이드라인

### 1. Ant Design Theme 설정

```typescript
colorPrimary: '#01A1AF',      // 메인 브랜드 컬러
colorSuccess: '#52C41A',      // 성공/완료 (매칭 색상 활용)
colorWarning: '#FADB14',      // 경고/주의 (일정 색상 활용)
colorError: '#FF4D4F',        // 오류/취소 (정산 색상 활용)
colorInfo: '#01A1AF',         // 정보 (메인 컬러)
```

### 2. UI 컴포넌트별 색상 적용

#### Tag 컴포넌트
```typescript
// 도메인 식별
<Tag color={domainColors.program.primary}>프로그램</Tag>
<Tag color={domainColors.school.primary}>학교</Tag>

// 상태 표시 (Ant Design 기본 색상)
<Tag color="success">승인 완료</Tag>
<Tag color="processing">검토 중</Tag>
<Tag color="error">거절</Tag>
```

#### Badge 컴포넌트
```typescript
// 상태 표시
<Badge status="success" text="활성" />
<Badge status="processing" text="대기" />
<Badge status="error" text="오류" />
```

#### Card 컴포넌트
```typescript
// 도메인별 강조 (선택적)
<Card 
  style={{ 
    borderLeft: `4px solid ${domainColors.program.primary}` 
  }}
>
  프로그램 정보
</Card>
```

#### Button 컴포넌트
```typescript
// Primary 버튼: 메인 컬러 사용
<Button type="primary">등록</Button>

// 도메인별 액션 버튼 (선택적)
<Button 
  style={{ 
    backgroundColor: domainColors.program.primary,
    borderColor: domainColors.program.primary 
  }}
>
  프로그램 등록
</Button>
```

#### Table 컴포넌트
```typescript
// 행 강조 (호버 시)
<Table
  onRow={(record) => ({
    onMouseEnter: (e) => {
      e.currentTarget.style.backgroundColor = domainColors.program.light;
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    },
  })}
/>
```

### 3. 상태별 색상 매핑

| 상태 | Ant Design 색상 | Hex 값 | 사용 예시 |
|------|----------------|--------|----------|
| 활성 (active) | `success` | `#52C41A` | 활성 프로그램, 승인 완료 |
| 대기 (pending) | `processing` | `#01A1AF` | 검토 중, 대기 중 (메인 컬러) |
| 완료 (completed) | `default` | `#8C8C8C` | 완료된 항목 |
| 취소 (cancelled) | `error` | `#FF4D4F` | 취소된 항목 |
| 비활성 (inactive) | `default` | `#8C8C8C` | 비활성 상태 |

### 4. 텍스트 색상

```css
/* 제목 */
--color-text-heading: #22404B;  /* 서브 컬러 2 */

/* 본문 */
--color-text-body: #595959;

/* 보조 텍스트 */
--color-text-secondary: #8C8C8C;

/* 링크 */
--color-link: #01A1AF;  /* 메인 컬러 */
--color-link-hover: #296075;  /* 서브 컬러 1 */
```

### 5. 배경 색상

```css
/* 메인 배경 */
--color-bg-base: #FFFFFF;

/* 보조 배경 */
--color-bg-secondary: #FAFAFA;

/* 강조 배경 */
--color-bg-accent: #E6F7F9;  /* 메인 컬러 Light */

/* 호버 배경 */
--color-bg-hover: #F0F0F0;
```

---

## 🔍 접근성 검증

### 색상 대비율 (WCAG 2.1 AA 기준: 4.5:1)

| 조합 | 대비율 | 결과 |
|------|--------|------|
| Primary (#01A1AF) on White | 3.2:1 | ❌ 미충족 (텍스트 크기 18px 이상 필요) |
| Primary (#01A1AF) on Light (#E6F7F9) | 1.2:1 | ❌ 미충족 (배경으로만 사용) |
| Dark (#296075) on White | 7.1:1 | ✅ 충족 |
| Dark (#22404B) on White | 12.6:1 | ✅ 충족 |

**개선 방안**:
- Primary 색상은 텍스트보다 배경/아이콘에 주로 사용
- 텍스트는 Dark 색상 사용
- 또는 텍스트 크기를 18px 이상으로 설정

---

## 📐 구현 파일

### 1. CSS 변수 업데이트
- `src/app/providers/theme-provider.css`

### 2. TypeScript 상수 업데이트
- `src/shared/constants/colors.ts`

### 3. Ant Design Theme 업데이트
- `src/app/providers/theme-provider.tsx`

---

## ✅ 체크리스트

- [ ] CSS 변수 업데이트
- [ ] TypeScript 상수 업데이트
- [ ] Ant Design Theme 설정 업데이트
- [ ] 주요 화면에 색상 적용
- [ ] 접근성 검증 (색상 대비율)
- [ ] 사용자 테스트

---

**작성자**: 시니어 디자이너  
**승인 필요**: 개발팀, PM  
**다음 단계**: 색상 팔레트 구현



