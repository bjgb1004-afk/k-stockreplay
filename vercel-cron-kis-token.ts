/**
 * K-Stock Replay: 한국투자증권(KIS) 24시간 토큰 매니저 및 1일 1회 제어 가이드
 * 
 * 이 파일은 Vercel Cron Job 또는 Supabase Edge Function을 이용해
 * KIS Access Token을 하루에 딱 "단 한 번(오후 3시 40분)"만 갱신하여 
 * 토큰 발급 완료 문자가 여러 개 오는 불편을 근본적으로 차단하는 통합 패키지 가이드입니다.
 */

// ==========================================
// [1단계] Supabase Database 테이블 생성 SQL
// ==========================================
/*
-- Supabase 대시보드의 SQL Editor에 아래 쿼리를 입력해 실행하십시오.
-- 만료된 토큰을 보관 및 유효한 최신 토큰을 캐싱하는 테이블입니다.

CREATE TABLE IF NOT EXISTS public.kis_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    access_token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스 생성으로 만료 시간 조회 성능 최적화
CREATE INDEX IF NOT EXISTS idx_kis_tokens_expires_at ON public.kis_tokens (expires_at DESC);

-- RLS (Row Level Security) 설정 및 서비스 롤 접근성 허용
ALTER TABLE public.kis_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow Service Role Only" ON public.kis_tokens
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
*/


// ==========================================================
// [2단계] Next.js API Route (Vercel Cron Job 전용 TypeScript 코드)
// ==========================================================
// 파일 위치 예시: /app/api/cron/kis-token-refresh/route.ts
// (Next.js App Router v13+ 또는 v14+ 기준)

/*
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 환경변수 검증
const KIS_API_HOST = process.env.KIS_API_HOST || "https://openapi.koreainvestment.com";
const KIS_APP_KEY = process.env.KIS_APP_KEY;
const KIS_APP_SECRET = process.env.KIS_APP_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: Request) {
  // 1. Vercel Cron 인가 보안 확인 (선택 사항)
  // Vercel Cron Job 실행 시 헤더에 CRON_SECRET을 담아 위조 호출을 차단합니다.
  const authHeader = request.headers.get("Authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase credentials are missing" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const nowISO = new Date().toISOString();

    // 2. 만료되지 않은 기존 KIS 토큰 조회
    const { data: existingToken, error: dbError } = await supabase
      .from("kis_tokens")
      .select("*")
      .gt("expires_at", nowISO)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError) {
      console.warn("DB Query Warning:", dbError.message);
    }

    // 3. 유효 토큰이 이미 존재하면 KIS 연동 요청을 생략하여 문자 오발송을 완벽히 방지!
    if (existingToken) {
      return NextResponse.json({
        success: true,
        source: "DATABASE_CACHE",
        token: existingToken.access_token,
        expires_at: existingToken.expires_at,
        message: "Existing active token reused. SMS trigger avoided successfully."
      });
    }

    // 4. 신규 토큰 발급 요청
    if (!KIS_APP_KEY || !KIS_APP_SECRET) {
      return NextResponse.json({ error: "KIS App Credentials are missing in env" }, { status: 500 });
    }

    const kisRes = await fetch(`${KIS_API_HOST}/oauth2/tokenP`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey: KIS_APP_KEY,
        appsecret: KIS_APP_SECRET,
      }),
    });

    if (!kisRes.ok) {
      const errText = await kisRes.text();
      return NextResponse.json({ error: `KIS OAuth request failed: ${errText}` }, { status: 500 });
    }

    const kisData = await kisRes.json();
    const newAccessToken = kisData.access_token;
    
    // KIS 토큰은 발급 시점으로부터 24시간 유효합니다. 안전하게 23시간을 저장 기간으로 둡니다.
    const expiresInSeconds = kisData.expires_in || 82800;
    const expiresAtISO = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    // 5. 새 토큰 정보를 Supabase에 보관
    await supabase.from("kis_tokens").insert([
      {
        access_token: newAccessToken,
        expires_at: expiresAtISO,
        created_at: nowISO,
      }
    ]);

    return NextResponse.json({
      success: true,
      source: "KIS_API_ISSUED",
      token: newAccessToken,
      expires_at: expiresAtISO,
      message: "New KIS Access Token generated and saved to Supabase."
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
*/


// ==========================================
// [3단계] vercel.json 크론탭 스케줄링 설정법
// ==========================================
/*
-- Next.js 프로젝트 루트 디렉토리에 vercel.json 파일을 만들고 다음과 같이 크론 일정을 입력하십시오.
-- KST(한국 표준시) 오후 3시 40분은 UTC(세계 표준시) 오전 6시 40분과 동일합니다.

{
  "crons": [
    {
      "path": "/api/cron/kis-token-refresh",
      "schedule": "40 6 * * *"
    }
  ]
}
*/

console.log("KIS Token Manager Guide and Source loaded successfully.");
