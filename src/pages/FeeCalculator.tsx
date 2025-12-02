import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calculator, CalendarIcon, Users, Clock, Building2, Info } from "lucide-react";
import { format, getDay, getMonth } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  company_name: string | null;
  full_name: string;
}

interface PricingRuleGroup {
  id: string;
  profile_id: string | null;
  name: string;
  season_type: string;
  is_active: boolean;
}

interface PricingRule {
  id: string;
  group_id: string;
  name: string;
  rule_type: string;
  months: number[];
  weekdays: number[];
  start_time: string | null;
  end_time: string | null;
  min_guests: number;
  max_guests: number | null;
  price: number;
  is_percentage: boolean;
  priority: number;
  is_active: boolean;
  base_guest_count: number | null;
  price_per_additional_guest: number | null;
}

interface MatchedRule {
  rule: PricingRule;
  groupName: string;
  calculatedPrice: number;
  breakdown: string;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const FeeCalculator = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<PricingRuleGroup[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [guestCount, setGuestCount] = useState<number>(10);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("__general__");

  // Result state
  const [matchedRules, setMatchedRules] = useState<MatchedRule[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, groupsRes, rulesRes] = await Promise.all([
        supabase.from("profiles").select("id, company_name, full_name").eq("role", "PARTNER"),
        supabase.from("pricing_rule_groups").select("*").eq("is_active", true),
        supabase.from("pricing_rules").select("*").eq("is_active", true),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (groupsRes.error) throw groupsRes.error;
      if (rulesRes.error) throw rulesRes.error;

      setProfiles(profilesRes.data || []);
      setGroups(groupsRes.data || []);
      setRules(rulesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const isTimeInRange = (checkTime: string, ruleStart: string | null, ruleEnd: string | null): boolean => {
    if (!ruleStart || !ruleEnd) return true;
    
    const check = timeToMinutes(checkTime);
    const start = timeToMinutes(ruleStart);
    const end = timeToMinutes(ruleEnd);

    // 야간 시간대 처리 (예: 18:00 ~ 06:00)
    if (end < start) {
      return check >= start || check <= end;
    }
    return check >= start && check <= end;
  };

  const calculateFee = () => {
    if (!selectedDate) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    if (!startTime) {
      toast.error("시작 시간을 입력해주세요.");
      return;
    }
    if (guestCount < 1) {
      toast.error("인원을 입력해주세요.");
      return;
    }

    const dayOfWeek = getDay(selectedDate); // 0 = Sunday
    const month = getMonth(selectedDate) + 1; // 1-12

    // 해당 프로필의 그룹 필터링
    const relevantGroups = groups.filter((g) => {
      if (selectedProfileId === "__general__") {
        return g.profile_id === null;
      }
      return g.profile_id === selectedProfileId || g.profile_id === null;
    });

    const relevantGroupIds = relevantGroups.map((g) => g.id);

    // 조건에 맞는 규칙 찾기
    const matchingRules: MatchedRule[] = [];

    rules
      .filter((rule) => relevantGroupIds.includes(rule.group_id))
      .forEach((rule) => {
        // 월 체크
        if (rule.months && !rule.months.includes(month)) return;

        // 요일 체크
        if (rule.weekdays && !rule.weekdays.includes(dayOfWeek)) return;

        // 시간대 체크
        if (!isTimeInRange(startTime, rule.start_time, rule.end_time)) return;

        // 인원 체크
        if (rule.min_guests && guestCount < rule.min_guests) return;
        if (rule.max_guests && guestCount > rule.max_guests) return;

        // 가격 계산
        let calculatedPrice = 0;
        let breakdown = "";

        if (rule.is_percentage) {
          // 퍼센트 할인/할증 - 이건 기본 요금에 적용되어야 함
          breakdown = `${rule.price > 0 ? "+" : ""}${rule.price}% 적용`;
          calculatedPrice = rule.price; // 퍼센트 값 저장
        } else {
          // 절대 금액
          const basePrice = rule.price;
          const baseGuests = rule.base_guest_count || 10;
          const additionalPrice = rule.price_per_additional_guest || 0;
          const additionalGuests = Math.max(0, guestCount - baseGuests);
          const additionalAmount = additionalGuests * additionalPrice;

          calculatedPrice = basePrice + additionalAmount;

          if (additionalGuests > 0 && additionalPrice > 0) {
            breakdown = `기본요금 ${basePrice.toLocaleString()}원 (${baseGuests}인 기준) + 추가인원 ${additionalGuests}명 × ${additionalPrice.toLocaleString()}원 = ${calculatedPrice.toLocaleString()}원`;
          } else {
            breakdown = `${calculatedPrice.toLocaleString()}원 (${baseGuests}인 기준)`;
          }
        }

        const group = groups.find((g) => g.id === rule.group_id);

        matchingRules.push({
          rule,
          groupName: group?.name || "알 수 없음",
          calculatedPrice,
          breakdown,
        });
      });

    // 우선순위로 정렬
    matchingRules.sort((a, b) => b.rule.priority - a.rule.priority);

    setMatchedRules(matchingRules);

    // 총액 계산 (가장 높은 우선순위 기본 요금 + 퍼센트 적용)
    let baseAmount = 0;
    let percentageAdjustment = 0;

    // 기본 요금 찾기 (퍼센트가 아닌 규칙 중 가장 높은 우선순위)
    const baseRule = matchingRules.find((m) => !m.rule.is_percentage);
    if (baseRule) {
      baseAmount = baseRule.calculatedPrice;
    }

    // 퍼센트 조정 적용
    matchingRules
      .filter((m) => m.rule.is_percentage)
      .forEach((m) => {
        percentageAdjustment += (baseAmount * m.calculatedPrice) / 100;
      });

    const total = baseAmount + percentageAdjustment;
    setTotalPrice(total);
    setCalculated(true);
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        options.push(time);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <DashboardLayout currentPage="대관료계산기">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대관료계산기</h1>
          <p className="text-muted-foreground">날짜, 시간, 인원을 입력하여 대관료를 계산해보세요.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 입력 폼 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                대관 정보 입력
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 지점/업체 선택 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  지점/업체
                </Label>
                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                  <SelectTrigger>
                    <SelectValue placeholder="지점 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__general__">일반 (공통 요금)</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.company_name || p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 날짜 선택 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  날짜
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko })
                      ) : (
                        "날짜를 선택하세요"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={ko}
                    />
                  </PopoverContent>
                </Popover>
                {selectedDate && (
                  <p className="text-sm text-muted-foreground">
                    {getMonth(selectedDate) + 1}월, {WEEKDAY_LABELS[getDay(selectedDate)]}요일
                  </p>
                )}
              </div>

              {/* 시간 선택 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  시간
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">시작 시간</Label>
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="시작" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">종료 시간 (선택)</Label>
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="종료" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">선택 안함</SelectItem>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 인원 입력 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  예상 인원
                </Label>
                <Input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                  placeholder="인원 수"
                  min={1}
                />
              </div>

              <Button onClick={calculateFee} className="w-full" size="lg" disabled={loading}>
                <Calculator className="mr-2 h-4 w-4" />
                요금 계산하기
              </Button>
            </CardContent>
          </Card>

          {/* 결과 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                계산 결과
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!calculated ? (
                <div className="text-center py-12 text-muted-foreground">
                  날짜, 시간, 인원을 입력하고 계산하기 버튼을 눌러주세요.
                </div>
              ) : matchedRules.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>적용 가능한 요금 규칙이 없습니다.</p>
                  <p className="text-sm mt-2">요금 규칙을 먼저 설정해주세요.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 총액 */}
                  <div className="bg-primary/10 rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">예상 대관료</p>
                    <p className="text-4xl font-bold text-primary">
                      {totalPrice.toLocaleString()}원
                    </p>
                  </div>

                  {/* 적용된 규칙 목록 */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">적용된 요금 규칙</h4>
                    {matchedRules.map((matched, index) => (
                      <div
                        key={matched.rule.id}
                        className={cn(
                          "border rounded-lg p-4 space-y-2",
                          index === 0 && !matched.rule.is_percentage && "border-primary bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{matched.rule.name}</span>
                            {index === 0 && !matched.rule.is_percentage && (
                              <Badge variant="default" className="text-xs">적용</Badge>
                            )}
                            {matched.rule.is_percentage && (
                              <Badge variant="secondary" className="text-xs">할인/할증</Badge>
                            )}
                          </div>
                          <Badge variant="outline">우선순위: {matched.rule.priority}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{matched.groupName}</p>
                        <p className="text-sm">{matched.breakdown}</p>
                        <div className="flex gap-1 flex-wrap">
                          {matched.rule.weekdays && (
                            <Badge variant="outline" className="text-xs">
                              {matched.rule.weekdays.map((d) => WEEKDAY_LABELS[d]).join(", ")}
                            </Badge>
                          )}
                          {matched.rule.start_time && matched.rule.end_time && (
                            <Badge variant="outline" className="text-xs">
                              {matched.rule.start_time} ~ {matched.rule.end_time}
                            </Badge>
                          )}
                          {matched.rule.months && matched.rule.months.length < 12 && (
                            <Badge variant="outline" className="text-xs">
                              {matched.rule.months.join(", ")}월
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 계산 조건 요약 */}
                  <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
                    <p className="font-medium">계산 조건</p>
                    <p className="text-muted-foreground">
                      • 날짜: {selectedDate && format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko })}
                    </p>
                    <p className="text-muted-foreground">• 시간: {startTime}</p>
                    <p className="text-muted-foreground">• 인원: {guestCount}명</p>
                    <p className="text-muted-foreground">
                      • 지점: {selectedProfileId === "__general__" 
                        ? "일반 (공통 요금)" 
                        : profiles.find((p) => p.id === selectedProfileId)?.company_name || "알 수 없음"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FeeCalculator;
