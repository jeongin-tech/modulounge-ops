import { useParams } from "react-router-dom";

const ContractResponse = () => {
  const { token } = useParams();

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">계약서 페이지 테스트</h1>
        <p className="text-lg">토큰: {token}</p>
        <p className="text-lg mt-4">이 페이지가 보인다면 라우팅은 정상입니다.</p>
      </div>
    </div>
  );
};

export default ContractResponse;
