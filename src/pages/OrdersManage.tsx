import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, MapPin, User, FileText, Upload, X, Image, Loader2 } from "lucide-react";
import { syncOrderToChannelTalk } from "@/lib/channelTalk";
import OrderInquiryButton from "@/components/OrderInquiryButton";
import OrderMemo from "@/components/OrderMemo";
import OrderStatusStepper from "@/components/OrderStatusStepper";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  service_type: string;
  service_date: string;
  service_location: string;
  amount: number;
  notes: string;
  status: string;
  completed_at: string | null;
  partner_memo: string | null;
}

interface OrderFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  created_at: string;
}

const OrdersManage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [completedDate, setCompletedDate] = useState("");
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      fetchFiles(selectedOrder);
    } else {
      setFiles([]);
    }
  }, [selectedOrder]);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("partner_id", user.id)
        .in("status", ["accepted", "confirmed", "completed"])
        .order("service_date", { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error("오더를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async (orderId: string) => {
    setFilesLoading(true);
    try {
      const { data, error } = await supabase
        .from("order_files")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setFilesLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    
    // Validate all file sizes
    const oversizedFiles = filesArray.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`${oversizedFiles.length}개 파일이 10MB를 초과합니다.`);
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      let successCount = 0;
      let failCount = 0;

      for (const file of filesArray) {
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${orderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("order-files")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("order-files")
            .getPublicUrl(fileName);

          const { error: dbError } = await supabase.from("order_files").insert({
            order_id: orderId,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            uploaded_by: user.id,
          });

          if (dbError) throw dbError;
          successCount++;
        } catch (error) {
          console.error("Upload error for file:", file.name, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount}개 파일이 업로드되었습니다.`);
      }
      if (failCount > 0) {
        toast.error(`${failCount}개 파일 업로드에 실패했습니다.`);
      }
      
      fetchFiles(orderId);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteFile = async (fileId: string, fileUrl: string) => {
    try {
      const urlParts = fileUrl.split("/order-files/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("order-files").remove([filePath]);
      }

      const { error } = await supabase
        .from("order_files")
        .delete()
        .eq("id", fileId);

      if (error) throw error;

      toast.success("파일이 삭제되었습니다.");
      if (selectedOrder) {
        fetchFiles(selectedOrder);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("파일 삭제에 실패했습니다.");
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (fileType?.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const handleComplete = async (orderId: string) => {
    if (!completedDate) {
      toast.error("완료일자를 선택해주세요.");
      return;
    }

    if (files.length === 0) {
      toast.error("첨부파일을 1개 이상 등록해주세요.");
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "completed",
          completed_at: completedDate,
          notes: memo,
        })
        .eq("id", orderId);

      if (error) throw error;
      
      syncOrderToChannelTalk(orderId, 'status_changed');
      
      toast.success("오더가 완료 처리되었습니다!");
      setSelectedOrder(null);
      setMemo("");
      setCompletedDate("");
      setFiles([]);
      fetchOrders();
    } catch (error: any) {
      toast.error("완료 처리에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="/orders/manage">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩중...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/orders/manage">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            오더 관리
          </h1>
          <p className="text-muted-foreground mt-2">수락한 오더를 관리하고 완료 처리하세요</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">관리할 오더가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span>{order.order_number}</span>
                        <Badge variant="secondary">{order.service_type}</Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {new Date(order.service_date).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Status Stepper */}
                  <div className="pb-3 border-b">
                    <OrderStatusStepper status={order.status} />
                  </div>
                  
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">고객명:</span>
                      <span>{order.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">장소:</span>
                      <span>{order.service_location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">금액:</span>
                      <span className="font-semibold text-primary">
                        ₩{order.amount?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">요청사항</p>
                      <p className="text-sm text-muted-foreground">{order.notes}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <OrderInquiryButton
                      orderNumber={order.order_number}
                      customerName={order.customer_name}
                      serviceDate={order.service_date}
                      serviceLocation={order.service_location}
                      amount={order.amount}
                    />
                    <OrderMemo
                      orderId={order.id}
                      orderNumber={order.order_number}
                      initialMemo={order.partner_memo}
                      onMemoSaved={fetchOrders}
                    />
                  </div>

                  {order.status === "accepted" && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        관리자 확정 대기중입니다. 확정 후 완료 처리가 가능합니다.
                      </p>
                    </div>
                  )}

                  {order.status === "confirmed" && (
                    <>
                      {selectedOrder === order.id ? (
                        <div className="space-y-4 pt-2 border-t">
                          <div className="space-y-2">
                            <Label htmlFor="completedDate">
                              완료일자 <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="completedDate"
                              type="datetime-local"
                              value={completedDate}
                              onChange={(e) => setCompletedDate(e.target.value)}
                            />
                          </div>

                          {/* File Upload Section */}
                          <div className="space-y-2">
                            <Label>
                              첨부파일 <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                              <label className="flex-1">
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, order.id)}
                                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                  disabled={uploading}
                                  multiple
                                />
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  disabled={uploading}
                                  asChild
                                >
                                  <span>
                                    {uploading ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        업로드 중...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        파일 선택
                                      </>
                                    )}
                                  </span>
                                </Button>
                              </label>
                            </div>
                            
                            {/* File list */}
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {filesLoading ? (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                  로딩중...
                                </p>
                              ) : files.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                  첨부된 파일이 없습니다. 파일을 등록해주세요.
                                </p>
                              ) : (
                                files.map((file) => (
                                  <div
                                    key={file.id}
                                    className="flex items-center justify-between p-2 bg-muted rounded-lg"
                                  >
                                    <a
                                      href={file.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm hover:text-primary truncate flex-1"
                                    >
                                      {getFileIcon(file.file_type)}
                                      <span className="truncate">{file.file_name}</span>
                                    </a>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 shrink-0"
                                      onClick={() => handleDeleteFile(file.id, file.file_url)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="memo">현장 이슈 메모</Label>
                            <Textarea
                              id="memo"
                              placeholder="현장에서 발생한 이슈나 특이사항을 입력하세요..."
                              value={memo}
                              onChange={(e) => setMemo(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleComplete(order.id)}
                              className="flex-1 bg-gradient-primary"
                            >
                              완료 처리
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedOrder(null);
                                setMemo("");
                                setCompletedDate("");
                                setFiles([]);
                              }}
                              variant="outline"
                              className="flex-1"
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <Button
                            onClick={() => setSelectedOrder(order.id)}
                            className="w-full bg-gradient-primary"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            완료 처리하기
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {order.status === "completed" && order.completed_at && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        완료일: {new Date(order.completed_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrdersManage;
