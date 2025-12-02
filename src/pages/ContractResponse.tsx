const ContractResponse = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'white', 
      padding: '40px',
      fontFamily: 'sans-serif',
      lineHeight: '1.8'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '40px', textAlign: 'center' }}>
          공간 대여 계약서
        </h1>
        
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>제1조 (목적)</h2>
          <p style={{ fontSize: '16px', color: '#333' }}>
            본 계약은 임대인과 임차인 간의 공간 대여에 관한 제반 사항을 정하는 것을 목적으로 한다.
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>제2조 (계약내용)</h2>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            1. 장소: [라운지 위치]
          </p>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            2. 예약일자: [예약 날짜]
          </p>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            3. 이용시간: [체크인 시간] ~ [체크아웃 시간]
          </p>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            4. 인원: [예약 인원]
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>제3조 (이용요금)</h2>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            1. 기본 이용료 (10인 기준): [금액]원
          </p>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            2. 인원 추가 비용: [금액]원
          </p>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            3. 청소대행비: [금액]원
          </p>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            4. 부가세(10%): [금액]원
          </p>
          <p style={{ fontSize: '16px', color: '#333', fontWeight: 'bold' }}>
            총 결제금액: [총액]원
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>제4조 (환불규정)</h2>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            1. 이용일 7일 전 취소: 100% 환불
          </p>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            2. 이용일 3~6일 전 취소: 50% 환불
          </p>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            3. 이용일 2일 전~당일 취소: 환불 불가
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>제5조 (이용수칙)</h2>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            1. 임차인은 공간을 선량한 관리자의 주의로써 사용하여야 한다.
          </p>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            2. 시설물 파손 시 원상복구 또는 변상의 의무가 있다.
          </p>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            3. 정리정돈 및 청소는 임차인이 책임진다.
          </p>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
            4. 화재 예방을 위해 화기 사용에 주의한다.
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>제6조 (계약의 해지)</h2>
          <p style={{ fontSize: '16px', color: '#333' }}>
            임차인이 본 계약서의 내용을 위반할 경우, 임대인은 계약을 즉시 해지할 수 있으며, 이 경우 환불은 불가능하다.
          </p>
        </div>

        <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '2px solid #333' }}>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '30px' }}>
            본인은 위 계약 내용을 충분히 이해하였으며, 이에 동의합니다.
          </p>
          
          <div style={{ marginBottom: '40px' }}>
            <p style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>
              계약일: [날짜]
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>임대인</p>
              <p style={{ fontSize: '16px', color: '#333', marginBottom: '5px' }}>상호:</p>
              <p style={{ fontSize: '16px', color: '#333', marginBottom: '5px' }}>대표자:</p>
              <p style={{ fontSize: '16px', color: '#333', marginBottom: '5px' }}>연락처:</p>
              <div style={{ marginTop: '30px', borderBottom: '1px solid #333', width: '150px' }}></div>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>(서명 또는 날인)</p>
            </div>
            
            <div>
              <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>임차인</p>
              <p style={{ fontSize: '16px', color: '#333', marginBottom: '5px' }}>성명: [고객명]</p>
              <p style={{ fontSize: '16px', color: '#333', marginBottom: '5px' }}>회사명: [회사명]</p>
              <p style={{ fontSize: '16px', color: '#333', marginBottom: '5px' }}>연락처: [전화번호]</p>
              <div style={{ marginTop: '30px', borderBottom: '1px solid #333', width: '150px' }}></div>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>(서명 또는 날인)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractResponse;
