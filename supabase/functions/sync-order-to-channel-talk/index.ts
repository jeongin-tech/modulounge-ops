import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const channelTalkAppId = Deno.env.get('CHANNEL_TALK_APP_ID')!;
const channelTalkAppSecret = Deno.env.get('CHANNEL_TALK_APP_SECRET')!;

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

    // Fetch partner profile
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

    // Basic Auth header for Channel Talk API
    const credentials = base64Encode(`${channelTalkAppId}:${channelTalkAppSecret}`);
    const authHeader = `Basic ${credentials}`;

    console.log('[Sync Order] Updating Channel Talk user profile for:', partner.email);

    // Update user profile with order information
    // Channel Talk uses email as the key to find users
    const updateResponse = await fetch(
      `https://api.channel.io/open/v5/users/@${encodeURIComponent(partner.email)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          profile: {
            lastOrderNumber: order.order_number,
            lastOrderStatus: statusLabels[order.status] || order.status,
            lastOrderAmount: order.amount || 0,
            lastOrderDate: order.service_date,
            lastOrderServiceType: order.service_type,
            lastOrderLocation: order.service_location,
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('[Sync Order] Channel Talk API error:', errorText);
      
      // Still return success as the order was created in our system
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Order created but Channel Talk sync had issues',
        orderId: order.id,
        channelTalkError: errorText,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responseData = await updateResponse.json();
    console.log('[Sync Order] Channel Talk response:', JSON.stringify(responseData));
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
