const ContractResponse = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'white', 
      padding: '40px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>
          계약서 페이지
        </h1>
        <p style={{ fontSize: '18px', marginBottom: '10px' }}>
          이 페이지가 보이나요?
        </p>
        <p style={{ fontSize: '18px', color: '#666' }}>
          보인다면 라우팅은 작동합니다.
        </p>
      </div>
    </div>
  );
};

export default ContractResponse;
