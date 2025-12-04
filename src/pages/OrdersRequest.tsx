import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { syncOrderToChannelTalk } from "@/lib/channelTalk";

interface Partner {
  id: string;
  full_name: string;
  company_name: string;
  service_type: string | null;
}

const OrdersRequest = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, company_name, service_type")
        .eq("role", "PARTNER")
        .order("full_name");

      if (error) throw error;
      setPartners(data || []);
    } catch (error: any) {
      toast.error("제휴업체 목록을 불러오는데 실패했습니다.");
    }
  };

  const handlePartnerChange = (partnerId: string) => {
    setSelectedPartner(partnerId);
    
    // 선택된 파트너의 서비스 타입 자동 설정
    const partner = partners.find(p => p.id === partnerId);
    if (partner?.service_type) {
      setServiceType(partner.service_type);
    }
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `ORD${year}${month}${day}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const orderNumber = generateOrderNumber();

      const { data: insertedOrder, error } = await supabase.from("orders").insert({
        order_number: orderNumber,
        partner_id: selectedPartner,
        staff_id: user.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        service_type: serviceType,
        service_date: serviceDate,
        service_location: serviceLocation,
        amount: parseFloat(amount),
        notes,
        status: "requested",
      }).select().single();

      if (error) throw error;

      // 채널톡에 주문 동기화
      if (insertedOrder) {
        syncOrderToChannelTalk(insertedOrder.id, 'created');
      }

      toast.success("오더 요청이 전송되었습니다!");
      
      // Reset form
      setSelectedPartner("");
      setCustomerName("");
      setCustomerPhone("");
      setServiceType("");
      setServiceDate("");
      setServiceLocation("");
      setAmount("");
      setNotes("");
    } catch (error: any) {
      toast.error(error.message || "오더 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout currentPage="/orders/request">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            오더 요청
          </h1>
          <p className="text-muted-foreground mt-2">제휴업체에 새로운 오더를 요청하세요</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>새 오더 생성</CardTitle>
            <CardDescription>제휴업체에 서비스 가능 여부를 문의합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partner">제휴업체 선택 *</Label>
                <Select value={selectedPartner} onValueChange={handlePartnerChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="제휴업체를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.company_name || partner.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">고객명 *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="홍길동"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">고객 연락처</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">서비스 종류 *</Label>
                  <Select value={serviceType} onValueChange={setServiceType} required disabled={!selectedPartner}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedPartner ? "자동 선택됨" : "먼저 제휴업체를 선택하세요"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="케이터링">케이터링</SelectItem>
                      <SelectItem value="뷔페서비스">뷔페서비스</SelectItem>
                      <SelectItem value="청소서비스">청소서비스</SelectItem>
                      <SelectItem value="MC">MC</SelectItem>
                      <SelectItem value="사진촬영">사진촬영</SelectItem>
                      <SelectItem value="파티룸">파티룸</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceDate">서비스 일시 *</Label>
                  <Input
                    id="serviceDate"
                    type="datetime-local"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceLocation">서비스 장소 *</Label>
                <Input
                  id="serviceLocation"
                  value={serviceLocation}
                  onChange={(e) => setServiceLocation(e.target.value)}
                  placeholder="서울시 강남구..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">금액 (원)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">요청사항</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="특별 요청사항이나 참고사항을 입력하세요..."
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
                {loading ? "전송중..." : "오더 요청 보내기"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OrdersRequest;
