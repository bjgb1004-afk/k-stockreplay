# K-STOCKREPLAY

"내 투자에 오늘 무슨 일이 생겼는가?"

관심종목의 공시·기업 이벤트·배당·투자 일정·테마·기업 관계를 매일 정리해서 보여주는 서비스입니다. 실시간 시세를 제공하지 않고, 매수/매도 추천을 하지 않습니다.

## 원칙

- 유지비 0원에 수렴 (Static JSON + CDN, 로컬 우선 저장, GitHub Actions 자동화)
- 사람이 매일 데이터를 입력하거나 글을 쓰지 않음 (rule-based 자동화, AI 미사용)
- 실시간 주가/체결 데이터를 핵심 데이터로 제공하지 않음
- 사용자 데이터(관심종목 등)는 서버가 아니라 브라우저(IndexedDB)에 저장

## 스택

- Vite + React + TypeScript
- Supabase (Web Push 구독 정보만 최소 저장)
- Vercel (정적 배포)

## 개발

```
npm install
npm run dev
```
