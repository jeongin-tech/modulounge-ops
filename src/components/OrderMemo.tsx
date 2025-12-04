import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { StickyNote, Save, X, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OrderMemoProps {
  orderId: string;
  orderNumber: string;
  initialMemo: string | null;
  onMemoSaved?: () => void;
}

const OrderMemo = ({ orderId, orderNumber, initialMemo, onMemoSaved }: OrderMemoProps) => {
  const [memo, setMemo] = useState(initialMemo || "");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(!initialMemo);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ partner_memo: memo.trim() || null })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("메모가 저장되었습니다.");
      setIsEditing(false);
      onMemoSaved?.();
    } catch (error) {
      console.error("Save memo error:", error);
      toast.error("메모 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setMemo(initialMemo || "");
    setIsEditing(false);
    if (!initialMemo) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setMemo(initialMemo || "");
        setIsEditing(!initialMemo);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <StickyNote className="h-4 w-4 mr-2" />
          메모 {initialMemo && "✓"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>내부 메모 - {orderNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isEditing ? (
            <>
              <Textarea
                placeholder="이 오더에 대한 내부 메모를 작성하세요..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {memo.length}/1000
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "저장 중..." : "저장"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  취소
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-muted rounded-lg min-h-[100px]">
                <p className="text-sm whitespace-pre-wrap">
                  {memo || "메모가 없습니다."}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="w-full"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                수정하기
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderMemo;
