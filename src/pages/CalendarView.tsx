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
  meeting_url: string | null;
  profiles?: {
    full_name: string;
  };
}

const CalendarView = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [dayEventsDialogOpen, setDayEventsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

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
        eventDate.getDate() === date.getDate()
      );
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

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
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
                      className={`h-full w-full p-2 rounded-md hover:bg-accent cursor-pointer flex flex-col items-start justify-start ${
                        isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                      }`}
                      onClick={() => handleDateClick(date)}
                    >
                      <span className="text-sm mb-1">{date.getDate()}</span>
                      {dayEvents.length > 0 && (
                        <div className="flex flex-col gap-1 w-full">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs px-1.5 py-0.5 rounded truncate w-full"
                              style={{ 
                                backgroundColor: event.color + '40',
                                borderLeft: `3px solid ${event.color}`
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
                    style={{ borderLeftWidth: "3px", borderLeftColor: event.color }}
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
