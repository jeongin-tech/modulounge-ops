import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function ContractResponseSimple() {
  const { token } = useParams();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from("contracts")
        .select("*")
        .eq("access_token", token)
        .maybeSingle();
      
      setContract(data);
      setLoading(false);
    };
    
    fetchData();
  }, [token]);

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>로딩 중...</div>;
  if (!contract) return <div style={{padding: '40px', textAlign: 'center'}}>계약서를 찾을 수 없습니다</div>;

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px'}}>
      <div style={{maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '8px'}}>
        <h1 style={{fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '30px'}}>
          모드라운지 계약서
        </h1>
        
        <div style={{marginBottom: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
          <h2 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '15px'}}>예약 정보</h2>
          <p><strong>예약호실:</strong> {contract.location}</p>
          <p><strong>예약 날짜:</strong> {contract.reservation_date}</p>
          <p><strong>입실 시간:</strong> {contract.checkin_time}</p>
          <p><strong>퇴실 시간:</strong> {contract.checkout_time}</p>
          <p><strong>이용 인원:</strong> {contract.guest_count}명</p>
        </div>

        <div style={{marginBottom: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
          <h2 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '15px'}}>이용 요금</h2>
          <p>기본 이용료: {contract.base_price?.toLocaleString()}원</p>
          <p>인원 추가: {contract.additional_price?.toLocaleString()}원</p>
          <p>청소비: {contract.cleaning_fee?.toLocaleString()}원</p>
          <p>부가세: {contract.vat?.toLocaleString()}원</p>
          <p style={{fontSize: '20px', fontWeight: 'bold', marginTop: '15px', color: '#2563eb'}}>
            총 금액: {contract.total_amount?.toLocaleString()}원
          </p>
        </div>

        {contract.submitted_at ? (
          <div style={{padding: '20px', backgroundColor: '#dcfce7', borderRadius: '8px', textAlign: 'center'}}>
            <p style={{fontSize: '18px', fontWeight: 'bold', color: '#16a34a'}}>✓ 계약서가 제출되었습니다</p>
          </div>
        ) : (
          <div style={{padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px', textAlign: 'center'}}>
            <p style={{fontSize: '18px', fontWeight: 'bold', color: '#ca8a04'}}>⚠ 계약서 작성이 필요합니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContractResponseSimple;
