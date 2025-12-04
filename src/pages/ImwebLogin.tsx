import DashboardLayout from "@/components/DashboardLayout";

const ImwebLogin = () => {
  return (
    <DashboardLayout currentPage="/imweb">
      <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] -m-4 lg:-m-8">
        <iframe
          src="https://modlounge.co.kr/admin/?type=page&back_url=L2FkbWluL3Nob3BwaW5nL29yZGVyLXYxP3N1YlBhdGg9TDI5eVpHVnlMekV2YnpJd01qVXhNREE0TVRnMFpqUm1aVFZqTm1Sak5RPT0%3D"
          className="w-full h-full border-0"
          title="아임웹 로그인"
          allow="clipboard-write"
        />
      </div>
    </DashboardLayout>
  );
};

export default ImwebLogin;
