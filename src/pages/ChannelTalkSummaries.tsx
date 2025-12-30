import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Calendar, 
  MapPin, 
  User, 
  Search,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Summary {
  id: string;
  chat_id: string;
  customer_info: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  event_date: string | null;
  location: string | null;
  inquiry_content: string | null;
  coordination_feasibility: string | null;
  staff_handling: string | null;
  customer_tendency: string | null;
  upselling: string | null;
  recommended_script: string | null;
  keywords: string | null;
  raw_message: string | null;
  created_at: string;
}

const ChannelTalkSummaries = () => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSummaries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("channel_talk_summaries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSummaries(data || []);
    } catch (error) {
      console.error("Error fetching summaries:", error);
      toast.error("상담 요약을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();

    // 실시간 구독
    const channel = supabase
      .channel("channel-talk-summaries")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "channel_talk_summaries",
        },
        () => {
          fetchSummaries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("channel_talk_summaries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("삭제되었습니다.");
      fetchSummaries();
    } catch (error) {
      console.error("Error deleting summary:", error);
      toast.error("삭제에 실패했습니다.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("클립보드에 복사되었습니다.");
  };

  const filteredSummaries = summaries.filter((summary) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      summary.customer_info?.toLowerCase().includes(searchLower) ||
      summary.customer_name?.toLowerCase().includes(searchLower) ||
      summary.customer_phone?.toLowerCase().includes(searchLower) ||
      summary.location?.toLowerCase().includes(searchLower) ||
      summary.keywords?.toLowerCase().includes(searchLower) ||
      summary.inquiry_content?.toLowerCase().includes(searchLower)
    );
  });

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/channel-talk-summary-webhook`;

  return (
    <DashboardLayout currentPage="/channel-talk-summaries">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">채널톡 상담요약</h1>
            <p className="text-muted-foreground">
              B2C 고객 상담 종료 후 요약봇이 생성한 요약 내용
            </p>
          </div>
          <Button onClick={fetchSummaries} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>

        {/* 웹훅 URL 표시 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              웹훅 URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                {webhookUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhookUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              채널톡 웹훅 설정에서 위 URL을 등록하세요.
            </p>
          </CardContent>
        </Card>

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="고객정보, 지점명, 키워드로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 요약 목록 */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-1/3 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSummaries.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">상담 요약이 없습니다</h3>
              <p className="text-muted-foreground">
                채널톡 웹훅을 설정하면 상담 요약이 여기에 표시됩니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="space-y-4">
              {filteredSummaries.map((summary) => (
                <Card key={summary.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        setExpandedId(expandedId === summary.id ? null : summary.id)
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {summary.location && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {summary.location}
                              </Badge>
                            )}
                            {summary.event_date && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {summary.event_date}
                              </Badge>
                            )}
                          </div>
                          
                          {/* 고객 이름 & 연락처 */}
                          <div className="flex items-center gap-4 flex-wrap">
                            {(summary.customer_name || summary.customer_info) && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {summary.customer_name || summary.customer_info}
                                </span>
                              </div>
                            )}
                            {summary.customer_phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{summary.customer_phone}</span>
                              </div>
                            )}
                          </div>
                          
                          {summary.inquiry_content && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {summary.inquiry_content}
                            </p>
                          )}
                          
                          {summary.keywords && (
                            <div className="flex flex-wrap gap-1">
                              {summary.keywords.split("#").filter(Boolean).map((keyword, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  #{keyword.trim()}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(summary.created_at), "MM/dd HH:mm", { locale: ko })}
                          </span>
                          {expandedId === summary.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedId === summary.id && (
                      <div className="border-t p-4 bg-muted/30 space-y-4">
                        <div className="grid gap-3 text-sm">
                          {summary.coordination_feasibility && (
                            <div>
                              <span className="font-medium">조율 및 가능성:</span>
                              <p className="text-muted-foreground">{summary.coordination_feasibility}</p>
                            </div>
                          )}
                          {summary.staff_handling && (
                            <div>
                              <span className="font-medium">상담원 처리 흐름:</span>
                              <p className="text-muted-foreground">{summary.staff_handling}</p>
                            </div>
                          )}
                          {summary.customer_tendency && (
                            <div>
                              <span className="font-medium">고객 성향:</span>
                              <p className="text-muted-foreground">{summary.customer_tendency}</p>
                            </div>
                          )}
                          {summary.upselling && (
                            <div>
                              <span className="font-medium">업세일링/추가 기회:</span>
                              <p className="text-muted-foreground">{summary.upselling}</p>
                            </div>
                          )}
                          {summary.recommended_script && (
                            <div>
                              <span className="font-medium">추천 스크립트:</span>
                              <p className="text-muted-foreground">{summary.recommended_script}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(summary.raw_message || "");
                            }}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            전체 복사
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                삭제
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>삭제 확인</AlertDialogTitle>
                                <AlertDialogDescription>
                                  이 상담 요약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(summary.id)}
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChannelTalkSummaries;