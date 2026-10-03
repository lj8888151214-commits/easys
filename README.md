# 💻 easys
> **실시간 WebSocket 양방향 통신 & 미디어 스트리밍 기반 스터디 및 멘토링 매칭 플랫폼**

---

### 💡 1. 기획 의도 및 배경

| 항목 | 내용 |
| :--- | :--- |
| **비대면 실시간 인터랙션 제공** | 단순 텍스트 질의응답을 넘어 실시간 양방향 채팅과 미디어 스트리밍 환경을 제공하여 온라인 멘토링의 몰입도를 극대화합니다. |
| **체계적인 스터디 일정 관리** | 멘토와 멘티 간의 멘토링 시간 조율 및 스터디 일정을 캘린더와 동기화하여 예약 누락 및 일정 충돌을 방지합니다. |
| **개발자·학습자 지식 공유 허브** | 도메인별 멘토링 세션 개설, 스터디원 모집, 피드백 관리를 하나의 웹 플랫폼 안에서 원스톱으로 처리할 수 있도록 돕습니다. |

---

### 🛠 2. 사용 기술 (Tech Stack)

#### Backend & Real-Time Protocol
<p>
  <img src="https://img.shields.io/badge/Java_17-007396?style=flat-square&logo=openjdk&logoColor=white"/>
  <img src="https://img.shields.io/badge/Spring_Boot_3.x-6DB33F?style=flat-square&logo=springboot&logoColor=white"/>
  <img src="https://img.shields.io/badge/Spring_Security-6DB33F?style=flat-square&logo=springsecurity&logoColor=white"/>
  <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white"/>
  <img src="https://img.shields.io/badge/WebSocket-010101?style=flat-square&logo=socketdotio&logoColor=white"/>
</p>

#### Database & Persistence
<p>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Spring_Data_JPA-59666C?style=flat-square&logo=hibernate&logoColor=white"/>
</p>

#### Frontend & Media
<p>
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/JavaScript_ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white"/>
  <img src="https://img.shields.io/badge/HTML5/CSS3-E34F26?style=flat-square&logo=html5&logoColor=white"/>
</p>

#### DevOps & Tools
<p>
  <img src="https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white"/>
  <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/AWS_EC2-FF9900?style=flat-square&logo=amazonec2&logoColor=white"/>
</p>

---

### ⏱ 3. 제작 기간 (총 5주 Sprint)

| 주차 | 단계 | 주요 작업 내용 |
| :---: | :--- | :--- |
| **1주차** | **요구사항 정의 및 도메인 모델링** | 스터디/멘토링 흐름 설계, PostgreSQL 스키마 및 연관 관계 ERD 작성 |
| **2주차** | **인증 및 기본 비즈니스 구축** | JWT & Spring Security 무상태 인증 체계 구축, 사용자/스터디 룸 CRUD 개발 |
| **3주차** | **실시간 통신 & 스트리밍 파이프라인** | WebSocket/STOMP 프로토콜 연동, 실시간 채팅 및 미디어 스트리밍 처리 구현 |
| **4주차** | **프론트엔드 연동 & 캘린더 통합** | React 멘토링 인터페이스 구현, 캘린더 일정 예약 및 실시간 상태 동기화 처리 |
| **5주차** | **동시성 검증 및 배포** | 멘토링 예약 중복 방지 트랜잭션 검증, Docker 빌드, AWS EC2 배포 및 최적화 |

---

### 🚀 4. 핵심 기술 구현 사항

- **WebSocket 기반 실시간 양방향 채팅 및 메시징 시스템**
  - 클라이언트-서버 간 연결 오버헤드를 최소화하고 지연 없는 실시간 1:1 및 그룹 멘토링 채팅 환경 구현
  - 세션 연결/해제 라이프사이클을 추적하여 실시간 참여자 목록 동기화 처리
- **미디어 스트리밍 환경 연동**
  - 비대면 멘토링 세션을 위한 실시간 미디어 스트리밍 연동 인터페이스 구현 및 버퍼링 최소화
  - 스트리밍 세션 생성, 입장 토큰 검증, 세션 종료 시 리소스 자동 회수 로직 적용
- **캘린더 연동 기반 멘토링 일정 예약 및 정합성 보장**
  - 멘토의 가능 시간대와 멘티의 요청을 캘린더 인터페이스를 통해 직관적으로 매핑
  - 동일 시간대 중복 예약 방지를 위한 트랜잭션 격리 및 예약 확정 상태머신 관리
- **PostgreSQL & JPA 데이터 계층 최적화**
  - 멘토링 매칭 이력, 채팅 로그, 피드백 등 대용량 누적 데이터 조회를 고려한 인덱스 설계 및 N+1 방지 Fetch Join 적용

---

### 📱 5. 주요 화면 시각 자료

| 실시간 스트리밍 & 멘토링 세션 | 실시간 양방향 채팅 |
| :---: | :---: |
| <img width="945" height="511" alt="image" src="https://github.com/user-attachments/assets/66cf02ab-ddf9-44f5-a76f-c6e9175e9b91" />
| <img width="1600" height="900" alt="image" src="https://github.com/user-attachments/assets/54dcf0ed-f2e8-4225-aba3-60b91ca0b85d" />
| <img width="885" height="511" alt="image" src="https://github.com/user-attachments/assets/170e6cec-66eb-4643-a6f4-2065f9f434e7" />
