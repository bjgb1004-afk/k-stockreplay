-- ==========================================
-- Supabase 'posts' 테이블 구성 SQL
-- 생성 목적: K-STOCK REPLAY 21개 주간 주식 칼럼 무인 자동 발행 시스템
-- ==========================================

-- 1. posts 테이블 생성
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT, -- Gemini가 생성한 HTML 본문이 저장될 곳 (nullable)
    is_published BOOLEAN DEFAULT false, -- 발행 여부 (기본값 false)
    published_at TIMESTAMPTZ, -- 발행된 시간 (nullable)
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_is_published ON posts(is_published);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);

-- 2. 1번부터 21번까지의 21개 칼럼 주제 일괄 삽입 (INSERT INTO)
INSERT INTO posts (id, title, is_published) VALUES
(1, 'K-STOCK REPLAY가 시장을 복기하는 이유에 대해서', false),
(2, '거래대금이 주가보다 먼저 움직이는 이유 (거래량 분석법)', false),
(3, '이평선 정배열과 역배열: 주도주가 시작되는 구간 포착하기', false),
(4, '양봉과 음봉 캔들의 비밀: 시가와 종가에 담긴 세력의 심리', false),
(5, '지지와 저항의 원리: 전고점 돌파 매매가 강력한 이유', false),
(6, '장 초반(09:00~10:00) 1시간 매매가 하루 수익을 결정하는 이유', false),
(7, '거래대금 상위 종목을 매일 복기해야 하는 이유', false),
(8, '차세대 반도체의 핵심, HBM(고대역폭 메모리) 개념과 핵심 밸류체인 총정리', false),
(9, '반도체 전공정과 후공정(OSAT) 차이점과 시장 주도주 흐름 이해하기', false),
(10, '바이오 섹터 투자 시 꼭 알아야 할 임상 1상·2상·3상 의미와 리스크', false),
(11, '비만치료제(GLP-1) 글로벌 트렌드와 한국 바이오 관련주 탑픽 분석', false),
(12, 'CXL(컴퓨팅 익스프레스 링크)이란 무엇인가? AI 반도체 새로운 패러다임', false),
(13, 'PCB(인쇄회로기판) 및 기판 관련주가 반도체 사이클에서 갖는 중요성', false),
(14, '주도 테마의 순환매 원리: 반도체에서 바이오로 돈이 이동하는 신호 읽기', false),
(15, '미국 연준(Fed)의 금리 결정이 한국 코스피·코스닥 시장에 미치는 영향', false),
(16, '환율 상승(원화 약세) 시기에 외국인 수급이 유입되는 수출 주도형 섹터 분석', false),
(17, '미국 국채 금리 급등기가 성장주(바이오·테마주)에 치명적인 이유', false),
(18, '유가(WTI) 및 원자재 가격 변동과 국내 증시 에너지·화학주 동향', false),
(19, '외국인과 기관의 ''양매수''가 들어오는 종목을 장 마감 후 체크해야 하는 이유', false),
(20, '고객예탁금과 신용융자 잔고로 보는 주식 시장의 과열 및 침체 신호', false),
(21, '미국 증시(나스닥·S&P500)의 야간 흐름이 다음 날 한국 증시 시가에 미치는 영향', false)
ON CONFLICT (id) DO NOTHING;
