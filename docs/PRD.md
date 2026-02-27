📑 Project Master Plan: Notice (노티스)
1. 개요 (Overview)
서비스명: Notice (노티스)

한 줄 정의: "잊지 않기 위해 기록하고, AI가 알아서 분류하는 텍스트 중심 인사이트 저장소"

핵심 타겟: 모바일에서 정보를 수집하고 PC에서 정리하는 유저, 할 일을 자주 잊어 잠금화면에 상기시키고 싶은 유저.

2. 디자인 원칙 (Design Principles)
Minimalist & Utility: 화려한 이미지보다는 텍스트의 가독성과 정보의 구조에 집중 (애플 순정 메모 앱 스타일).

Text-Centric: 썸네일 노출을 최소화하고 제목, 본문 요약, 카테고리 태그 중심으로 구성.

Efficiency: 최소한의 클릭으로 저장하고 분류할 수 있는 동선 확보.

3. 기술 스택 (Tech Stack)
Frontend (Mobile): Flutter (iOS Share Extension 및 WidgetKit 연동 최적화)

Frontend (Web): Next.js (PC 대시보드 및 관리용)

Backend/DB: Supabase (Auth, Realtime DB, Edge Functions)

AI: OpenAI API (gpt-4o-mini 등) - 콘텐츠 분석 및 폴더 추천용.

4. 핵심 기능 로드맵 (Priority Roadmap)
[Phase 1: iOS Share Extension & AI 분류] - 최우선 순위
Share Extension: 인스타그램, 유튜브, 브라우저 등에서 '공유하기' 클릭 시 'Notice' 앱이 노출되어 즉시 저장.

AI Auto-Categorization: * 링크가 유입되면 AI가 제목과 내용을 분석.

기존 폴더(주식, 여행, 업무 등) 중 가장 적합한 곳을 추천하거나 자동 분류.

Real-time Sync: 모바일에서 저장 즉시 Supabase를 통해 PC 웹 대시보드에 반영.

[Phase 2: 잠금화면 위젯 & 체크리스트]
Lock Screen Widget: 아이폰 잠금화면에 '포스트잇' 형태로 메모 또는 체크리스트 노출.

Interactive Task: 잠금화면에서 바로 완료 체크가 가능한 라이브 액티비티 활용.

[Phase 3: 구글 캘린더 연동]
Two-way Sync: 구글 캘린더 API 연동. 앱 내 일정 수정 시 캘린더 반영, 반대도 가능.

5. 데이터 구조 (Data Schema)
users: ID, 이메일, 구글 연동 토큰.

folders: ID, 유저ID, 폴더명(주식, 여행, 업무 등), 아이콘.

links: ID, 폴더ID, 원본 URL, AI 요약 텍스트, 상태(확인 전/후).

tasks: ID, 유저ID, 내용, 완료 여부, 잠금화면 노출 여부, 시작/종료 시간.

6. AI에게 주는 첫 번째 지시문 (First Prompt)
"너는 지금부터 'Notice'라는 프로젝트를 개발하는 시니어 개발자야. 위 마스터 플랜을 바탕으로 프로젝트를 시작할 거야.

먼저 Flutter 프로젝트 구조를 잡고, Supabase 연동 설계를 진행해줘.

가장 먼저 구현할 것은 iOS Share Extension이야. 아이폰에서 링크를 공유했을 때 우리 앱으로 URL이 전달되는 구조를 먼저 만들어줘.

그 다음, 유입된 URL의 메타데이터를 긁어오고 AI(OpenAI)를 사용해 폴더를 추천해주는 로직을 작성할 거야.