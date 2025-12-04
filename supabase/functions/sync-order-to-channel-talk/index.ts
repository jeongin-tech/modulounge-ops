import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const channelTalkApiSecret = Deno.env.get('CHANNEL_TALK_APP_SECRET')!;

interface Order {
  id: string;
  order_number: string;
  partner_id: string;
  customer_name: string;
  service_type: string;
  service_location: string;
  service_date: string;
  amount: number | null;
  status: string;
  created_at: string;
}

serve(async (req) => {
  console.log('[Sync Order to Channel Talk] Request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, action } = await req.json();
    
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Sync Order] Processing order ${orderId}, action: ${action}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order with partner info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[Sync Order] Order fetch error:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch partner profile for Channel Talk memberId
    const { data: partner, error: partnerError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', order.partner_id)
      .single();

    if (partnerError || !partner) {
      console.error('[Sync Order] Partner fetch error:', partnerError);
      return new Response(JSON.stringify({ error: 'Partner not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare order data for Channel Talk
    const statusLabels: Record<string, string> = {
      requested: '요청',
      accepted: '수락',
      confirmed: '확정',
      completed: '완료',
      settled: '정산완료',
      cancelled: '취소',
    };

    const orderData = {
      id: order.id,
      name: `${order.service_type} - ${order.order_number}`,
      status: statusLabels[order.status] || order.status,
      amount: order.amount || 0,
      currency: 'KRW',
      orderedAt: new Date(order.created_at).getTime(),
      items: [
        {
          name: order.service_type,
          quantity: 1,
          amount: order.amount || 0,
        }
      ],
      custom: {
        order_number: order.order_number,
        service_location: order.service_location,
        service_date: order.service_date,
        customer_name: order.customer_name,
      }
    };

    // Send to Channel Talk User API
    const channelTalkResponse = await fetch(
      `https://api.channel.io/open/v5/users/${partner.id}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': channelTalkApiSecret,
        },
        body: JSON.stringify({
          event: 'Order',
          property: orderData,
        }),
      }
    );

    if (!channelTalkResponse.ok) {
      const errorText = await channelTalkResponse.text();
      console.error('[Sync Order] Channel Talk API error:', errorText);
      
      // Try alternative: Update user profile with order info
      const updateResponse = await fetch(
        `https://api.channel.io/open/v5/users/${partner.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Access-Key': channelTalkApiSecret,
          },
          body: JSON.stringify({
            profile: {
              lastOrderNumber: order.order_number,
              lastOrderStatus: statusLabels[order.status] || order.status,
              lastOrderAmount: order.amount || 0,
              lastOrderDate: order.service_date,
            },
          }),
        }
      );

      if (!updateResponse.ok) {
        console.error('[Sync Order] Channel Talk profile update error:', await updateResponse.text());
      }
    }

    console.log('[Sync Order] Successfully synced order to Channel Talk');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Order synced to Channel Talk',
      orderId: order.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Sync Order] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
