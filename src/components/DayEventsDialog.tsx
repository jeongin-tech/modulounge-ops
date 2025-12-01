import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Clock, MapPin, User } from "lucide-react";

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

interface DayEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  events: Event[];
  onEditEvent: (event: Event) => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  meeting: "회의",
  service: "서비스",
  delivery: "배송",
  consultation: "상담",
  other: "기타",
};

export const DayEventsDialog = ({ open, onOpenChange, selectedDate, events, onEditEvent }: DayEventsDialogProps) => {
  if (!selectedDate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {format(selectedDate, "yyyy년 M월 d일 (EEEE)", { locale: ko })}의 일정
          </DialogTitle>
        </DialogHeader>

        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>해당 날짜에 일정이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onEditEvent(event)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{event.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(event.start_time), "HH:mm")} - {format(new Date(event.end_time), "HH:mm")}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                  </Badge>
                </div>

                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}

                {event.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {event.profiles && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>등록자: {event.profiles.full_name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
