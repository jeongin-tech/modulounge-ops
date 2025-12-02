import DashboardLayout from "@/components/DashboardLayout";

const SpaceFinder = () => {
  return (
    <DashboardLayout currentPage="/space-finder">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">공간검색하기</h1>
        <div className="w-full h-[calc(100vh-180px)] rounded-lg overflow-hidden border">
          <iframe
            src="https://json-space-finder.vercel.app/"
            className="w-full h-full"
            title="공간검색"
            frameBorder="0"
            allow="clipboard-write"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SpaceFinder;
