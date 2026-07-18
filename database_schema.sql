CREATE TABLE daily_market_briefing (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    market_summary JSONB,
    macro_analysis JSONB,
    sector_analysis JSONB,
    major_flow JSONB,
    future_outlook JSONB,
    ai_full_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 인덱스 생성 (날짜별 조회 속도 향상)
CREATE INDEX idx_daily_market_briefing_date ON daily_market_briefing(date);
