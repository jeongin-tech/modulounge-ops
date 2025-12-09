import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  "사전답사": "#22c55e", // green
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRole();
    fetchEvents();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile) {
        setUserRole(profile.role);
      }
    }
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
      const matchesDate = 
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate();
      
      // PARTNER는 본인 일정만 표시
      if (userRole === "PARTNER" && currentUserId) {
        return matchesDate && event.created_by === currentUserId;
      }
      return matchesDate;
    });
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

        <div className={`grid ${userRole === "PARTNER" ? "lg:grid-cols-[1fr_300px]" : "lg:grid-cols-[250px_1fr_300px]"} gap-6`}>
          {/* Event Type Filter Sidebar - STAFF만 표시 */}
          {userRole !== "PARTNER" && (
            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold mb-4 text-lg">일정 종류</h3>
              <div className="space-y-2">
                {events.map(e => e.event_type).filter((v, i, a) => a.indexOf(v) === i).map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: getEventTypeColor(type) }}
                    />
                    <span className="text-sm">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Sidebar - Today's Timeline */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4 text-lg">
              {selectedDate?.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })} 일정
            </h3>
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>일정이 없습니다</p>
              </div>
            ) : (
              <div className="relative">
                {/* 타임라인 */}
                <div className="space-y-0">
                  {Array.from({ length: 15 }, (_, i) => i + 8).map((hour) => {
                    const hourEvents = selectedDateEvents.filter((event) => {
                      if (event.is_all_day) return false;
                      const eventHour = new Date(event.start_time).getHours();
                      return eventHour === hour;
                    });
                    
                    return (
                      <div key={hour} className="flex min-h-[48px]">
                        {/* 시간 라벨 */}
                        <div className="w-12 text-xs text-muted-foreground shrink-0 pt-1">
                          {hour.toString().padStart(2, "0")}:00
                        </div>
                        {/* 이벤트 영역 */}
                        <div className="flex-1 border-l border-border pl-3 pb-2">
                          {hourEvents.map((event) => (
                            <div
                              key={event.id}
                              className="p-2 rounded-md mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ 
                                backgroundColor: getEventTypeColor(event.event_type) + '20',
                                borderLeft: `3px solid ${getEventTypeColor(event.event_type)}`
                              }}
                              onClick={() => handleEditEvent(event)}
                            >
                              <p className="font-medium text-xs line-clamp-1">{event.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(event.start_time).toLocaleTimeString("ko-KR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })} - {new Date(event.end_time).toLocaleTimeString("ko-KR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* 종일 이벤트 */}
                {selectedDateEvents.filter(e => e.is_all_day).length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">종일</p>
                    {selectedDateEvents.filter(e => e.is_all_day).map((event) => (
                      <div
                        key={event.id}
                        className="p-2 rounded-md mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ 
                          backgroundColor: getEventTypeColor(event.event_type) + '20',
                          borderLeft: `3px solid ${getEventTypeColor(event.event_type)}`
                        }}
                        onClick={() => handleEditEvent(event)}
                      >
                        <p className="font-medium text-xs">{event.title}</p>
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          {event.event_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
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
