import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-access-token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();
  
  console.log(`[Channel Talk App] Request: ${req.method} ${url.pathname}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // WAM endpoint - serves the HTML page
    if (path === 'wam' || path === 'partner-info') {
      return serveWAM();
    }

    // API endpoint - fetch partner data
    if (path === 'api' && req.method === 'POST') {
      const body = await req.json();
      console.log('[Channel Talk App] API request body:', JSON.stringify(body));
      
      const { method, params } = body;
      
      if (method === 'getPartnerInfo') {
        return await handleGetPartnerInfo(params);
      }
    }

    // Function endpoint for Channel Talk Function calls
    if (req.method === 'PUT') {
      const body = await req.json();
      console.log('[Channel Talk App] Function request:', JSON.stringify(body));
      
      const { method, params, context } = body;
      
      if (method === 'getPartnerInfo') {
        // Extract user ID from Channel Talk context
        const userId = params?.userId || context?.caller?.id;
        return await handleGetPartnerInfo({ userId });
      }
      
      return new Response(JSON.stringify({ error: 'Unknown method' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (error: unknown) {
    console.error('[Channel Talk App] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleGetPartnerInfo(params: { userId?: string }) {
  const { userId } = params;
  
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('[Channel Talk App] Fetching partner info for userId:', userId);
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('[Channel Talk App] Profile fetch error:', profileError);
    return new Response(JSON.stringify({ error: 'Profile not found', details: profileError }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fetch recent orders (last 10)
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('partner_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (ordersError) {
    console.error('[Channel Talk App] Orders fetch error:', ordersError);
  }

  // Fetch settlements
  const { data: settlements, error: settlementsError } = await supabase
    .from('settlements')
    .select('*')
    .eq('partner_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (settlementsError) {
    console.error('[Channel Talk App] Settlements fetch error:', settlementsError);
  }

  // Calculate summary
  const totalOrders = orders?.length || 0;
  const completedOrders = orders?.filter(o => o.status === 'completed' || o.status === 'settled')?.length || 0;
  const pendingSettlements = settlements?.filter(s => s.status === 'pending')?.length || 0;
  const totalSettlementAmount = settlements?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

  const result = {
    profile,
    orders: orders || [],
    settlements: settlements || [],
    summary: {
      totalOrders,
      completedOrders,
      pendingSettlements,
      totalSettlementAmount,
    },
  };

  console.log('[Channel Talk App] Successfully fetched partner info');
  
  return new Response(JSON.stringify({ result }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function serveWAM() {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>제휴업체 정보</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8f9fa;
      padding: 16px;
      font-size: 14px;
      color: #333;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    .error {
      background: #fee;
      border: 1px solid #fcc;
      padding: 16px;
      border-radius: 8px;
      color: #c00;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .card-header {
      font-weight: 600;
      font-size: 13px;
      color: #666;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card-header::before {
      content: '';
      width: 4px;
      height: 16px;
      background: #6366f1;
      border-radius: 2px;
    }
    .profile-name {
      font-size: 20px;
      font-weight: 700;
      color: #111;
      margin-bottom: 4px;
    }
    .profile-company {
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .info-item {
      background: #f8f9fa;
      padding: 10px 12px;
      border-radius: 8px;
    }
    .info-label {
      font-size: 11px;
      color: #888;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 13px;
      font-weight: 500;
      color: #333;
      word-break: break-all;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-staff { background: #e0e7ff; color: #4f46e5; }
    .badge-partner { background: #dcfce7; color: #16a34a; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .summary-item {
      text-align: center;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .summary-value {
      font-size: 24px;
      font-weight: 700;
      color: #6366f1;
    }
    .summary-label {
      font-size: 11px;
      color: #666;
      margin-top: 2px;
    }
    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .order-item:last-child {
      border-bottom: none;
    }
    .order-info {
      flex: 1;
    }
    .order-number {
      font-weight: 600;
      font-size: 13px;
    }
    .order-date {
      font-size: 11px;
      color: #888;
    }
    .order-status {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .status-requested { background: #fef3c7; color: #d97706; }
    .status-accepted { background: #dbeafe; color: #2563eb; }
    .status-confirmed { background: #e0e7ff; color: #4f46e5; }
    .status-completed { background: #dcfce7; color: #16a34a; }
    .status-settled { background: #d1d5db; color: #374151; }
    .status-cancelled { background: #fee2e2; color: #dc2626; }
    .regions-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }
    .region-tag {
      background: #e0e7ff;
      color: #4f46e5;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
    }
    .empty-state {
      text-align: center;
      padding: 20px;
      color: #888;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="loading">제휴업체 정보를 불러오는 중...</div>
  </div>

  <script>
    const SUPABASE_URL = '${supabaseUrl}';
    
    async function init() {
      const app = document.getElementById('app');
      
      try {
        // Get WAM data from Channel Talk
        let userId = null;
        
        if (window.ChannelIOWam) {
          userId = window.ChannelIOWam.getWamData('memberId') || 
                   window.ChannelIOWam.getWamData('userId');
          console.log('Got userId from WAM:', userId);
        }
        
        // Also check URL params for testing
        const urlParams = new URLSearchParams(window.location.search);
        userId = userId || urlParams.get('userId');
        
        if (!userId) {
          app.innerHTML = '<div class="error">사용자 정보를 찾을 수 없습니다.</div>';
          return;
        }
        
        // Fetch partner info
        const response = await fetch(SUPABASE_URL + '/functions/v1/channel-talk-app/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'getPartnerInfo',
            params: { userId }
          })
        });
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        renderPartnerInfo(data.result);
      } catch (error) {
        console.error('Error:', error);
        app.innerHTML = '<div class="error">정보를 불러오는 중 오류가 발생했습니다: ' + error.message + '</div>';
      }
    }
    
    function renderPartnerInfo(data) {
      const { profile, orders, settlements, summary } = data;
      const app = document.getElementById('app');
      
      const statusLabels = {
        requested: '요청',
        accepted: '수락',
        confirmed: '확정',
        completed: '완료',
        settled: '정산완료',
        cancelled: '취소'
      };
      
      const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
      };
      
      const formatMoney = (amount) => {
        if (!amount) return '0원';
        return amount.toLocaleString() + '원';
      };
      
      const regions = Array.isArray(profile.service_regions) ? profile.service_regions : [];
      
      app.innerHTML = \`
        <!-- 기본 정보 -->
        <div class="card">
          <div class="profile-name">\${profile.full_name || '-'}</div>
          <div class="profile-company">
            \${profile.company_name || '-'}
            <span class="badge \${profile.role === 'STAFF' ? 'badge-staff' : 'badge-partner'}">\${profile.role}</span>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">이메일</div>
              <div class="info-value">\${profile.email || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">연락처</div>
              <div class="info-value">\${profile.phone || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">대표자명</div>
              <div class="info-value">\${profile.representative_name || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">사업자등록번호</div>
              <div class="info-value">\${profile.business_registration_number || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">서비스 유형</div>
              <div class="info-value">\${profile.service_type || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">수수료율</div>
              <div class="info-value">\${profile.commission_rate ? profile.commission_rate + '%' : '-'}</div>
            </div>
          </div>
          \${regions.length > 0 ? \`
            <div style="margin-top: 12px;">
              <div class="info-label">서비스 지역</div>
              <div class="regions-list">
                \${regions.map(r => '<span class="region-tag">' + r + '</span>').join('')}
              </div>
            </div>
          \` : ''}
        </div>
        
        <!-- 요약 -->
        <div class="card">
          <div class="card-header">거래 현황</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">\${summary.totalOrders}</div>
              <div class="summary-label">총 주문</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">\${summary.completedOrders}</div>
              <div class="summary-label">완료</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">\${summary.pendingSettlements}</div>
              <div class="summary-label">정산 대기</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">\${formatMoney(summary.totalSettlementAmount)}</div>
              <div class="summary-label">총 정산액</div>
            </div>
          </div>
        </div>
        
        <!-- 최근 주문 -->
        <div class="card">
          <div class="card-header">최근 주문</div>
          \${orders.length > 0 ? orders.slice(0, 5).map(order => \`
            <div class="order-item">
              <div class="order-info">
                <div class="order-number">\${order.order_number}</div>
                <div class="order-date">\${formatDate(order.service_date)} · \${order.service_type}</div>
              </div>
              <span class="order-status status-\${order.status}">\${statusLabels[order.status] || order.status}</span>
            </div>
          \`).join('') : '<div class="empty-state">주문 내역이 없습니다</div>'}
        </div>
        
        <!-- 최근 정산 -->
        <div class="card">
          <div class="card-header">최근 정산</div>
          \${settlements.length > 0 ? settlements.slice(0, 5).map(s => \`
            <div class="order-item">
              <div class="order-info">
                <div class="order-number">\${formatMoney(s.amount)}</div>
                <div class="order-date">지급예정: \${formatDate(s.payment_date)}</div>
              </div>
              <span class="order-status \${s.status === 'confirmed' ? 'status-completed' : 'status-requested'}">\${s.status === 'confirmed' ? '확정' : '대기'}</span>
            </div>
          \`).join('') : '<div class="empty-state">정산 내역이 없습니다</div>'}
        </div>
      \`;
      
      // Resize WAM if available
      if (window.ChannelIOWam && window.ChannelIOWam.setSize) {
        setTimeout(() => {
          const height = document.body.scrollHeight;
          window.ChannelIOWam.setSize({ width: 360, height: Math.min(height + 32, 600) });
        }, 100);
      }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
