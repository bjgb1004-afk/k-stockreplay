import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// Vercel Cron 자동 발행 시스템 (Next.js API Route)
// 파일 경로: app/api/cron/auto-writer/route.ts
// 작동 주기: 매일 12시, 15시, 20시 (KST) 순차적 무인 칼럼 작성 및 배포
// ==========================================

// 1. 환경 변수 검증 및 라이브러리 초기화
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function GET(request: Request) {
  // 보안 검증 (Vercel Cron 헤더 또는 API Secret Key 검증)
  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase credentials are missing.' }, { status: 500 });
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Gemini API Key is missing.' }, { status: 500 });
  }

  // Supabase 클라이언트 생성 (서버 권한용)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  try {
    let targetPost: any = null;
    let useFallback = false;

    // [단계 1] is_published 가 false인 행 중 id가 가장 낮은 행 1개 조회
    const { data: maybeTargetPost, error: selectError } = await supabase
      .from('posts')
      .select('id, title')
      .eq('is_published', false)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      const errMsg = selectError.message || '';
      if (
        errMsg.includes('relation') ||
        errMsg.includes('posts') ||
        errMsg.includes('schema cache') ||
        errMsg.includes('does not exist')
      ) {
        console.warn('[Auto-Writer] posts table not found in Supabase. Switching to kstock_platform_data fallback...');
        useFallback = true;
      } else {
        throw new Error(`Supabase 조회 실패: ${selectError.message}`);
      }
    } else {
      targetPost = maybeTargetPost;
    }

    // 만약 21번까지 모두 발행 완료되어 조회할 대상이 없는 경우 (안전장치 발동)
    if (!useFallback && !targetPost) {
      console.log('★ 모든 칼럼이 발행 완료되었습니다. 테이블 상태를 초기화하고 1번부터 재시작합니다.');
      
      const { error: resetError } = await supabase
        .from('posts')
        .update({
          content: null,
          is_published: false,
          published_at: null
        })
        .neq('id', 0); // 모든 행 업데이트

      if (resetError) {
        throw new Error(`Supabase 상태 초기화 실패: ${resetError.message}`);
      }

      // 초기화 후 다시 1번 행 조회
      const { data: restartedPost, error: reselectError } = await supabase
        .from('posts')
        .select('id, title')
        .eq('is_published', false)
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (reselectError || !restartedPost) {
        throw new Error(`초기화 후 재조회 실패: ${reselectError?.message || '데이터 없음'}`);
      }

      targetPost = restartedPost;
    }

    const allTopics = [
      "한국 증시 주도주 패턴 분석 및 매매 기법",
      "거래량 터진 장대양봉의 숨겨진 의미와 타점",
      "세력 매집 패턴과 이평선 정배열 초기 공략법",
      "외국인 및 기관 수급 연속성과 주가 상승의 상관관계",
      "단기 급등주 눌림목 매매 공식",
      "박스권 돌파 매매의 핵심 지표 분석",
      "금리 인하기, 한국 증시 수혜 섹터 해부",
      "반도체 슈퍼 사이클과 소부장 대장주 발굴법",
      "바이오/제약 랠리의 신호탄, 임상 모멘텀 분석",
      "이차전지 섹터 바닥 탈출 시그널 확인법",
      "환율 1300원 시대, 수출 주도주의 기회",
      "시가총액 상위주 흐름으로 보는 코스피 방향성",
      "급락장 속 살아남는 방어주와 헷지 전략",
      "상한가 다음날 갭상승 종목의 단타 매매 전략",
      "볼린저 밴드와 RSI를 활용한 스윙 투자 완벽 가이드",
      "배당 수익률과 가치투자의 정석",
      "신재생 에너지 정책 수혜주 분석",
      "AI 인공지능 시대, 국내 소프트웨어 기업 전망",
      "엔터/콘텐츠 K-컬처 수출 확대에 따른 밸류에이션 재평가",
      "장중 프로그램 매수세가 암시하는 스윙 타점",
      "텐배거(10루타) 종목의 재무적, 기술적 공통점"
    ];

    let fallbackPostsList: any[] = [];
    let fallbackTargetId = 1;
    let fallbackTargetTitle = "";

    if (useFallback) {
      // kstock_platform_data에서 posts_list 키로 데이터 조회
      const { data: dbRecord, error: dbError } = await supabase
        .from('kstock_platform_data')
        .select('data')
        .eq('key', 'posts_list')
        .maybeSingle();

      if (!dbError && dbRecord && Array.isArray(dbRecord.data)) {
        fallbackPostsList = dbRecord.data;
      }

      for (let i = 1; i <= 21; i++) {
        const autoId = `auto-${i}`;
        if (!fallbackPostsList.some((p: any) => p.id === autoId)) {
          fallbackTargetId = i;
          fallbackTargetTitle = allTopics[i - 1];
          break;
        }
      }

      if (fallbackTargetTitle === "") {
        console.log('[Fallback] 모든 칼럼이 발행 완료되었습니다. 상태를 초기화하고 1번부터 재시작합니다.');
        fallbackPostsList = fallbackPostsList.filter((p: any) => !p.id.toString().startsWith('auto-'));
        fallbackTargetId = 1;
        fallbackTargetTitle = allTopics[0];
      }

      console.log(`[Fallback] 대상 칼럼 선정 -> ID: auto-${fallbackTargetId} | 제목: ${fallbackTargetTitle}`);
    }

    const finalId = useFallback ? `auto-${fallbackTargetId}` : targetPost.id;
    const finalTitle = useFallback ? fallbackTargetTitle : targetPost.title;

    // [기존 2단계 코드 수정] 
    const rawAi = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Proxy the generateContent method to handle RESOURCE_EXHAUSTED (429) quota errors elegantly
    const originalGenerateContent = rawAi.models.generateContent.bind(rawAi.models);
    rawAi.models.generateContent = async function(params: any, ...args: any[]) {
      try {
        return await originalGenerateContent(params, ...args);
      } catch (err: any) {
        const errStr = JSON.stringify(err);
        const isQuotaExceeded = errStr.includes('RESOURCE_EXHAUSTED') || 
                                errStr.includes('429') || 
                                errStr.includes('quota') || 
                                (err.message && (
                                  err.message.includes('429') || 
                                  err.message.toLowerCase().includes('quota') || 
                                  err.message.toLowerCase().includes('resource_exhausted')
                                ));
        
        if (isQuotaExceeded && params && params.model === 'gemini-3.5-flash') {
          console.warn(`[Gemini SDK Fallback] 'gemini-3.5-flash' quota exceeded or rate limited. Falling back to 'gemini-3.1-flash-lite'...`);
          const fallbackParams = { ...params, model: 'gemini-3.1-flash-lite' };
          try {
            return await originalGenerateContent(fallbackParams, ...args);
          } catch (fallbackErr: any) {
            console.error(`[Gemini SDK Fallback] Fallback to 'gemini-3.1-flash-lite' also failed:`, fallbackErr.message || fallbackErr);
            throw fallbackErr;
          }
        }
        throw err;
      }
    } as any;
    const ai = rawAi;

    // 시스템 지침을 훨씬 더 구체적이고 엄격하게 변경
    const systemInstruction = 
      "너는 대한민국 최상위 증권사의 수석 이코노미스트이자 주식 전문 수석 에디터다. " +
      "가벼운 블로그 글이 아니라, 기관 투자자들이 유료로 구독하는 '심층 마켓 리포트' 수준으로 작성하라. " +
      "인사말이나 AI 특유의 상투적인 서두는 절대 금지하며, 첫 문장부터 날카로운 통찰로 본론을 개시하라. " +
      "문체는 철저하게 단호하고 전문적인 리포트 어조(~다, ~임에 틀림없다, 분석된다)를 유지하라. " +
      "구글 애드센스 수익화를 위해 각 섹션을 매우 세부적으로 쪼개어 공백 제외 최소 2,500자 이상의 압도적인 분량으로 서술하라. " +
      "마크다운(#, **)은 금지하며 HTML 태그(<h2>, <h3>, <p>, <strong>)만 사용하라. " +
      "글의 흐름이 끊기지 않는 위치에 `<!-- 애드센스 자동 광고 삽입 위치 -->` 주석을 정확히 3번 분산하여 삽입하라.";

    const prompt = `[분석 요청 주제]: "${finalTitle}" (시리즈 번호: ${useFallback ? fallbackTargetId : finalId}/21)

위 주제에 대해 개인 투자자들이 눈이 번쩍 뜨일 만한 실전 투자용 칼럼을 작성하라. 
형식적인 개념 설명을 넘어, 다음 4가지 핵심 요소를 본론에 반드시 포함하여 글을 길고 풍부하게 전개하라:
1. 해당 개념/섹터가 현재 한국 증시 주도주 흐름에 미치는 구체적인 영향력 분석
2. 실전 차트 복기 시 거래량, 이평선, 지지/저항을 결합하여 매수 타점을 잡는 명확한 공식 및 팁
3. 거시경제(금리, 환율, 유가 등) 및 글로벌 공급망과의 긴밀한 상관관계 설명
4. 관련된 한국 증시 대표 종목(대장주 및 수혜주)들의 실명과 그들의 핵심 모멘텀 기술

각 문단은 정보의 밀도가 매우 높아야 하며, 뻔한 소리는 배제하고 철저히 데이터와 논리에 기반하여 전개하라.`;

    const response = await ai.models.generateContent({
      // ★ 중요: 모델을 최신 호환성 및 최고 성능의 gemini-3.5-flash로 지정
      model: 'gemini-3.5-flash', 
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.65, // 너무 튀지 않으면서 논리적인 글을 쓰기 위한 최적의 온도
        // ★ 중요: AI가 글을 쓰다 중간에 끊지 못하도록 출력 토큰 한도를 최대로 확장
        maxOutputTokens: 8192, 
      }
    });

    const generatedHtml = response.text;

    if (!generatedHtml || generatedHtml.trim().length === 0) {
      throw new Error('Gemini 콘텐츠 생성 실패: 빈 텍스트 반환');
    }

    if (useFallback) {
      const newPost = {
        id: `auto-${fallbackTargetId}`,
        title: fallbackTargetTitle,
        content: generatedHtml,
        category: 'blog',
        author: 'AI 마켓 리서치',
        tags: ['마켓 리포트', '주도주 분석', '실전 매매'],
        slug: `auto-report-${fallbackTargetId}`,
        createdAt: new Date().toISOString(),
        published_at: new Date().toISOString(),
        views: 0
      };

      fallbackPostsList.unshift(newPost);

      const { error: upsertError } = await supabase
        .from('kstock_platform_data')
        .upsert({
          key: 'posts_list',
          data: fallbackPostsList,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (upsertError) {
        throw new Error(`Fallback kstock_platform_data 저장 실패: ${upsertError.message}`);
      }

      // [단계 4] 성공 결과 반환
      return NextResponse.json({
        success: true,
        message: `성공적으로 auto-${fallbackTargetId}번 칼럼이 발행되었습니다. (kstock_platform_data Fallback)`,
        data: {
          id: `auto-${fallbackTargetId}`,
          title: fallbackTargetTitle,
          publishedAt: newPost.published_at,
          contentLength: generatedHtml.length
        }
      });
    } else {
      // [단계 3] 생성된 본문을 Supabase에 업데이트 및 발행 처리
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          content: generatedHtml,
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', finalId);

      if (updateError) {
        throw new Error(`Supabase 업데이트 실패: ${updateError.message}`);
      }

      // [단계 4] 성공 결과 반환
      return NextResponse.json({
        success: true,
        message: `성공적으로 ${finalId}번 칼럼이 발행되었습니다.`,
        data: {
          id: finalId,
          title: finalTitle,
          publishedAt: new Date().toISOString(),
          contentLength: generatedHtml.length
        }
      });
    }

  } catch (error: any) {
    console.error('[Auto-Writer Exception]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown Server Error'
      },
      { status: 500 }
    );
  }
}
