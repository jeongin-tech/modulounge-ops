import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ContractResponse = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contract, setContract] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setError("토큰이 없습니다");
      setLoading(false);
      return;
    }

    const fetchContract = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("contracts")
          .select("*")
          .eq("access_token", token)
          .maybeSingle();

        if (fetchError) {
          console.error("Fetch error:", fetchError);
          setError(`데이터베이스 오류: ${fetchError.message}`);
          setLoading(false);
          return;
        }

        if (!data) {
          setError("계약서를 찾을 수 없습니다");
          setLoading(false);
          return;
        }

        setContract(data);
        setLoading(false);
      } catch (err: any) {
        console.error("Exception:", err);
        setError(`오류 발생: ${err.message}`);
        setLoading(false);
      }
    };

    fetchContract();
  }, [token]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>로딩 중...</h2>
          <p style={{ color: '#666' }}>계약서를 불러오고 있습니다</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          maxWidth: '600px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#dc2626' }}>
            오류
          </h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
          <p style={{ fontSize: '14px', color: '#999' }}>
            토큰: {token}
          </p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px' }}>계약서를 찾을 수 없습니다</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px', textAlign: 'center' }}>
          모드라운지 계약서
        </h1>

        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
            예약 정보
          </h2>
          <div style={{ lineHeight: '1.8' }}>
            <p><strong>예약 장소:</strong> {contract.location}</p>
            <p><strong>예약 날짜:</strong> {contract.reservation_date}</p>
            <p><strong>입실 시간:</strong> {contract.checkin_time}</p>
            <p><strong>퇴실 시간:</strong> {contract.checkout_time}</p>
            <p><strong>인원:</strong> {contract.guest_count}명</p>
          </div>
        </div>

        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
            이용 요금
          </h2>
          <div style={{ lineHeight: '1.8' }}>
            <p>기본 이용료: {contract.base_price.toLocaleString()}원</p>
            <p>인원 추가: {contract.additional_price.toLocaleString()}원</p>
            <p>청소비: {contract.cleaning_fee.toLocaleString()}원</p>
            <p>부가세: {contract.vat.toLocaleString()}원</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '15px', color: '#2563eb' }}>
              총 금액: {contract.total_amount.toLocaleString()}원
            </p>
          </div>
        </div>

        {contract.submitted_at ? (
          <div style={{
            padding: '20px',
            backgroundColor: '#dcfce7',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>
              ✓ 계약서가 제출되었습니다
            </p>
            <p style={{ marginTop: '10px', color: '#666' }}>
              제출일: {new Date(contract.submitted_at).toLocaleString('ko-KR')}
            </p>
          </div>
        ) : (
          <div style={{
            padding: '20px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#ca8a04' }}>
              ⚠ 계약서 작성이 필요합니다
            </p>
            <p style={{ marginTop: '10px', color: '#666' }}>
              고객 정보를 입력하고 계약서를 제출해주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractResponse;
