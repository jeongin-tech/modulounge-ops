import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Messages = () => {
  return (
    <DashboardLayout currentPage="/messages">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            C/S 메시징
          </h1>
          <p className="text-muted-foreground mt-2">
            내부직원과 1:1 문의 및 소통하세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>실시간 메시징</CardTitle>
                <CardDescription>오더별 커뮤니케이션 및 1:1 문의</CardDescription>
              </div>
              <Badge variant="outline">준비중</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              메시징 기능이 곧 추가될 예정입니다.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              실시간 채팅과 오더별 커뮤니케이션 기능이 포함됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
