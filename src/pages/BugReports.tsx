import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Bug, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface BugReport {
  id: string;
  user_id: string;
  error_path: string;
  error_description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface BugReportComment {
  id: string;
  report_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}

const BugReports = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<BugReport[]>([]);
  const [comments, setComments] = useState<Record<string, BugReportComment[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    error_path: "",
    error_description: "",
  });
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bug reports:", error);
      toast.error("오류 제보 목록을 불러오는데 실패했습니다.");
    } else {
      setReports(data || []);
      // Fetch comments for each report
      for (const report of data || []) {
        fetchComments(report.id);
      }
    }
    setIsLoading(false);
  };

  const fetchComments = async (reportId: string) => {
    const { data, error } = await supabase
      .from("bug_report_comments")
      .select("*")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments((prev) => ({ ...prev, [reportId]: data }));
    }
  };

  const handleSubmit = async () => {
    if (!newReport.error_path.trim() || !newReport.error_description.trim()) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("bug_reports").insert({
      user_id: user.id,
      error_path: newReport.error_path,
      error_description: newReport.error_description,
    });

    if (error) {
      console.error("Error creating bug report:", error);
      toast.error("오류 제보 등록에 실패했습니다.");
    } else {
      toast.success("오류 제보가 등록되었습니다.");
      setNewReport({ error_path: "", error_description: "" });
      setIsDialogOpen(false);
      fetchReports();
    }
    setIsSubmitting(false);
  };

  const handleAddComment = async (reportId: string) => {
    const commentText = newComment[reportId];
    if (!commentText?.trim()) {
      toast.error("댓글을 입력해주세요.");
      return;
    }

    const { error } = await supabase.from("bug_report_comments").insert({
      report_id: reportId,
      user_id: user.id,
      comment: commentText,
    });

    if (error) {
      console.error("Error adding comment:", error);
      toast.error("댓글 등록에 실패했습니다.");
    } else {
      toast.success("댓글이 등록되었습니다.");
      setNewComment((prev) => ({ ...prev, [reportId]: "" }));
      fetchComments(reportId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">대기중</Badge>;
      case "in_progress":
        return <Badge variant="default">처리중</Badge>;
      case "resolved":
        return <Badge className="bg-green-500 hover:bg-green-600">해결됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout currentPage="/bug-reports">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">오류 제보</h1>
            <p className="text-muted-foreground">
              시스템 사용 중 발견한 오류를 제보해주세요.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                오류 제보하기
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 오류 제보</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">오류 발생 경로</label>
                  <Input
                    placeholder="예: /orders/manage 페이지"
                    value={newReport.error_path}
                    onChange={(e) =>
                      setNewReport((prev) => ({
                        ...prev,
                        error_path: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    오류가 발생한 페이지 주소나 기능을 입력해주세요.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">오류 현상</label>
                  <Textarea
                    placeholder="어떤 오류가 발생했는지 자세히 설명해주세요."
                    value={newReport.error_description}
                    onChange={(e) =>
                      setNewReport((prev) => ({
                        ...prev,
                        error_description: e.target.value,
                      }))
                    }
                    rows={5}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "등록중..." : "제보하기"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bug className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">등록된 오류 제보가 없습니다.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                첫 번째 오류 제보하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bug className="h-5 w-5" />
                        {report.error_path}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(report.created_at), "yyyy년 M월 d일 HH:mm", {
                          locale: ko,
                        })}
                      </p>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap mb-4">
                    {report.error_description}
                  </p>

                  <Accordion type="single" collapsible>
                    <AccordionItem value="comments" className="border-none">
                      <AccordionTrigger className="py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          답변 ({comments[report.id]?.length || 0})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {comments[report.id]?.length > 0 ? (
                            comments[report.id].map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-muted p-3 rounded-lg"
                              >
                                <p className="text-sm">{comment.comment}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(
                                    new Date(comment.created_at),
                                    "yyyy년 M월 d일 HH:mm",
                                    { locale: ko }
                                  )}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              아직 답변이 없습니다.
                            </p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Input
                              placeholder="추가 정보를 입력하세요..."
                              value={newComment[report.id] || ""}
                              onChange={(e) =>
                                setNewComment((prev) => ({
                                  ...prev,
                                  [report.id]: e.target.value,
                                }))
                              }
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddComment(report.id)}
                            >
                              등록
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BugReports;
