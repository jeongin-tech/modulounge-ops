import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { X, Plus, Bell, Video, User } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string;
  location: string | null;
  created_by: string;
  is_all_day: boolean;
  color: string;
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
  visibility: string;
  reminders: any[];
  meeting_url: string | null;
  profiles?: {
    full_name: string;
  };
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  selectedDate?: Date;
  onEventSaved: () => void;
}

const EVENT_TYPES = [
  { value: "meeting", label: "회의" },
  { value: "service", label: "서비스" },
  { value: "delivery", label: "배송" },
  { value: "consultation", label: "상담" },
  { value: "other", label: "기타" },
];

const COLORS = [
  { value: "#3b82f6", label: "파란색" },
  { value: "#ef4444", label: "빨간색" },
  { value: "#10b981", label: "초록색" },
  { value: "#f59e0b", label: "주황색" },
  { value: "#8b5cf6", label: "보라색" },
  { value: "#ec4899", label: "분홍색" },
  { value: "#6366f1", label: "인디고" },
];

const RECURRENCE_OPTIONS = [
  { value: "none", label: "반복 안함" },
  { value: "daily", label: "매일" },
  { value: "weekly", label: "매주" },
  { value: "monthly", label: "매월" },
  { value: "yearly", label: "매년" },
];

const VISIBILITY_OPTIONS = [
  { value: "default", label: "기본 공개 설정" },
  { value: "public", label: "공개" },
  { value: "private", label: "비공개" },
];

const REMINDER_OPTIONS = [
  { value: "5", label: "5분 전" },
  { value: "10", label: "10분 전" },
  { value: "30", label: "30분 전" },
  { value: "60", label: "1시간 전" },
  { value: "1440", label: "1일 전" },
];

export const EventDialog = ({ open, onOpenChange, event, selectedDate, onEventSaved }: EventDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [color, setColor] = useState("#3b82f6");
  const [recurrence, setRecurrence] = useState("none");
  const [visibility, setVisibility] = useState("default");
  const [reminders, setReminders] = useState<string[]>(["10"]);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendees, setAttendees] = useState<Array<{ email: string; user_id?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setEventType(event.event_type);
      setIsAllDay(event.is_all_day);
      setColor(event.color);
      setRecurrence(event.recurrence_rule || "none");
      setVisibility(event.visibility);
      setReminders(event.reminders || ["10"]);
      setMeetingUrl(event.meeting_url || "");
      setLocation(event.location || "");
      
      if (event.is_all_day) {
        setStartTime(format(new Date(event.start_time), "yyyy-MM-dd"));
        setEndTime(format(new Date(event.end_time), "yyyy-MM-dd"));
      } else {
        setStartTime(format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm"));
        setEndTime(format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm"));
      }
      
      fetchAttendees(event.id);
    } else if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      setStartTime(`${dateStr}T09:00`);
      setEndTime(`${dateStr}T10:00`);
      setTitle("");
      setDescription("");
      setEventType("meeting");
      setIsAllDay(false);
      setColor("#3b82f6");
      setRecurrence("none");
      setVisibility("default");
      setReminders(["10"]);
      setMeetingUrl("");
      setLocation("");
      setAttendees([]);
    }
  }, [event, selectedDate, open]);

  const fetchAttendees = async (eventId: string) => {
    const { data } = await supabase
      .from("calendar_event_attendees")
      .select("email, user_id")
      .eq("event_id", eventId);
    
    if (data) {
      setAttendees(data);
    }
  };

  const addAttendee = () => {
    if (!attendeeEmail.trim()) return;
    
    if (attendees.some(a => a.email === attendeeEmail)) {
      toast.error("이미 추가된 참석자입니다.");
      return;
    }
    
    setAttendees([...attendees, { email: attendeeEmail }]);
    setAttendeeEmail("");
  };

  const removeAttendee = (email: string) => {
    setAttendees(attendees.filter(a => a.email !== email));
  };

  const addReminder = (value: string) => {
    if (!reminders.includes(value)) {
      setReminders([...reminders, value]);
    }
  };

  const removeReminder = (value: string) => {
    setReminders(reminders.filter(r => r !== value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      let startDateTime, endDateTime;
      
      if (isAllDay) {
        startDateTime = new Date(startTime + "T00:00:00").toISOString();
        endDateTime = new Date(endTime + "T23:59:59").toISOString();
      } else {
        startDateTime = new Date(startTime).toISOString();
        endDateTime = new Date(endTime).toISOString();
      }

      const eventData = {
        title,
        description: description || null,
        event_type: eventType,
        start_time: startDateTime,
        end_time: endDateTime,
        location: location || null,
        is_all_day: isAllDay,
        color,
        recurrence_rule: recurrence === "none" ? null : recurrence,
        visibility,
        reminders,
        meeting_url: meetingUrl || null,
        created_by: user.id,
      };

      let eventId: string;

      if (event) {
        const { error } = await supabase
          .from("calendar_events")
          .update(eventData)
          .eq("id", event.id);

        if (error) throw error;
        eventId = event.id;
        
        // Delete existing attendees
        await supabase
          .from("calendar_event_attendees")
          .delete()
          .eq("event_id", event.id);
        
        toast.success("일정이 수정되었습니다.");
      } else {
        const { data: newEvent, error } = await supabase
          .from("calendar_events")
          .insert(eventData)
          .select()
          .single();

        if (error) throw error;
        eventId = newEvent.id;
        toast.success("일정이 추가되었습니다.");
      }

      // Add attendees
      if (attendees.length > 0) {
        const attendeesData = attendees.map(a => ({
          event_id: eventId,
          email: a.email,
          user_id: a.user_id || null,
        }));

        await supabase
          .from("calendar_event_attendees")
          .insert(attendeesData);
      }

      onEventSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "일정 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", event.id);

      if (error) throw error;
      toast.success("일정이 삭제되었습니다.");
      onEventSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "일정 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "일정 수정" : "일정 추가"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">일정 세부정보</TabsTrigger>
              <TabsTrigger value="attendees">참석자</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="일정 제목"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-day"
                  checked={isAllDay}
                  onCheckedChange={(checked) => setIsAllDay(checked as boolean)}
                />
                <Label htmlFor="all-day" className="cursor-pointer">종일</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">시작 {isAllDay ? "날짜" : "시간"} *</Label>
                  <Input
                    id="start-time"
                    type={isAllDay ? "date" : "datetime-local"}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">종료 {isAllDay ? "날짜" : "시간"} *</Label>
                  <Input
                    id="end-time"
                    type={isAllDay ? "date" : "datetime-local"}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recurrence">반복</Label>
                <Select value={recurrence} onValueChange={setRecurrence}>
                  <SelectTrigger id="recurrence">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="event-type">일정 종류 *</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger id="event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">장소</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="장소"
                />
              </div>

              <div>
                <Label htmlFor="meeting-url">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    화상 회의 링크
                  </div>
                </Label>
                <Input
                  id="meeting-url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div>
                <Label>
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="h-4 w-4" />
                    알림
                  </div>
                </Label>
                <div className="space-y-2">
                  <Select onValueChange={addReminder}>
                    <SelectTrigger>
                      <SelectValue placeholder="알림 추가" />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2">
                    {reminders.map((reminder) => {
                      const label = REMINDER_OPTIONS.find(o => o.value === reminder)?.label;
                      return (
                        <Badge key={reminder} variant="secondary" className="gap-1">
                          {label}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeReminder(reminder)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="color">캘린더 색상</Label>
                <div className="flex gap-2 mt-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        color === c.value ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setColor(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="visibility">공개 설정</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger id="visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="일정 설명"
                  rows={6}
                />
              </div>

              {event?.profiles && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  등록자: {event.profiles.full_name}
                </div>
              )}
            </TabsContent>

            <TabsContent value="attendees" className="space-y-4 mt-4">
              <div>
                <Label>참석자 추가</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    placeholder="이메일 주소"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAttendee())}
                  />
                  <Button type="button" onClick={addAttendee}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {attendees.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    참석자가 없습니다
                  </p>
                ) : (
                  attendees.map((attendee, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{attendee.email}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttendee(attendee.email)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 mt-6">
            {event && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                삭제
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "저장중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
