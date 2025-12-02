import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import companyStamp from "@/assets/company-stamp.png";

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
  agreed: boolean | null;
  submitted_at: string | null;
  receipt_type: string | null;
  cash_receipt_type: string | null;
  business_registration_number: string | null;
  business_name: string | null;
  business_representative: string | null;
  business_address: string | null;
  business_type: string | null;
  business_category: string | null;
  receipt_email: string | null;
  personal_phone: string | null;
  personal_id_number: string | null;
}

const ContractResponse = () => {
  const { token } = useParams<{ token: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [visitSource, setVisitSource] = useState("");
  
  // Receipt form state
  const [receiptType, setReceiptType] = useState<string>("none");
  const [cashReceiptType, setCashReceiptType] = useState<string>("business");
  const [businessRegNumber, setBusinessRegNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessRepresentative, setBusinessRepresentative] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [receiptEmail, setReceiptEmail] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [personalIdNumber, setPersonalIdNumber] = useState("");

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
        // Pre-fill form if data exists
        if (data) {
          setCustomerName(data.customer_name || "");
          setCompanyName(data.company_name || "");
          setPhoneNumber(data.phone_number || "");
          setVisitSource(data.visit_source || "");
          setAgreedToTerms(data.agreed || false);
          setReceiptType(data.receipt_type || "none");
          setCashReceiptType(data.cash_receipt_type || "business");
          setBusinessRegNumber(data.business_registration_number || "");
          setBusinessName(data.business_name || "");
          setBusinessRepresentative(data.business_representative || "");
          setBusinessAddress(data.business_address || "");
          setBusinessType(data.business_type || "");
          setBusinessCategory(data.business_category || "");
          setReceiptEmail(data.receipt_email || "");
          setPersonalPhone(data.personal_phone || "");
          setPersonalIdNumber(data.personal_id_number || "");
        }
      }
      setLoading(false);
    };

    fetchContract();
  }, [token]);

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      toast.error("유의사항 및 환불 규정에 동의해주세요.");
      return;
    }

    if (!customerName.trim()) {
      toast.error("예약자 성함을 입력해주세요.");
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error("핸드폰 번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("contracts")
      .update({
        agreed: true,
        customer_name: customerName.trim(),
        company_name: companyName.trim() || null,
        phone_number: phoneNumber.trim(),
        visit_source: visitSource.trim() || null,
        submitted_at: new Date().toISOString(),
        receipt_type: receiptType,
        cash_receipt_type: receiptType === "cash_receipt" ? cashReceiptType : null,
        business_registration_number: (receiptType === "tax_invoice" || (receiptType === "cash_receipt" && cashReceiptType === "business")) ? businessRegNumber.trim() || null : null,
        business_name: receiptType === "tax_invoice" ? businessName.trim() || null : null,
        business_representative: receiptType === "tax_invoice" ? businessRepresentative.trim() || null : null,
        business_address: receiptType === "tax_invoice" ? businessAddress.trim() || null : null,
        business_type: receiptType === "tax_invoice" ? businessType.trim() || null : null,
        business_category: receiptType === "tax_invoice" ? businessCategory.trim() || null : null,
        receipt_email: receiptType === "tax_invoice" ? receiptEmail.trim() || null : null,
        personal_phone: (receiptType === "cash_receipt" && cashReceiptType === "personal") ? personalPhone.trim() || null : null,
        personal_id_number: (receiptType === "cash_receipt" && cashReceiptType === "personal") ? personalIdNumber.trim() || null : null,
      })
      .eq("access_token", token);

    setSubmitting(false);

    if (error) {
      toast.error("서명 완료 중 오류가 발생했습니다.");
      console.error("Error updating contract:", error);
    } else {
      toast.success("서명이 완료되었습니다!");
      // Refresh contract data
      const { data } = await supabase
        .from("contracts")
        .select("*")
        .eq("access_token", token)
        .maybeSingle();
      if (data) {
        setContract(data);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
    <div 
      style={{ 
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
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>■ 공급하는 자</h2>
          <div style={{ fontSize: '15px', color: '#333', lineHeight: '1.8' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '15px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '17px' }}>주식회사 모드파티</p>
              <img 
                src={companyStamp} 
                alt="모드파티 직인" 
                style={{ width: '60px', height: '60px', objectFit: 'contain' }}
              />
            </div>
            <p style={{ marginBottom: '5px' }}>대표자: 이대로</p>
            <p style={{ marginBottom: '5px' }}>사업자번호: 611-88-01898</p>
            <p style={{ marginBottom: '5px' }}>전화: 070-4138-1898</p>
            <p style={{ marginBottom: '5px' }}>메일: modwotjr@modparty.co.kr</p>
            <p style={{ marginBottom: '5px' }}>웹: <a href="https://modlounge.co.kr" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>https://modlounge.co.kr</a></p>
            <p style={{ marginBottom: '5px' }}>주소: 서울시 강남구 테헤란로22길 11 지하1층</p>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>■ 증빙 발행 요청</h2>
          {contract.agreed ? (
            <div style={{ fontSize: '15px', color: '#333', lineHeight: '1.8' }}>
              {contract.receipt_type === "tax_invoice" && (
                <>
                  <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>✓ 세금계산서</p>
                  <p>사업자등록번호: {contract.business_registration_number || "-"}</p>
                  <p>상호명: {contract.business_name || "-"}</p>
                  <p>대표자명: {contract.business_representative || "-"}</p>
                  <p>사업장주소: {contract.business_address || "-"}</p>
                  <p>업태: {contract.business_type || "-"}</p>
                  <p>종목: {contract.business_category || "-"}</p>
                  <p>이메일: {contract.receipt_email || "-"}</p>
                </>
              )}
              {contract.receipt_type === "cash_receipt" && (
                <>
                  <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>✓ 현금영수증 ({contract.cash_receipt_type === "business" ? "사업자지출증빙" : "개인소득공제"})</p>
                  {contract.cash_receipt_type === "business" ? (
                    <p>사업자등록번호: {contract.business_registration_number || "-"}</p>
                  ) : (
                    <>
                      <p>휴대폰번호: {contract.personal_phone || "-"}</p>
                      {contract.personal_id_number && <p>주민등록번호: {contract.personal_id_number}</p>}
                    </>
                  )}
                </>
              )}
              {contract.receipt_type === "none" && <p>증빙 발행 요청 없음</p>}
            </div>
          ) : (
            <div style={{ fontSize: '15px', color: '#333' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="receiptType"
                    value="none"
                    checked={receiptType === "none"}
                    onChange={(e) => setReceiptType(e.target.value)}
                    style={{ width: '18px', height: '18px', marginRight: '10px' }}
                  />
                  <span>필요 없음</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="receiptType"
                    value="tax_invoice"
                    checked={receiptType === "tax_invoice"}
                    onChange={(e) => setReceiptType(e.target.value)}
                    style={{ width: '18px', height: '18px', marginRight: '10px' }}
                  />
                  <span>세금계산서</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="receiptType"
                    value="cash_receipt"
                    checked={receiptType === "cash_receipt"}
                    onChange={(e) => setReceiptType(e.target.value)}
                    style={{ width: '18px', height: '18px', marginRight: '10px' }}
                  />
                  <span>현금영수증</span>
                </label>
              </div>

              {receiptType === "tax_invoice" && (
                <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginTop: '10px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>세금계산서 발행 정보</p>
                  <input
                    type="text"
                    value={businessRegNumber}
                    onChange={(e) => setBusinessRegNumber(e.target.value)}
                    placeholder="사업자등록번호 (예: 123-45-67890)"
                    style={{ width: '100%', padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }}
                  />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="상호명"
                    style={{ width: '100%', padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }}
                  />
                  <input
                    type="text"
                    value={businessRepresentative}
                    onChange={(e) => setBusinessRepresentative(e.target.value)}
                    placeholder="대표자명"
                    style={{ width: '100%', padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }}
                  />
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="사업장 주소"
                    style={{ width: '100%', padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="업태"
                      style={{ flex: 1, padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value)}
                      placeholder="종목"
                      style={{ flex: 1, padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <input
                    type="email"
                    value={receiptEmail}
                    onChange={(e) => setReceiptEmail(e.target.value)}
                    placeholder="세금계산서 수신 이메일"
                    style={{ width: '100%', padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              )}

              {receiptType === "cash_receipt" && (
                <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginTop: '10px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>현금영수증 발행 정보</p>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="cashReceiptType"
                        value="business"
                        checked={cashReceiptType === "business"}
                        onChange={(e) => setCashReceiptType(e.target.value)}
                        style={{ width: '16px', height: '16px', marginRight: '8px' }}
                      />
                      <span>사업자지출증빙</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="cashReceiptType"
                        value="personal"
                        checked={cashReceiptType === "personal"}
                        onChange={(e) => setCashReceiptType(e.target.value)}
                        style={{ width: '16px', height: '16px', marginRight: '8px' }}
                      />
                      <span>개인소득공제</span>
                    </label>
                  </div>
                  
                  {cashReceiptType === "business" ? (
                    <input
                      type="text"
                      value={businessRegNumber}
                      onChange={(e) => setBusinessRegNumber(e.target.value)}
                      placeholder="사업자등록번호 (예: 123-45-67890)"
                      style={{ width: '100%', padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  ) : (
                    <>
                      <input
                        type="tel"
                        value={personalPhone}
                        onChange={(e) => setPersonalPhone(e.target.value)}
                        placeholder="휴대폰번호 (예: 010-1234-5678)"
                        style={{ width: '100%', padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }}
                      />
                      <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>※ 휴대폰번호로 발급이 어려운 경우 주민등록번호 입력</p>
                      <input
                        type="text"
                        value={personalIdNumber}
                        onChange={(e) => setPersonalIdNumber(e.target.value)}
                        placeholder="주민등록번호 (선택)"
                        style={{ width: '100%', padding: '10px', fontSize: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>■ 방문 경로</h2>
          <p style={{ fontSize: '15px', color: '#333', marginBottom: '8px' }}>저희 공간을 어떤 경로를 통해 알게 되셨나요?</p>
          <p style={{ fontSize: '15px', color: '#333', marginBottom: '15px' }}>검색어 포함하여 작성해 주세요.</p>
          {contract.agreed ? (
            <p style={{ fontSize: '15px', color: '#333', paddingLeft: '20px' }}>
              {contract.visit_source || "(미작성)"}
            </p>
          ) : (
            <input
              type="text"
              value={visitSource}
              onChange={(e) => setVisitSource(e.target.value)}
              placeholder="예: 네이버 검색, 인스타그램, 지인 추천 등"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
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
            <p style={{ marginBottom: '15px' }}>1) 유의사항 및 환불 규정에 동의하시나요?</p>
            {contract.agreed ? (
              <p style={{ marginBottom: '20px', paddingLeft: '20px', color: '#0066cc', fontWeight: 'bold' }}>
                ✓ 동의함 (서명 완료)
              </p>
            ) : (
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px', 
                paddingLeft: '20px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    marginRight: '10px',
                    cursor: 'pointer'
                  }}
                />
                <span>동의합니다</span>
              </label>
            )}

            <p style={{ marginBottom: '10px' }}>2) 예약자 성함 <span style={{ color: '#ff0000' }}>*</span></p>
            {contract.agreed ? (
              <p style={{ marginBottom: '20px', paddingLeft: '20px' }}>{contract.customer_name}</p>
            ) : (
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="이름을 입력해주세요"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '20px',
                }}
              />
            )}

            <p style={{ marginBottom: '10px' }}>3) 기업 대관 시 기업명 & 위치</p>
            {contract.agreed ? (
              <p style={{ marginBottom: '20px', paddingLeft: '20px' }}>{contract.company_name || "(미작성)"}</p>
            ) : (
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="해당 시 작성"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '20px',
                }}
              />
            )}

            <p style={{ marginBottom: '10px' }}>4) 핸드폰 번호 <span style={{ color: '#ff0000' }}>*</span></p>
            {contract.agreed ? (
              <p style={{ marginBottom: '20px', paddingLeft: '20px' }}>{contract.phone_number}</p>
            ) : (
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="010-1234-5678"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '20px',
                }}
              />
            )}
          </div>

          {!contract.agreed && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: submitting ? '#999' : '#0066cc',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                marginTop: '20px',
              }}
            >
              {submitting ? "처리 중..." : "서명 완료"}
            </button>
          )}

          {contract.agreed && (
            <>
              <div style={{
                padding: '15px',
                backgroundColor: '#e8f5e9',
                border: '1px solid #4caf50',
                borderRadius: '8px',
                marginTop: '20px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#2e7d32' }}>
                  ✓ 서명이 완료되었습니다
                </p>
                {contract.submitted_at && (
                  <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    {format(new Date(contract.submitted_at), "yyyy년 M월 d일 HH:mm", { locale: ko })}
                  </p>
                )}
              </div>
              <button
                onClick={handlePrint}
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginTop: '15px',
                }}
                className="print:hidden"
              >
                🖨️ 계약서 인쇄 / PDF 저장
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractResponse;