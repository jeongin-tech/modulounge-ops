import DashboardLayout from "@/components/DashboardLayout";

const QuoteGenerator = () => {
  return (
    <DashboardLayout currentPage="/quote">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">견적서 작성하기</h1>
        <div className="w-full h-[calc(100vh-180px)] rounded-lg overflow-hidden border">
          <iframe
            src="https://simply-quote-gen.vercel.app/"
            className="w-full h-full"
            title="견적서 작성"
            frameBorder="0"
            allow="clipboard-write"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuoteGenerator;
