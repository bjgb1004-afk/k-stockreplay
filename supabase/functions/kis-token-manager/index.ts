// Supabase Edge Function: kis-token-manager
// Location: /supabase/functions/kis-token-manager/index.ts
// Description: 매일 오후 3시 40분(KST)에 호출되어 한국투자증권(KIS)의 24시간 유효 토큰을 갱신/저장합니다.
//              기존에 1회 발급받은 유효한 토큰이 있을 경우, 중복 호출하지 않고 기존 토큰을 반환하여
//              하루에 토큰 발급 알림 문자가 단 1회만 오도록 강력하게 방어합니다.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

// 한국투자증권 API 호스트 설정 (실전투자: https://openapi.koreainvestment.com, 모의투자: https://openapivts.koreainvestment.com:29443)
const KIS_API_HOST = Deno.env.get("KIS_API_HOST") || "https://openapi.koreainvestment.com";
const KIS_APP_KEY = Deno.env.get("KIS_APP_KEY") || "";
const KIS_APP_SECRET = Deno.env.get("KIS_APP_SECRET") || "";

// Supabase DB 연동을 위한 환경 변수 (Edge Function 내부에서 자동 주입됨)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS OPTIONS 사전 통신 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[KIS Token Manager] 토큰 유효성 검사 시작...");

    // 1. Supabase 테이블에서 현재 만료되지 않은 유효한 토큰 검색
    const nowISO = new Date().toISOString();
    
    const { data: existingToken, error: dbError } = await supabase
      .from("kis_tokens")
      .select("*")
      .gt("expires_at", nowISO)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError) {
      console.warn("[KIS Token Manager] DB 조회 중 오류 발생 (무시하고 계속 진행):", dbError.message);
    }

    // 2. 만약 기존 유효 토큰이 존재한다면 그대로 재사용하여 불필요한 KIS API 호출(문자 발송) 차단!
    if (existingToken) {
      console.log(`[KIS Token Manager] 기존의 유효한 토큰 발견! 만료 예정시각: ${existingToken.expires_at}`);
      console.log("[KIS Token Manager] KIS API를 추가 호출하지 않고 기존 토큰을 재사용하여 문자가 추가 발송되지 않도록 방어했습니다.");
      
      return new Response(
        JSON.stringify({
          success: true,
          source: "DB_CACHE",
          token: existingToken.access_token,
          expires_at: existingToken.expires_at,
          message: "Existing valid token reused. No new SMS sent."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log("[KIS Token Manager] 유효한 기존 토큰이 없거나 만료되었습니다. 한국투자증권 API에 새 토큰을 요청합니다.");

    if (!KIS_APP_KEY || !KIS_APP_SECRET) {
      throw new Error("KIS_APP_KEY 또는 KIS_APP_SECRET 환경변수가 설정되지 않았습니다.");
    }

    // 3. 한국투자증권 OAuth2 토큰 발급 API 호출
    const kisResponse = await fetch(`${KIS_API_HOST}/oauth2/tokenP`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey: KIS_APP_KEY,
        appsecret: KIS_APP_SECRET
      })
    });

    if (!kisResponse.ok) {
      const errorText = await kisResponse.text();
      throw new Error(`KIS API 토큰 요청 실패: ${errorText}`);
    }

    const kisData = await kisResponse.json();
    const newAccessToken = kisData.access_token;
    
    // expires_in(초) 정보가 있으면 계산하고, 없으면 안전하게 23시간(82800초)으로 세팅하여 조기 갱신 유도
    const expiresInSeconds = kisData.expires_in || 82800; 
    const expiresAtDate = new Date(Date.now() + expiresInSeconds * 1000);
    const expiresAtISO = expiresAtDate.toISOString();

    console.log(`[KIS Token Manager] 새 토큰 발급 성공. 만료 예정시각: ${expiresAtISO}`);

    // 4. 새로 발급받은 토큰 정보를 Supabase 테이블에 안전하게 저장 (upsert 또는 insert)
    const { error: insertError } = await supabase
      .from("kis_tokens")
      .insert([
        {
          access_token: newAccessToken,
          expires_at: expiresAtISO,
          created_at: nowISO
        }
      ]);

    if (insertError) {
      console.error("[KIS Token Manager] 새 토큰 DB 저장 실패:", insertError.message);
      // DB 저장에 실패했더라도 사용자 흐름 유지를 위해 발급받은 토큰을 우선 응답합니다.
    } else {
      console.log("[KIS Token Manager] 새 토큰이 Supabase 'kis_tokens' 테이블에 정상 기록되었습니다.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: "KIS_API_NEW",
        token: newAccessToken,
        expires_at: expiresAtISO,
        message: "New token issued and saved. 1 SMS sent."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err: any) {
    console.error("[KIS Token Manager] 치명적인 처리 오류:", err.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
