import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface OrderInquiryButtonProps {
  orderNumber: string;
  customerName: string;
  serviceDate: string;
  serviceLocation: string;
  amount: number | null;
}

const OrderInquiryButton = ({
  orderNumber,
  customerName,
  serviceDate,
  serviceLocation,
  amount,
}: OrderInquiryButtonProps) => {
  const handleInquiry = () => {
    // Check if ChannelIO is available
    if (typeof window !== "undefined" && (window as any).ChannelIO) {
      const formattedDate = new Date(serviceDate).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const message = `[오더 문의]\n\n주문번호: ${orderNumber}\n고객명: ${customerName}\n서비스일시: ${formattedDate}\n장소: ${serviceLocation}\n금액: ₩${amount?.toLocaleString() || "-"}\n\n문의 내용:`;

      // Open ChannelTalk with pre-filled message
      (window as any).ChannelIO("openChat", undefined, message);
    } else {
      toast.error("채널톡이 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleInquiry}>
      <MessageCircle className="h-4 w-4 mr-2" />
      이 오더 문의
    </Button>
  );
};

export default OrderInquiryButton;
