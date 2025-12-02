import React from 'react';

function TestPage() {
  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      backgroundColor: '#ff0000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px',
      color: 'white',
      fontWeight: 'bold'
    }
  }, '테스트 페이지 - 이게 보이나요?');
}

export default TestPage;
