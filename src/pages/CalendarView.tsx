import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { EventDialog } from "@/components/EventDialog";
import { DayEventsDialog } from "@/components/DayEventsDialog";

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
  profiles?: {
    full_name: string;
  };
}

// 이벤트 타입별 색상 팔레트
const eventTypeColors: Record<string, string> = {
  "공간대관": "#3b82f6", // blue
  "파티룸": "#8b5cf6",   // violet
  "케이터링": "#f59e0b", // amber
  "사진촬영": "#10b981", // emerald
  "영상촬영": "#06b6d4", // cyan
  "청소": "#6366f1",     // indigo
  "인테리어": "#ec4899", // pink
  "기타": "#64748b",     // slate
};

// 동적으로 색상 할당
const getEventTypeColor = (eventType: string): string => {
  if (eventTypeColors[eventType]) {
    return eventTypeColors[eventType];
  }
  // 등록되지 않은 타입은 해시 기반 색상 생성
  const colors = ["#ef4444", "#f97316", "#84cc16", "#14b8a6", "#0ea5e9", "#a855f7", "#f43f5e"];
  let hash = 0;
  for (let i = 0; i < eventType.length; i++) {
    hash = eventType.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const CalendarView = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [dayEventsDialogOpen, setDayEventsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventTypes, setEventTypes] = useState<string[]>(["공간대관"]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set(["공간대관"]));

  useEffect(() => {
    fetchEventTypes();
    fetchEvents();
  }, []);

  const fetchEventTypes = async () => {
    // profiles에서 service_type 가져오기
    const { data: profileData } = await supabase
      .from("profiles")
      .select("service_type")
      .not("service_type", "is", null);
    
    // calendar_events에서 실제 event_type 가져오기
    const { data: eventData } = await supabase
      .from("calendar_events")
      .select("event_type");
    
    const profileTypes = profileData?.map(p => p.service_type).filter(Boolean) || [];
    const eventTypes = eventData?.map(e => e.event_type).filter(Boolean) || [];
    
    const allTypes = ["공간대관", ...new Set([...profileTypes, ...eventTypes])];
    setEventTypes(allTypes as string[]);
    setSelectedEventTypes(new Set(allTypes as string[]));
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select(`
          *,
          profiles!calendar_events_created_by_fkey (
            full_name
          )
        `)
        .order("start_time", { ascending: true });

      if (error) throw error;
      setEvents(data as any || []);
    } catch (error: any) {
      toast.error("일정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate() &&
        selectedEventTypes.has(event.event_type)
      );
    });
  };

  const toggleEventType = (type: string) => {
    const newSelected = new Set(selectedEventTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedEventTypes(newSelected);
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const datesWithEvents = events.map((event) => new Date(event.start_time));

  const handleDateClick = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setDayEventsDialogOpen(true);
    }
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setEventDialogOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setDayEventsDialogOpen(false);
    setEventDialogOpen(true);
  };

  const handleEventSaved = () => {
    fetchEvents();
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="/calendar">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩중...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/calendar">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              일정 관리
            </h1>
            <p className="text-muted-foreground mt-2">
              팀의 모든 일정을 확인하고 관리하세요
            </p>
          </div>
          <Button onClick={handleAddEvent} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            일정 추가
          </Button>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr_300px] gap-6">
          {/* Event Type Filter Sidebar */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4 text-lg">일정 종류</h3>
            <div className="space-y-2">
              {eventTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedEventTypes.has(type)}
                    onCheckedChange={() => toggleEventType(type)}
                  />
                  <div 
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: getEventTypeColor(type) }}
                  />
                  <Label 
                    htmlFor={`type-${type}`} 
                    className="cursor-pointer text-sm"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Main Calendar */}
          <div className="bg-card rounded-lg border p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateClick}
              className="w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-cell]:p-2"
              classNames={{
                months: "flex flex-col space-y-4 w-full",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center mb-4",
                caption_label: "text-lg font-semibold",
                nav: "space-x-1 flex items-center",
                nav_button: "h-8 w-8 bg-transparent hover:bg-accent rounded-md",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground w-full font-medium text-sm p-2",
                row: "flex w-full mt-2",
                cell: "w-full text-center text-sm p-0 relative h-24 focus-within:relative focus-within:z-20",
                day: "h-full w-full p-2 font-normal hover:bg-accent rounded-md flex flex-col items-start justify-start",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
                day_today: "bg-accent font-bold",
                day_outside: "text-muted-foreground opacity-50",
              }}
              modifiers={{
                hasEvents: datesWithEvents,
              }}
              modifiersClassNames={{
                hasEvents: "font-bold",
              }}
              components={{
                Day: ({ date, ...props }) => {
                  const dayEvents = getEventsForDate(date);
                  const isSelected = selectedDate && 
                    date.getDate() === selectedDate.getDate() &&
                    date.getMonth() === selectedDate.getMonth() &&
                    date.getFullYear() === selectedDate.getFullYear();
                  
                  return (
                    <div 
                      className={`h-full w-full p-2 rounded-md hover:bg-accent cursor-pointer flex flex-col items-start justify-start relative ${
                        isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                      }`}
                      onClick={() => handleDateClick(date)}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-sm">{date.getDate()}</span>
                        {dayEvents.length > 0 && (
                          <Badge 
                            variant="secondary" 
                            className={`h-4 min-w-4 px-1 text-[10px] font-bold ${
                              isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {dayEvents.length}
                          </Badge>
                        )}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="flex flex-col gap-1 w-full">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs px-1.5 py-0.5 rounded truncate w-full"
                              style={{ 
                                backgroundColor: getEventTypeColor(event.event_type) + '40',
                                borderLeft: `3px solid ${getEventTypeColor(event.event_type)}`
                              }}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2}개 더
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                },
              }}
            />
          </div>

          {/* Sidebar - Today's Events */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4 text-lg">
              오늘의 일정
            </h3>
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>일정이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleEditEvent(event)}
                    style={{ borderLeftWidth: "3px", borderLeftColor: getEventTypeColor(event.event_type) }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-sm line-clamp-1">{event.title}</p>
                      <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                        {event.event_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {event.is_all_day 
                        ? "종일" 
                        : new Date(event.start_time).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                      }
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Dialog */}
      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={selectedEvent}
        selectedDate={selectedDate}
        onEventSaved={handleEventSaved}
      />

      {/* Day Events Dialog */}
      <DayEventsDialog
        open={dayEventsDialogOpen}
        onOpenChange={setDayEventsDialogOpen}
        selectedDate={selectedDate || null}
        events={selectedDateEvents}
        onEditEvent={handleEditEvent}
      />
    </DashboardLayout>
  );
};

export default CalendarView;
