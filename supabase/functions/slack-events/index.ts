import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    console.log('Received Slack event:', JSON.stringify(body, null, 2));

    // Slack URL verification challenge
    if (body.type === 'url_verification') {
      console.log('URL verification challenge:', body.challenge);
      return new Response(
        JSON.stringify({ challenge: body.challenge }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Handle Slack events
    if (body.type === 'event_callback') {
      const event = body.event;
      
      console.log('Event type:', event.type);
      console.log('Event data:', JSON.stringify(event, null, 2));

      // Only process messages from users (not bots) in the configured channel
      if (event.type === 'message' && !event.bot_id && event.text) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Get the channel ID from the event
        const channelId = event.channel;
        console.log('Message from channel:', channelId);

        // Find which partner this channel belongs to
        const { data: partnerProfile, error: partnerError } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('slack_channel_id', channelId)
          .eq('role', 'PARTNER')
          .single();

        if (partnerError || !partnerProfile) {
          console.log('No partner found for channel:', channelId);
          return new Response(
            JSON.stringify({ success: true, skipped: true, reason: 'Channel not mapped to partner' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Message is for partner:', partnerProfile.id);

        // Get a STAFF user to use as sender
        const { data: staffUsers, error: staffError } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('role', 'STAFF')
          .limit(1);

        if (staffError || !staffUsers || staffUsers.length === 0) {
          console.error('No STAFF user found:', staffError);
          return new Response(
            JSON.stringify({ error: 'No STAFF user found' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }

        const staffUserId = staffUsers[0].id;

        // Extract order number from message if present (e.g., "주문 #ORD-001에 대한 답변...")
        let orderId = null;
        const orderMatch = event.text.match(/#([A-Z0-9-]+)/);
        if (orderMatch) {
          const orderNumber = orderMatch[1];
          const { data: orders } = await supabaseClient
            .from('orders')
            .select('id')
            .eq('order_number', orderNumber)
            .limit(1);
          
          if (orders && orders.length > 0) {
            orderId = orders[0].id;
          }
        }

        // Insert message from STAFF to specific partner
        const { error: insertError } = await supabaseClient
          .from('messages')
          .insert({
            sender_id: staffUserId,
            receiver_id: partnerProfile.id,
            message: event.text,
            order_id: orderId,
          });

        if (insertError) {
          console.error('Error inserting message:', insertError);
          throw insertError;
        }

        console.log('Message inserted successfully from Slack');
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in slack-events function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
