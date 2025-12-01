import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Message = Tables<"messages"> & {
  sender: {
    full_name: string;
    email: string;
    company_name: string | null;
    role: string;
  } | null;
  receiver: {
    full_name: string;
    email: string;
  } | null;
};

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchMessages();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('New message received:', payload);
          fetchMessages(); // Refresh messages when new one arrives
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    setUserRole(profile?.role || null);
    setUserId(user.id);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name, email, company_name, role),
        receiver:profiles!messages_receiver_id_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "오류",
        description: "메시지를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    setLoading(true);
    try {
      // Insert message
      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          message: newMessage.trim(),
          receiver_id: null, // Broadcasting to staff
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // If sender is PARTNER, send to Slack
      if (userRole === 'PARTNER') {
        const { error: slackError } = await supabase.functions.invoke('send-to-slack', {
          body: { messageId: insertedMessage.id }
        });

        if (slackError) {
          console.error('Error sending to Slack:', slackError);
          // Don't fail the whole operation if Slack fails
          toast({
            title: "경고",
            description: "메시지는 전송되었지만 Slack 알림에 실패했습니다.",
            variant: "default",
          });
        }
      }

      toast({
        title: "성공",
        description: "메시지가 전송되었습니다.",
      });

      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "오류",
        description: "메시지 전송에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout currentPage="/messages">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            C/S 메시징
          </h1>
          <p className="text-muted-foreground mt-2">
            {userRole === 'PARTNER' 
              ? '내부직원과 1:1 문의 및 소통하세요 (Slack으로 전송됩니다)'
              : '파트너사의 메시지를 확인하세요'}
          </p>
        </div>

        {userRole === 'PARTNER' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                새 메시지 작성
              </CardTitle>
              <CardDescription>
                메시지를 작성하면 내부 직원의 Slack으로 전송됩니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="문의하실 내용을 입력하세요..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!newMessage.trim() || loading}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? '전송 중...' : '메시지 전송'}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  메시지 내역
                </CardTitle>
                <CardDescription>
                  {userRole === 'PARTNER' ? '내가 보낸 메시지' : '전체 메시지'}
                </CardDescription>
              </div>
              <Badge variant="outline">{messages.length}건</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    아직 메시지가 없습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <Card key={message.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold">
                              {message.sender?.company_name || message.sender?.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {message.sender?.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={message.sender?.role === 'PARTNER' ? 'default' : 'secondary'}>
                              {message.sender?.role === 'PARTNER' ? '파트너' : '내부직원'}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(message.created_at).toLocaleString('ko-KR')}
                            </p>
                          </div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
