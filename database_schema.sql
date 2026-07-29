-- K-STOCK REPLAY Database Schema

-- 1. Insight Topics Registry
CREATE TABLE IF NOT EXISTS public.insight_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_index INT UNIQUE NOT NULL,
    topic TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Insight Columns (Full Structure)
CREATE TABLE IF NOT EXISTS public.insight_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_date DATE,
    market_trade_date DATE,
    insight_type TEXT, -- MIDDAY, AFTERNOON, NIGHT
    topic_id UUID REFERENCES public.insight_topics(id),
    topic_index INT,
    topic TEXT,
    title TEXT,
    content TEXT,
    fact TEXT,
    insight TEXT,
    forecast TEXT,
    confidence DOUBLE PRECISION,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Blog Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'blog',
    author TEXT,
    tags TEXT,
    slug TEXT,
    views INT DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for posts
CREATE INDEX IF NOT EXISTS idx_posts_is_published ON public.posts(is_published);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);

-- Migration for existing insight_columns (Add missing columns safely)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='insight_columns' AND column_name='market_date') THEN
        ALTER TABLE public.insight_columns ADD COLUMN market_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='insight_columns' AND column_name='market_trade_date') THEN
        ALTER TABLE public.insight_columns ADD COLUMN market_trade_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='insight_columns' AND column_name='insight_type') THEN
        ALTER TABLE public.insight_columns ADD COLUMN insight_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='insight_columns' AND column_name='topic_id') THEN
        ALTER TABLE public.insight_columns ADD COLUMN topic_id UUID REFERENCES public.insight_topics(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='insight_columns' AND column_name='topic') THEN
        ALTER TABLE public.insight_columns ADD COLUMN topic TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='insight_columns' AND column_name='fact') THEN
        ALTER TABLE public.insight_columns ADD COLUMN fact TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='insight_columns' AND column_name='insight') THEN
        ALTER TABLE public.insight_columns ADD COLUMN insight TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='insight_columns' AND column_name='forecast') THEN
        ALTER TABLE public.insight_columns ADD COLUMN forecast TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='insight_columns' AND column_name='confidence') THEN
        ALTER TABLE public.insight_columns ADD COLUMN confidence DOUBLE PRECISION;
    END IF;
    
    -- Ensure UNIQUE constraint on (market_date, insight_type) to prevent duplicates and secure separate record creation
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='insight_columns' AND constraint_name='uq_insight_columns_date_type'
    ) THEN
        ALTER TABLE public.insight_columns ADD CONSTRAINT uq_insight_columns_date_type UNIQUE (market_date, insight_type);
    END IF;
END $$;
