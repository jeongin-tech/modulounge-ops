import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const ContractCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    location: "모드라운지 역삼점",
    reservation_date: "",
    checkin_time: "09:00",
    checkout_time: "16:30",
    guest_count: 35,
    purpose: "",
    base_price: 340000,
    additional_price: 250000,
    cleaning_fee: 150000,
    vat: 74000,
    total_amount: 814000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const { data, error } = await supabase
        .from("contracts")
        .insert([
          {
            ...formData,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("계약서가 생성되었습니다.");
      
      // Copy link automatically
      const link = `${window.location.origin}/contract/${data.access_token}`;
      navigator.clipboard.writeText(link);
      toast.success("계약서 링크가 클립보드에 복사되었습니다.");
      
      navigate("/contracts");
    } catch (error) {
      console.error("계약서 생성 오류:", error);
      toast.error("계약서 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout currentPage="/contracts">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/contracts")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">새 계약서 작성</h1>
            <p className="text-muted-foreground mt-1">
              예약 정보를 입력하고 고객에게 전송할 계약서를 생성하세요
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>예약 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">예약호실</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reservation_date">예약 날짜</Label>
                  <Input
                    id="reservation_date"
                    type="date"
                    value={formData.reservation_date}
                    onChange={(e) =>
                      setFormData({ ...formData, reservation_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkin_time">입실 시간</Label>
                  <Input
                    id="checkin_time"
                    type="time"
                    value={formData.checkin_time}
                    onChange={(e) =>
                      setFormData({ ...formData, checkin_time: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkout_time">퇴실 시간</Label>
                  <Input
                    id="checkout_time"
                    type="time"
                    value={formData.checkout_time}
                    onChange={(e) =>
                      setFormData({ ...formData, checkout_time: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest_count">이용 인원</Label>
                  <Input
                    id="guest_count"
                    type="number"
                    value={formData.guest_count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        guest_count: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="purpose">이용 목적</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, purpose: e.target.value })
                    }
                    placeholder="선택사항"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>이용 요금</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">기본 이용료 (10인 기준)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={formData.base_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        base_price: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_price">인원 추가</Label>
                  <Input
                    id="additional_price"
                    type="number"
                    value={formData.additional_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        additional_price: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cleaning_fee">청소대행</Label>
                  <Input
                    id="cleaning_fee"
                    type="number"
                    value={formData.cleaning_fee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cleaning_fee: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vat">부가세</Label>
                  <Input
                    id="vat"
                    type="number"
                    value={formData.vat}
                    onChange={(e) =>
                      setFormData({ ...formData, vat: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="total_amount" className="text-lg font-bold">
                    총 입금 금액
                  </Label>
                  <Input
                    id="total_amount"
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_amount: parseInt(e.target.value),
                      })
                    }
                    className="text-lg font-bold"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/contracts")}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "생성 중..." : "계약서 생성 및 링크 복사"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ContractCreate;
