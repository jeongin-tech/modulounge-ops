import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, FileText, Image, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OrderFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  created_at: string;
}

interface OrderFileUploadProps {
  orderId: string;
  orderNumber: string;
}

const OrderFileUpload = ({ orderId, orderNumber }: OrderFileUploadProps) => {
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchFiles();
    }
  }, [open, orderId]);

  const fetchFiles = async () => {
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
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const fileExt = file.name.split(".").pop();
      const fileName = `${orderId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("order-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("order-files")
        .getPublicUrl(fileName);

      // Save to order_files table
      const { error: dbError } = await supabase.from("order_files").insert({
        order_id: orderId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      toast.success("파일이 업로드되었습니다.");
      fetchFiles();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleDeleteFile = async (fileId: string, fileUrl: string) => {
    try {
      // Extract path from URL
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
      fetchFiles();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          첨부파일 {files.length > 0 && `(${files.length})`}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>첨부파일 - {orderNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Upload button */}
          <div className="flex items-center gap-2">
            <label className="flex-1">
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                disabled={uploading}
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
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                로딩중...
              </p>
            ) : files.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                첨부된 파일이 없습니다.
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
      </DialogContent>
    </Dialog>
  );
};

export default OrderFileUpload;
