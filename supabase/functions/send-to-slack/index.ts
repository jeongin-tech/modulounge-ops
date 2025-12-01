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
    const { messageId } = await req.json();
    
    console.log('Processing message for Slack:', messageId);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get message details with sender info
    const { data: message, error: messageError } = await supabaseClient
      .from('messages')
      .select(`
        *,
        sender:sender_id(full_name, email, company_name, role),
        order:order_id(order_number, service_type, customer_name)
      `)
      .eq('id', messageId)
      .single();

    if (messageError) {
      console.error('Error fetching message:', messageError);
      throw messageError;
    }

    console.log('Message retrieved:', message);

    // Only send to Slack if sender is PARTNER
    if (message.sender?.role !== 'PARTNER') {
      console.log('Skipping Slack notification - sender is not a PARTNER');
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
    if (!slackWebhookUrl) {
      console.error('SLACK_WEBHOOK_URL not configured');
      throw new Error('Slack webhook URL not configured');
    }

    // Format message for Slack
    const senderName = message.sender?.company_name || message.sender?.full_name || 'Unknown';
    const senderEmail = message.sender?.email || 'No email';
    const orderInfo = message.order 
      ? `\n*주문번호:* ${message.order.order_number} | *서비스:* ${message.order.service_type} | *고객:* ${message.order.customer_name}`
      : '';

    const slackMessage = {
      text: `🔔 새로운 파트너 메시지`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🔔 파트너 메시지"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*보낸사람:*\n${senderName}`
            },
            {
              type: "mrkdwn",
              text: `*이메일:*\n${senderEmail}`
            }
          ]
        },
        ...(orderInfo ? [{
          type: "section",
          text: {
            type: "mrkdwn",
            text: orderInfo
          }
        }] : []),
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*메시지:*\n${message.message}`
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `메시지 ID: ${messageId} | 작성일: ${new Date(message.created_at).toLocaleString('ko-KR')}`
            }
          ]
        }
      ]
    };

    console.log('Sending to Slack:', slackWebhookUrl);

    const slackResponse = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      console.error('Slack API error:', errorText);
      throw new Error(`Slack API error: ${slackResponse.status} - ${errorText}`);
    }

    console.log('Successfully sent to Slack');

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-to-slack function:', error);
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
