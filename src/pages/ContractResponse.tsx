import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Contract {
  location: string;
  reservation_date: string;
  checkin_time: string;
  checkout_time: string;
  guest_count: number;
  base_price: number;
  additional_price: number;
  cleaning_fee: number;
  vat: number;
  total_amount: number;
  purpose: string | null;
  customer_name: string | null;
  company_name: string | null;
  phone_number: string | null;
  tax_invoice_requested: boolean | null;
  visit_source: string | null;
}

const ContractResponse = () => {
  const { token } = useParams<{ token: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContract = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("access_token", token)
        .maybeSingle();

      if (error) {
        console.error("Error fetching contract:", error);
      } else {
        setContract(data);
      }
      setLoading(false);
    };

    fetchContract();
  }, [token]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'white', 
        padding: '40px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '18px'
      }}>
        로딩 중...
      </div>
    );
  }

  if (!contract) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'white', 
        padding: '40px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '18px',
        color: '#666'
      }}>
        계약서를 찾을 수 없습니다.
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "M월 d일 (EEEE)", { locale: ko });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    // timeString format: "HH:MM:SS"
    return timeString.slice(0, 5); // "HH:MM"
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'white', 
      padding: '40px',
      fontFamily: 'sans-serif',
      lineHeight: '1.8'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '40px' }}>
          ✅ 모드라운지 이용 계약서
        </h1>
        
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>■ 이용 안내</h2>
          <p style={{ fontSize: '15px', color: '#333' }}>
            ※ 모드라운지는 무인 운영되는 공간입니다.<br/>
            결제 후 발송되는 이용 안내문을 꼭 확인해 주시고, 사전 문의는 이용 전에 부탁드립니다.
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>■ 이용 유의사항</h2>
          <div style={{ fontSize: '15px', color: '#333', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '8px' }}>• 벽면에 테이프·접착제 부착 금지 (자국 발생 시 청소비 10만 원 이상 부과)</p>
            <p style={{ marginBottom: '8px' }}>• 토사물 발생 시 청소비 10만 원 부과</p>
            <p style={{ marginBottom: '8px' }}>• 전 구역 흡연 금지(전자담배 포함) — 위반 시 CCTV 확인 후 청소비 10만 원 이상 부과</p>
            <p style={{ marginBottom: '8px' }}>• 내부 기물 및 인테리어 소품 파손 시 수리비 또는 교체비 전액 청구</p>
            <p style={{ marginBottom: '8px' }}>• 기본 음향 서비스 제공</p>
            <p style={{ marginBottom: '8px' }}>• 기기 보호를 위해 음향 설정은 기본값으로 고정</p>
            <p style={{ marginBottom: '8px' }}>• 중요 행사 시 음향 렌탈 옵션 권장</p>
            <p style={{ marginBottom: '8px' }}>• 미성년자는 오후 7시 이후 대관 불가</p>
            <p style={{ marginBottom: '8px' }}>• 예약은 결제 완료 순으로 확정</p>
            <p style={{ marginBottom: '8px' }}>• 이용 후 남은 물품은 모두 폐기</p>
            <p style={{ marginBottom: '8px' }}>• 시간 추가(7만 원)는 종료 3시간 전까지 요청</p>
            <p style={{ marginBottom: '8px' }}>• 올나잇 타임은 오후 10시까지 예약 가능</p>
            <p style={{ marginBottom: '8px' }}>• 입·퇴실 시 CCTV 확인</p>
            <p style={{ marginBottom: '8px' }}>• 계약 인원 초과 시 즉시 추가요금 및 패널티 부과</p>
            <p style={{ marginBottom: '8px' }}>• 전 타임 예약이 있을 경우 사전 입실 불가</p>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>■ 환불 규정</h2>
          <div style={{ fontSize: '15px', color: '#333', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '8px' }}>• 인원 확정 후 인원 조정으로 인한 차액 환불 불가</p>
            <p style={{ marginBottom: '8px' }}>• 개인 사유(취소·변경 포함)도 동일 규정 적용</p>
            <p style={{ marginTop: '15px', marginBottom: '10px', fontWeight: 'bold' }}>환불 기준</p>
            <p style={{ marginBottom: '8px' }}>• 결제 완료 ~ 이용일 8일 전: 총 금액의 20% 공제 후 80% 환불</p>
            <p style={{ marginBottom: '8px' }}>• 이용일 7일 전 ~ 당일: 환불 불가</p>
            <p style={{ marginTop: '15px', marginBottom: '10px', fontWeight: 'bold' }}>날짜/지점 변경 규정</p>
            <p style={{ marginBottom: '8px' }}>• 이용일 8일 전까지 변경 가능</p>
            <p style={{ marginBottom: '8px' }}>• 총 금액의 20% 추가 납부 시 이월 가능</p>
            <p style={{ marginBottom: '8px' }}>• 지점 변경은 해당 일자에 타 지점 예약이 없을 경우만 가능</p>
            <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>※ 위 규정은 옵션 및 부가세 포함 전체 금액에 적용됩니다.</p>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>■ 예약 정보</h2>
          <div style={{ fontSize: '15px', color: '#333', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '8px' }}>1) 예약호실</p>
            <p style={{ marginBottom: '15px', paddingLeft: '20px' }}>{contract.location}</p>
            <p style={{ marginBottom: '8px' }}>2) 예약 날짜</p>
            <p style={{ marginBottom: '15px', paddingLeft: '20px' }}>{formatDate(contract.reservation_date)}</p>
            <p style={{ marginBottom: '8px' }}>3) 입실 시간 (준비 포함)</p>
            <p style={{ marginBottom: '15px', paddingLeft: '20px' }}>{formatTime(contract.checkin_time)}</p>
            <p style={{ marginBottom: '8px' }}>4) 퇴실 시간 (정리 포함)</p>
            <p style={{ marginBottom: '15px', paddingLeft: '20px' }}>{formatTime(contract.checkout_time)}</p>
            <p style={{ marginBottom: '8px' }}>5) 이용 인원</p>
            <p style={{ marginBottom: '15px', paddingLeft: '20px' }}>{contract.guest_count}명</p>
            <p style={{ marginBottom: '8px' }}>6) 이용 목적</p>
            <p style={{ marginBottom: '15px', paddingLeft: '20px' }}>{contract.purpose || "(작성)"}</p>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>■ 이용 요금</h2>
          <div style={{ fontSize: '15px', color: '#333', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '8px' }}>기본 이용료(10인 기준): {formatCurrency(contract.base_price)}원</p>
            <p style={{ marginBottom: '8px' }}>인원 추가: {formatCurrency(contract.additional_price)}원</p>
            <p style={{ marginBottom: '8px' }}>청소대행: {formatCurrency(contract.cleaning_fee)}원</p>
            <p style={{ marginBottom: '8px' }}>부가세: {formatCurrency(contract.vat)}원</p>
            <p style={{ marginTop: '15px', fontWeight: 'bold', fontSize: '16px' }}>▶ 총 입금 금액: {formatCurrency(contract.total_amount)}원</p>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>■ 증빙 발행 요청</h2>
          <p style={{ fontSize: '15px', color: '#333' }}>
            세금계산서 또는 현금영수증 요청: {contract.tax_invoice_requested ? "Y" : "N"}
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>■ 방문 경로</h2>
          <p style={{ fontSize: '15px', color: '#333', marginBottom: '8px' }}>저희 공간을 어떤 경로를 통해 알게 되셨나요?</p>
          <p style={{ fontSize: '15px', color: '#333' }}>검색어 포함하여 작성해 주세요.</p>
          {contract.visit_source && (
            <p style={{ fontSize: '15px', color: '#333', marginTop: '10px', paddingLeft: '20px' }}>
              {contract.visit_source}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>■ 회원가입 안내</h2>
          <p style={{ fontSize: '15px', color: '#333', marginBottom: '8px' }}>
            예약 전일에 발송되는 대관 메시지 수신을 위해 회원가입이 반드시 필요합니다.<br/>
            아래 링크에서 가입해 주세요.
          </p>
          <p style={{ fontSize: '15px', color: '#0066cc', marginTop: '10px' }}>
            👉 https://modlounge.co.kr/site_join_type_choice?back_url=Lw%3D%3D
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>■ 마지막 작성 및 동의 항목</h2>
          <div style={{ fontSize: '15px', color: '#333', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '8px' }}>1) 유의사항 및 환불 규정에 동의하시나요?</p>
            <p style={{ marginBottom: '15px', paddingLeft: '20px' }}>동의합니다 (서명 또는 체크)</p>
            <p style={{ marginBottom: '8px' }}>2) 예약자 성함</p>
            <p style={{ marginBottom: '15px', paddingLeft: '20px' }}>{contract.customer_name || "(작성)"}</p>
            <p style={{ marginBottom: '8px' }}>3) 기업 대관 시 기업명 & 위치</p>
            <p style={{ marginBottom: '15px', paddingLeft: '20px' }}>{contract.company_name || "(해당 시 작성)"}</p>
            <p style={{ marginBottom: '8px' }}>4) 핸드폰 번호</p>
            <p style={{ marginBottom: '15px', paddingLeft: '20px' }}>{contract.phone_number || "(작성)"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractResponse;