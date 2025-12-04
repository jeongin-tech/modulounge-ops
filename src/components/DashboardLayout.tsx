import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  DollarSign,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  FileSignature,
  FileText,
  Search,
  BookOpen,
  Calculator,
  Tag,
  User as UserIcon,
} from "lucide-react";
import ChannelTalk from "@/components/ChannelTalk";
import NotificationBell from "@/components/NotificationBell";
import logo from "@/assets/logo.jpg";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: string;
}

interface MenuItem {
  icon: ReactNode;
  label: string;
  path: string;
  roles: ("STAFF" | "PARTNER")[];
  badgeCount?: number;
}

const DashboardLayout = ({ children, currentPage }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"STAFF" | "PARTNER" | null>(null);
  const [userProfile, setUserProfile] = useState<{
    full_name?: string;
    phone?: string;
    company_name?: string;
    business_registration_number?: string;
    representative_name?: string;
    service_type?: string;
    service_regions?: string[];
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("role, full_name, phone, company_name, business_registration_number, representative_name, service_type, service_regions")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setUserRole(data.role as "STAFF" | "PARTNER");
          setUserProfile({
            full_name: data.full_name || undefined,
            phone: data.phone || undefined,
            company_name: data.company_name || undefined,
            business_registration_number: data.business_registration_number || undefined,
            representative_name: data.representative_name || undefined,
            service_type: data.service_type || undefined,
            service_regions: data.service_regions as string[] || undefined,
          });
        }
      };
      fetchUserProfile();
    }
  }, [user]);

  // 대기중인 오더 수 가져오기
  useEffect(() => {
    if (user && userRole === "PARTNER") {
      const fetchPendingOrders = async () => {
        const { count } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("partner_id", user.id)
          .eq("status", "requested");
        
        setPendingOrdersCount(count || 0);
      };
      fetchPendingOrders();

      // 실시간 구독
      const channel = supabase
        .channel("orders-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `partner_id=eq.${user.id}`,
          },
          () => {
            fetchPendingOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, userRole]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("로그아웃되었습니다.");
    navigate("/auth");
  };

  const menuItems: MenuItem[] = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "대시보드",
      path: "/",
      roles: ["STAFF", "PARTNER"],
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      label: "오더 수락",
      path: "/orders/accept",
      roles: ["PARTNER"],
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      label: "오더 관리",
      path: "/orders/manage",
      roles: ["PARTNER"],
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      label: "오더 요청",
      path: "/orders/request",
      roles: ["STAFF"],
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      label: "오더 전체보기",
      path: "/orders/all",
      roles: ["STAFF"],
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "일정 보기",
      path: "/calendar",
      roles: ["STAFF", "PARTNER"],
    },
    {
      icon: <DollarSign className="h-5 w-5" />,
      label: "정산 현황",
      path: "/settlements",
      roles: ["PARTNER"],
    },
    {
      icon: <DollarSign className="h-5 w-5" />,
      label: "정산 관리",
      path: "/settlements/manage",
      roles: ["STAFF"],
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "제휴업체 대시보드",
      path: "/partners",
      roles: ["STAFF"],
    },
    {
      icon: <Tag className="h-5 w-5" />,
      label: "제휴업체 가격관리",
      path: "/pricing",
      roles: ["STAFF"],
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "사용자 관리",
      path: "/users",
      roles: ["STAFF"],
    },
    {
      icon: <FileSignature className="h-5 w-5" />,
      label: "전자서명관리",
      path: "/contracts",
      roles: ["STAFF"],
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "견적서 작성하기",
      path: "/quote",
      roles: ["STAFF"],
    },
    {
      icon: <Search className="h-5 w-5" />,
      label: "공간검색하기",
      path: "/space-finder",
      roles: ["STAFF"],
    },
    {
      icon: <Calculator className="h-5 w-5" />,
      label: "대관료계산기",
      path: "/fee-calculator",
      roles: ["STAFF"],
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: "사용가이드",
      path: "/guide",
      roles: ["STAFF", "PARTNER"],
    },
    {
      icon: <UserIcon className="h-5 w-5" />,
      label: "프로필 관리",
      path: "/profile",
      roles: ["PARTNER"],
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "시스템 설정",
      path: "/settings",
      roles: ["STAFF"],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    userRole ? item.roles.includes(userRole) : false
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <img src={logo} alt="모드라운지" className="h-8 w-8 rounded-full" />
          <span className="font-bold">모드라운지 ADMIN</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={logo} alt="모드라운지" className="h-12 w-12 rounded-full" />
                <div>
                  <h1 className="font-bold text-lg">모드라운지</h1>
                  <p className="text-xs text-muted-foreground">ADMIN</p>
                </div>
              </div>
              <div className="hidden lg:block">
                <NotificationBell />
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const badgeCount = item.path === "/orders/accept" ? pendingOrdersCount : 0;
              return (
                <Button
                  key={item.path}
                  variant={currentPage === item.path ? "default" : "ghost"}
                  className="w-full justify-start relative"
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                  {badgeCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </nav>

          <div className="p-4 border-t space-y-2">
            {user && (
              <div className="px-3 py-2 text-sm">
                <p className="font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {userRole === "STAFF" ? "내부직원" : "제휴업체"}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">로그아웃</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8">
        {children}
      </main>

      {/* Channel Talk for Partners */}
      {userRole === "PARTNER" && user && (
        <ChannelTalk
          pluginKey="2bd3ebee-2b8d-42b6-b670-9dacfe932c06"
          user={{
            id: user.id,
            email: user.email || "",
            name: userProfile?.full_name,
            mobileNumber: userProfile?.phone,
            companyName: userProfile?.company_name,
            businessRegistrationNumber: userProfile?.business_registration_number,
            representativeName: userProfile?.representative_name,
            serviceType: userProfile?.service_type,
            serviceRegions: userProfile?.service_regions,
          }}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
