# Cursor prompt — 기관소개 Platform SSOT DB 시드 (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. 값·path·금지는 이 문서만 사용하라.  
질문이 필요하면 스키마·unique 제약·published 컬럼이 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/organization-introduction-platform-seed-backend-cursor-prompt-2026-09-26.md`

관련 API 문서(별도):

`apps/admin/docs/api/public-organization-introduction-api-backend-cursor-prompt-2026-09-26.md`

값의 기준은 Platform `/about/introduction` 화면 카피(2026-09-26)다.  
Admin localStorage mock·옛 Admin seed(예: Worldwide `1,500만`, Global Value `학습 장려`, BI `A 브랜드`)는 **SSOT가 아니다.**

공개 API `GET /api/public/ja-korea/organization` 과 Admin CRUD path는 이미 있다.  
이번 작업은 **로컬/dev DB 문구**를 Platform과 같게 맞춘다. 테이블·엔드포인트를 새로 만들지 마라.

---

## 배경

| 화면 블록 | Admin 저장 | 공개 응답 |
|-----------|------------|-----------|
| Hero / Vision·Mission | introduction 싱글톤 | `introduction` |
| JA Global Value | global-values 5행 | `globalValues` |
| JA Worldwide | worldwide 싱글톤 + links | `worldwide` |
| 연혁 / 수상 / 인증 | history · awards · certifications | 동명 배열(공개만) |
| 브랜드 아이덴티티 | bi 싱글톤 | `bi` |

Platform은 공개 GET만 읽는다. 아이콘·지도·심볼 이미지·기간 탭·스탯은 FE 고정 → DB에 넣지 마라.

---

## Goal

로컬/dev Homepage DB의 기관소개가 Platform `/about/introduction` 과 같게 한다.

완료 조건:

1. 무토큰 `GET /api/public/ja-korea/organization` 의 아래 필드가 이 문서 JSON과 **문자 단위 동일**하다(공백·문장 부호 포함).
2. `globalValues` 는 **5건**, `itemCode` `VALUE_1`…`VALUE_5`, `displayOrder` 1…5, 모두 공개(enabled).
3. `worldwide.links` 에 `JA_WORLDWIDE` + 지역 6코드 URL이 있다.
4. `history` 는 아래 플랫 목록과 동일 집합(순서 무관). year/month/content 매칭.
5. `awards` 는 **10건**, `certifications` 는 **3건**(중복 없이). 모두 published.
6. 시드는 **idempotent**. 두 번 실행해도 싱글톤 행·고정 5 value·링크·시드 키 행이 늘지 않는다. TRUNCATE 금지.
7. 이 시드 집합 밖이면서 published=true 인 연혁/수상/인증은 `published=false` 로 내린다. DELETE 하지 마라.
8. **local/dev 전용.** prod Flyway·앱 기동·repeatable migration이 이 SQL을 자동 실행하지 않는다.
9. Admin/Platform 프론트 파일은 수정하지 않는다.

```bash
curl -sS 'http://localhost:8081/api/public/ja-korea/organization' | python3 -m json.tool | head
```

---

## Out of scope / 금지

- API path·DTO 필드명 변경
- 아이콘·지도 SVG·BI 심볼을 MinIO에 업로드
- Worldwide 스탯 `15,140,800`, 호버 가이드, 지도 좌표를 DB 컬럼으로 추가
- Admin 옛 문구로 되돌리기 (`1,500만`, `학습 장려`, `A 브랜드`, `비영리기구` Admin mock 등)
- Platform mock 시절 수상 **86건 패딩**(동일 10건 반복) — **시드하지 마라.** 유니크 10건만.
- TRUNCATE / 무관 행 DELETE
- prod 마이그레이션

---

## 시드 규칙

스크립트: `scripts/seed_ja_organization_platform_local.sql`  
없으면 이 이름으로 만든다.

테이블은 기존 introduction / global_value / worldwide / history / award / certification / bi 테이블이다.  
로컬 DB 이름이 `ja_cms_local` 이 아니면 Homepage가 이미 쓰는 DB를 써라.

1. 싱글톤(introduction, worldwide setting, bi): 있으면 UPDATE, 없으면 1행 INSERT.
2. global values: `(item_code)` 5칸 UPSERT. 문구·display_order·enabled=true.
3. worldwide links: `link_code` 7칸 URL UPDATE(또는 UPSERT). displayName은 Admin용 — 아래 표 참고.
4. history / awards / certifications: natural key로 UPSERT 후, 시드 밖 published 행은 unpublished.
   - history key 예: `(year, month, content)`
   - award key 예: `(award_name, awarded_date)`
   - cert key 예: `(content, certification_institution)`
5. `version` 컬럼이 있으면 기존 값을 유지하거나 +1 정책은 기존 시드와 동일하게.

---

## 1. introduction (싱글톤)

공개 `introduction` / Admin `IntroductionUpdateRequest` 동일 의미.

```json
{
  "section1Subtitle": "JA Korea는 청소년의 무한한 가능성을 믿습니다",
  "section1Title": "청소년이 마음껏 역량을 발휘하며 성공할 수 있도록 함께합니다",
  "section2TitleEn": "Inspiring Youth",
  "section2SubtitleKo": "JA Korea는 청소년의 가능성을 미래로 연결합니다",
  "content1Title": "청소년을 위한 글로벌 교육 네트워크",
  "content1Description": "JA Korea는 국제 교육 비정부기구(NGO)인 JA Worldwide의 한국 지부입니다. 2002년부터 청소년에게 진로·취업, 경제·금융, 기업가정신, 디지털 리터러시 교육을 제공하고 있습니다.",
  "content2Title": "청소년의 미래를 위한 체계적인 교육 경험",
  "content2Description": "관심 있는 분야를 탐색하며 영감(Inspire)을 얻고, 지식과 기술을 습득하며 미래를 체계적으로 준비(Prepare)하고, 배우고 협력하는 과정을 통해 성장(Succeed)을 경험하도록 돕습니다.",
  "globalVisionSubtitleEn": "Young people have the skillset and mindset to build thriving communities.",
  "globalVisionTextKo": "공동체의 성장을 이끌 수 있는 역량과 마음가짐을 갖춘 청소년이 되도록 교육합니다.",
  "globalMissionSubtitleEn": "JA inspires and prepares young people to succeed in a global economy.",
  "globalMissionTextKo": "청소년이 마음껏 역량을 발휘하며 성공할 수 있도록 함께합니다."
}
```

참고: Platform 화면은 일부 문구를 PC에서 줄바꿈한다. DB에는 **연속 문자열**로 저장해도 된다(`\n` 불필요).

---

## 2. globalValues (5건)

| itemCode | displayOrder | mainText | subText |
|----------|-------------:|----------|---------|
| `VALUE_1` | 1 | `BELIEVE IN THE BOUNDLESS POTENTIAL OF YOUNG PEOPLE` | `청소년의 무한한 잠재력에 대한 믿음` |
| `VALUE_2` | 2 | `ADVOCATE FOR RELEVANT, HANDS-ON LEARNING` | `실전 중심의 학습 정리` |
| `VALUE_3` | 3 | `TEACH ECONOMICS AND ENTREPRENEURSHIP FOR A MORE SUSTAINABLE WORLD` | `지속가능한 세상을 위한 시장경제와 기업가정신 교육` |
| `VALUE_4` | 4 | `APPROACH OUR WORK WITH PASSION, HONESTY, INTEGRITY, AND EXCELLENCE` | `열정, 정직, 진정성, 탁월함에 기반한 실천` |
| `VALUE_5` | 5 | `SEEK DIVERSE PERSPECTIVES TO REFLECT THE COMMUNITIES WE SERVE` | `파트너십과 협업을 통한 영향력 확대` |

모두 `enabled=true`.

---

## 3. worldwide

### 3.1 guidanceText (하단 설명)

```
JA Worldwide는 100여년간 쌓아온 경험과 열정을 가진 세계에서 가장 영향력 있는 청소년 교육 NGO중 하나로서, 매년 약 100여 개국에서 50만 명 교육 진행자들과 함께 2,300만 명 이상의 청소년들을 교육하고 있습니다.
```

### 3.2 links

| linkCode | displayName (Admin) | externalUrl |
|----------|---------------------|-------------|
| `JA_WORLDWIDE` | `JA Worldwide` | `https://www.jaworldwide.org/` |
| `JA_USA` | `JUNIOR ACHIEVEMENT USA` | `https://jausa.ja.org/` |
| `JA_EUROPE` | `JA EUROPE` | `https://www.jaeurope.org/` |
| `JA_MENA` | `INJAZ AL-ARAB JA MENA` | `https://injazalarab.org/` |
| `JA_ASIA_PACIFIC` | `JA ASIA PACIFIC` | `https://www.jaasiapacific.org/` |
| `JA_AMERICAS` | `JA AMERICAS includes Canada` | `https://www.jaamericas.org/` |
| `JA_AFRICA` | `JA AFRICA` | `https://ja-africa.org/` |

URL은 `www.` 유무까지 Platform과 맞춘다(`jaamericas`·`jaeurope`·`injazalarab`).

---

## 4. history (플랫 목록 → year/month/content)

공개 GET은 배열. FE가 연·월 그룹.

아래를 **전부** published로 시드한다. (2020은 월별 상세, 그 외 연도는 01/06/12 요약 — Platform 퍼블리싱 데이터 그대로.)

### 4.1 year=2020

| month | content |
|------:|---------|
| 12 | 삼성전자와 함께하는 'Care Beyond Skin' 온라인 교육 |
| 12 | 삼성전자와 함께하는 'We Tech Care' 온라인 교육 |
| 12 | 삼성SDS Brightics AI 교육 실시 |
| 11 | JA TTBiz Kick-off |
| 11 | JA Korea 온라인 기업가정신 캠프 운영 |
| 10 | JA Company Program 온라인 전환 운영 |
| 10 | 금융감독원과 함께하는 금융교육 프로그램 |
| 10 | 청소년 기업가정신 온라인 페스티벌 |
| 09 | JA Job Shadow 비대면 멘토링 |
| 09 | 학교 연계 온라인 경제교육 확대 |
| 08 | 여름방학 JA Camp 온라인 개최 |
| 08 | 교사 연수 프로그램 진행 |
| 07 | JA Personal Finance 온라인 클래스 |
| 07 | 기업 파트너십 온라인 세미나 |
| 06 | 상반기 JA Achievement 시상식 |
| 06 | 지역 지부 온라인 네트워킹 |
| 05 | JA Economics for Success 온라인 수업 |
| 05 | 청소년 리더십 워크숍 |
| 04 | 신학기 학교 프로그램 온라인 지원 |
| 04 | JA Volunteer 온보딩 |
| 03 | JA Korea 연간 계획 공유회 |
| 03 | 파트너 기업 킥오프 미팅 |
| 02 | 교사 대상 기업가정신 연수 |
| 02 | 신규 프로그램 파일럿 운영 |
| 01 | 2020 JA Korea 신년 비전 공유 |
| 01 | 글로벌 JA 네트워크 연계 회의 |

### 4.2 기타 연도 (month 12 / 06 / 01)

각 연도마다 3행:

| year | month=12 contents | month=06 | month=01 |
|-----:|-------------------|----------|----------|
| 2026 | `2026년 신규 비전 프로젝트 론칭` · `2026 JA Korea 연말 성과 공유` | `2026년 상반기 주요 프로그램 운영` | `2026 JA Korea 신년 계획 발표` |
| 2025 | `2025년 전국 청소년 기업가정신 페스티벌` · `2025 JA Korea 연말 성과 공유` | `2025년 상반기 주요 프로그램 운영` | `2025 JA Korea 신년 계획 발표` |
| 2024 | `2024년 JA Asia Pacific 교류 프로그램` · `2024 JA Korea 연말 성과 공유` | `2024년 상반기 주요 프로그램 운영` | `2024 JA Korea 신년 계획 발표` |
| 2023 | `2023년 디지털 금융교육 확대` · `2023 JA Korea 연말 성과 공유` | `2023년 상반기 주요 프로그램 운영` | `2023 JA Korea 신년 계획 발표` |
| 2022 | `2022년 대면·비대면 하이브리드 교육 정착` · `2022 JA Korea 연말 성과 공유` | `2022년 상반기 주요 프로그램 운영` | `2022 JA Korea 신년 계획 발표` |
| 2021 | `2021년 온라인 교육 플랫폼 고도화` · `2021 JA Korea 연말 성과 공유` | `2021년 상반기 주요 프로그램 운영` | `2021 JA Korea 신년 계획 발표` |
| 2019 | `2019년 JA Company Program 전국 확대` · `2019 JA Korea 연말 성과 공유` | `2019년 상반기 주요 프로그램 운영` | `2019 JA Korea 신년 계획 발표` |
| 2018 | `2018년 기업 파트너십 다각화` · `2018 JA Korea 연말 성과 공유` | `2018년 상반기 주요 프로그램 운영` | `2018 JA Korea 신년 계획 발표` |
| 2017 | `2017년 교사 연수 체계 강화` · `2017 JA Korea 연말 성과 공유` | `2017년 상반기 주요 프로그램 운영` | `2017 JA Korea 신년 계획 발표` |
| 2016 | `2016년 지역 거점 교육 확대` · `2016 JA Korea 연말 성과 공유` | `2016년 상반기 주요 프로그램 운영` | `2016 JA Korea 신년 계획 발표` |
| 2015 | `2015년 청소년 경제교육 캠페인` · `2015 JA Korea 연말 성과 공유` | `2015년 상반기 주요 프로그램 운영` | `2015 JA Korea 신년 계획 발표` |
| 2014 | `2014년 JA Job Shadow 확대` · `2014 JA Korea 연말 성과 공유` | `2014년 상반기 주요 프로그램 운영` | `2014 JA Korea 신년 계획 발표` |
| 2013 | `2013년 학교 연계 프로그램 고도화` · `2013 JA Korea 연말 성과 공유` | `2013년 상반기 주요 프로그램 운영` | `2013 JA Korea 신년 계획 발표` |
| 2012 | `2012년 자원봉사자 네트워크 강화` · `2012 JA Korea 연말 성과 공유` | `2012년 상반기 주요 프로그램 운영` | `2012 JA Korea 신년 계획 발표` |
| 2011 | `2011년 신규 교육 콘텐츠 개발` · `2011 JA Korea 연말 성과 공유` | `2011년 상반기 주요 프로그램 운영` | `2011 JA Korea 신년 계획 발표` |
| 2010 | `2010년 전국 지부 협력 강화` · `2010 JA Korea 연말 성과 공유` | `2010년 상반기 주요 프로그램 운영` | `2010 JA Korea 신년 계획 발표` |
| 2009 | `2009년 청소년 리더십 캠프` · `2009 JA Korea 연말 성과 공유` | `2009년 상반기 주요 프로그램 운영` | `2009 JA Korea 신년 계획 발표` |
| 2008 | `2008년 기업가정신 교육 확산` · `2008 JA Korea 연말 성과 공유` | `2008년 상반기 주요 프로그램 운영` | `2008 JA Korea 신년 계획 발표` |
| 2007 | `2007년 파트너십 프로그램 확대` · `2007 JA Korea 연말 성과 공유` | `2007년 상반기 주요 프로그램 운영` | `2007 JA Korea 신년 계획 발표` |
| 2006 | `2006년 학교 경제교육 지원` · `2006 JA Korea 연말 성과 공유` | `2006년 상반기 주요 프로그램 운영` | `2006 JA Korea 신년 계획 발표` |
| 2005 | `2005년 지역 사회 연계 활동` · `2005 JA Korea 연말 성과 공유` | `2005년 상반기 주요 프로그램 운영` | `2005 JA Korea 신년 계획 발표` |
| 2004 | `2004년 교육 커리큘럼 정비` · `2004 JA Korea 연말 성과 공유` | `2004년 상반기 주요 프로그램 운영` | `2004 JA Korea 신년 계획 발표` |
| 2003 | `2003년 자원봉사자 양성` · `2003 JA Korea 연말 성과 공유` | `2003년 상반기 주요 프로그램 운영` | `2003 JA Korea 신년 계획 발표` |
| 2002 | `2002년 JA Korea 주요 활동 정착` · `2002 JA Korea 연말 성과 공유` | `2002년 상반기 주요 프로그램 운영` | `2002 JA Korea 신년 계획 발표` |

month=12 는 표의 두 content를 **각각 한 행**으로 INSERT.

---

## 5. awards (10건, published)

`awardedDate` 는 해당 월 1일(`YYYY-MM-01`).

| awardedDate | awardName | awardingInstitution |
|-------------|-----------|---------------------|
| 2025-12-01 | JA Worldwide Nominated for the 2023 Nobel Peace Prize | 노벨위원회 |
| 2025-11-01 | 경제교육 우수기관 표창 | 기획재정부, 경제교육단체협의회 |
| 2025-10-01 | 청소년 기업가정신 교육 공로상 | 교육부 |
| 2025-09-01 | 사회공헌 우수 파트너 선정 | 국민대학교 |
| 2025-08-01 | 금융교육 우수 프로그램상 | 금융감독원 |
| 2025-07-01 | 글로벌 네트워크 기여 표창 | JA Worldwide |
| 2025-06-01 | 청소년 역량 강화 유공 표창 | 여성가족부 |
| 2025-05-01 | CSR 교육 파트너십 우수상 | 대한상공회의소 |
| 2025-04-01 | 디지털 교육 혁신상 | 과학기술정보통신부 |
| 2025-03-01 | 지역 상생 교육 공로상 | 서울특별시 |

---

## 6. certifications (3건, published)

Platform UI에 동일 교육부 행이 두 번 있었지만 **DB에는 1건만**.

| certifiedDate | content | certificationInstitution |
|---------------|---------|--------------------------|
| 2025-12-01 | 교육기부기관 지정 (인증번호 제2011-062호) | 교육부 |
| 2025-12-01 | JA Worldwide Members in Good Standing | JA Worldwide |
| 2025-12-01 | OECD산하 금융교육국제네트워크(INFE)의 Affiliate member | OECD International Network on Financial Education |

---

## 7. bi (싱글톤)

```json
{
  "title": "브랜드 아이덴티티",
  "mainText": "JA Korea의 심볼과 로고는 JA 교육을 통해 청소년들이 함께 성장하고 나아가는 모습을 담고 있습니다.",
  "subText": "브랜드의 초기 모델인 '새'의 형상을 바탕으로, 청소년들이 교육을 통해 얻은 지식과 기술, 유연한 사고방식을 세상과 나누며 글로벌 사회에 긍정적인 영향력을 펼쳐가는 모습을 '날개'라는 시각적 상징으로 표현했습니다."
}
```

---

## 8. 검증

```bash
curl -sS 'http://localhost:8081/api/public/ja-korea/organization' -o /tmp/org-seed.json

python3 - <<'PY'
import json
data=json.load(open('/tmp/org-seed.json'))
if isinstance(data, dict) and data.get('success') is True and 'data' in data:
  data=data['data']
intro=data['introduction']
assert intro['section1Subtitle']=='JA Korea는 청소년의 무한한 가능성을 믿습니다'
assert '2,300만' in data['worldwide']['guidanceText']
assert '비정부기구' in intro['content1Description']
vals=sorted(data['globalValues'], key=lambda r: r.get('displayOrder') or 0)
assert len(vals)==5
assert vals[1]['subText']=='실전 중심의 학습 정리'
assert data['bi']['subText'].startswith("브랜드의 초기 모델")
assert not data['bi']['subText'].startswith('A 브랜드')
awards=data['awards']
certs=data['certifications']
assert len(awards)==10
assert len(certs)==3
hist=data['history']
assert any(h.get('year')==2020 and h.get('month')==12 and 'Care Beyond Skin' in (h.get('content') or '') for h in hist)
print('organization platform seed: ok')
PY
```

시드 스크립트를 두 번 실행한 뒤 같은 assert가 통과하고, history/awards/certs 행 수가 늘지 않아야 한다.

---

## 9. 완료 후

API 계약 이슈가 있으면 API 문서로 돌아가라. 이 시드 문서에서 path/스키마를 바꾸지 마라.
