import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SummaryData {
  chatId: string;
  customerInfo?: string;
  eventDate?: string;
  location?: string;
  inquiryContent?: string;
  coordinationFeasibility?: string;
  staffHandling?: string;
  customerTendency?: string;
  upselling?: string;
  recommendedScript?: string;
  keywords?: string;
  rawMessage?: string;
}

// 요약봇 메시지 파싱 함수
function parseSummaryMessage(message: string): Partial<SummaryData> {
  const result: Partial<SummaryData> = {
    rawMessage: message,
  };

  // 각 필드 파싱
  const patterns: { key: keyof SummaryData; pattern: RegExp }[] = [
    { key: "customerInfo", pattern: /고객정보:\s*(.+?)(?=\n|$)/i },
    { key: "eventDate", pattern: /행사일정:\s*(.+?)(?=\n|$)/i },
    { key: "location", pattern: /지점명:\s*(.+?)(?=\n|$)/i },
    { key: "inquiryContent", pattern: /문의의 내용:\s*(.+?)(?=\n|$)/i },
    { key: "coordinationFeasibility", pattern: /조율 및 가능성:\s*(.+?)(?=\n|$)/i },
    { key: "staffHandling", pattern: /상담원 처리 흐름:\s*(.+?)(?=\n|$)/i },
    { key: "customerTendency", pattern: /고객 성향:\s*(.+?)(?=\n|$)/i },
    { key: "upselling", pattern: /업세일링\/추가 기회:\s*(.+?)(?=\n|$)/i },
    { key: "recommendedScript", pattern: /추천 스크립트:\s*(.+?)(?=\n|$)/i },
    { key: "keywords", pattern: /키워드:\s*(.+?)(?=\n|$)/i },
  ];

  for (const { key, pattern } of patterns) {
    const match = message.match(pattern);
    if (match) {
      result[key] = match[1].trim();
    }
  }

  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Received webhook:", JSON.stringify(body, null, 2));

    // 채널톡 웹훅 페이로드에서 메시지 추출
    // 채널톡 웹훅 구조에 따라 조정 필요
    const { chatId, message, entity } = body;

    // 다양한 웹훅 형식 지원
    let summaryMessage = message || body.plainText || body.content;
    let chatIdValue = chatId || body.chat?.id || entity?.id || "unknown";

    // 봇 메시지인지 확인 (요약봇)
    const isSummaryBot = body.sender?.name === "요약봇" || 
                         body.personType === "bot" ||
                         (summaryMessage && summaryMessage.includes("고객정보:"));

    if (!summaryMessage) {
      console.log("No message content found in webhook");
      return new Response(
        JSON.stringify({ success: true, message: "No message to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 요약 메시지 파싱
    const parsedData = parseSummaryMessage(summaryMessage);

    // 데이터베이스에 저장
    const { data, error } = await supabase
      .from("channel_talk_summaries")
      .insert({
        chat_id: chatIdValue,
        customer_info: parsedData.customerInfo,
        event_date: parsedData.eventDate,
        location: parsedData.location,
        inquiry_content: parsedData.inquiryContent,
        coordination_feasibility: parsedData.coordinationFeasibility,
        staff_handling: parsedData.staffHandling,
        customer_tendency: parsedData.customerTendency,
        upselling: parsedData.upselling,
        recommended_script: parsedData.recommendedScript,
        keywords: parsedData.keywords,
        raw_message: parsedData.rawMessage,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving summary:", error);
      throw error;
    }

    console.log("Summary saved successfully:", data.id);

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});