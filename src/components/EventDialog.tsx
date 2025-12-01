import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string;
  location: string | null;
  created_by: string;
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

export const EventDialog = ({ open, onOpenChange, event, selectedDate, onEventSaved }: EventDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setEventType(event.event_type);
      setStartTime(format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm"));
      setEndTime(format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm"));
      setLocation(event.location || "");
    } else if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      setStartTime(`${dateStr}T09:00`);
      setEndTime(`${dateStr}T10:00`);
      setTitle("");
      setDescription("");
      setEventType("meeting");
      setLocation("");
    }
  }, [event, selectedDate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const eventData = {
        title,
        description: description || null,
        event_type: eventType,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        location: location || null,
        created_by: user.id,
      };

      if (event) {
        const { error } = await supabase
          .from("calendar_events")
          .update(eventData)
          .eq("id", event.id);

        if (error) throw error;
        toast.success("일정이 수정되었습니다.");
      } else {
        const { error } = await supabase
          .from("calendar_events")
          .insert(eventData);

        if (error) throw error;
        toast.success("일정이 추가되었습니다.");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "일정 수정" : "일정 추가"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time">시작 시간 *</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="end-time">종료 시간 *</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
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
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="일정 설명"
              rows={4}
            />
          </div>

          {event?.profiles && (
            <div className="text-sm text-muted-foreground">
              등록자: {event.profiles.full_name}
            </div>
          )}

          <DialogFooter className="gap-2">
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
