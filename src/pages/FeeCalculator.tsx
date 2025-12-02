import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

const FeeCalculator = () => {
  return (
    <DashboardLayout currentPage="대관료계산기">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대관료계산기</h1>
          <p className="text-muted-foreground">대관료를 계산해보세요.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              대관료 계산
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">계산기 기능이 곧 추가될 예정입니다.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FeeCalculator;
