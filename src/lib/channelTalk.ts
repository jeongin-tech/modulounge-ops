import { supabase } from "@/integrations/supabase/client";

/**
 * 주문 정보를 채널톡에 동기화합니다.
 * 주문 생성, 수정, 상태 변경 시 호출해야 합니다.
 */
export async function syncOrderToChannelTalk(
  orderId: string,
  action: 'created' | 'updated' | 'status_changed' = 'updated'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('sync-order-to-channel-talk', {
      body: { orderId, action },
    });

    if (error) {
      console.error('[syncOrderToChannelTalk] Error:', error);
      return { success: false, error: error.message };
    }

    console.log('[syncOrderToChannelTalk] Success:', data);
    return { success: true };
  } catch (err) {
    console.error('[syncOrderToChannelTalk] Exception:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}
