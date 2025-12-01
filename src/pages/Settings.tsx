import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  return (
    <DashboardLayout currentPage="/settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            시스템 설정
          </h1>
          <p className="text-muted-foreground mt-2">
            사용자 권한 및 시스템 설정을 관리하세요
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>사용자 권한 관리</CardTitle>
                  <CardDescription>내부직원 및 제휴업체 권한 설정</CardDescription>
                </div>
                <Badge variant="outline">준비중</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">사용자 권한 관리 기능이 곧 추가됩니다.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>알림 설정</CardTitle>
                  <CardDescription>이메일 및 푸시 알림 설정</CardDescription>
                </div>
                <Badge variant="outline">준비중</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">알림 설정 기능이 곧 추가됩니다.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>시스템 로그</CardTitle>
                  <CardDescription>시스템 활동 및 오류 로그</CardDescription>
                </div>
                <Badge variant="outline">준비중</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">시스템 로그 기능이 곧 추가됩니다.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
