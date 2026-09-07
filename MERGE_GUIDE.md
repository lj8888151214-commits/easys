# EASYS 통합 프로젝트

이 폴더는 두 프로젝트를 하나의 저장소에서 함께 사용할 수 있도록 합친 버전이다.

## 구조
- `src/main/java` : Spring Boot 백엔드
- `src/main/resources` : 기존 Thymeleaf/정적 페이지 + 스터디 신청 기능
- `frontend` : React/Vite 프론트엔드

## 이번 통합에서 합친 핵심
- 스터디 CRUD API
- 스터디 신청 API
- 신청자 조회
- 신청 승인/거절
- 내 신청 조회/취소
- 기존 회원/이메일 인증 백엔드 유지
- React 개발 서버에서 Spring API를 호출할 수 있도록 Vite proxy 추가

## 실행
백엔드:
```bash
./gradlew bootRun
```

프론트:
```bash
cd frontend
npm install
npm run dev
```

React에서 `/study`, `/study-application` 등의 API를 호출하면 Vite가 `http://localhost:8080`으로 전달한다.

## Git 팀 작업 기본 흐름
작업 시작:
```bash
git pull origin master
```

내 작업:
```bash
git checkout -b feature/내기능
git add .
git commit -m "feat: 기능 설명"
git push origin feature/내기능
```

팀원이 PR/merge 후:
```bash
git checkout master
git pull origin master
```

같은 파일을 두 명이 동시에 크게 수정하지 않는 것을 권장한다.
