import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, DollarSign } from "lucide-react";

interface Profile {
  id: string;
  company_name: string | null;
  full_name: string;
}

interface PricingRuleGroup {
  id: string;
  profile_id: string | null;
  name: string;
  description: string | null;
  season_type: string;
  is_active: boolean;
  profiles?: Profile | null;
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
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const SEASON_TYPES = [
  { value: "regular", label: "일반" },
  { value: "peak", label: "성수기" },
  { value: "off_peak", label: "비수기" },
];
const RULE_TYPES = [
  { value: "base", label: "기본 요금" },
  { value: "time_slot", label: "시간대별" },
  { value: "guest_addon", label: "인원 추가" },
  { value: "option", label: "옵션" },
];

const PricingManage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<PricingRuleGroup[]>([]);
  const [rules, setRules] = useState<Record<string, PricingRule[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Group form state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PricingRuleGroup | null>(null);
  const [groupForm, setGroupForm] = useState({
    profile_id: "",
    name: "",
    description: "",
    season_type: "regular",
  });

  // Rule form state
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    rule_type: "base",
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    start_time: "",
    end_time: "",
    min_guests: 1,
    max_guests: "",
    price: 0,
    is_percentage: false,
    priority: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch partners (PARTNER role profiles)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, company_name, full_name")
        .eq("role", "PARTNER");

      // Fetch all pricing rule groups
      const { data: groupsData } = await supabase
        .from("pricing_rule_groups")
        .select("*")
        .order("created_at", { ascending: false });

      // Map profiles to groups
      const groupsWithProfiles = (groupsData || []).map((group) => {
        const profile = (profilesData || []).find((p) => p.id === group.profile_id);
        return { ...group, profiles: profile || null };
      });

      setProfiles(profilesData || []);
      setGroups(groupsWithProfiles as PricingRuleGroup[]);

      // Fetch rules for all groups
      if (groupsData && groupsData.length > 0) {
        const groupIds = groupsData.map((g) => g.id);
        const { data: rulesData } = await supabase
          .from("pricing_rules")
          .select("*")
          .in("group_id", groupIds)
          .order("priority", { ascending: true });

        const rulesMap: Record<string, PricingRule[]> = {};
        (rulesData || []).forEach((rule) => {
          if (!rulesMap[rule.group_id]) rulesMap[rule.group_id] = [];
          rulesMap[rule.group_id].push(rule as PricingRule);
        });
        setRules(rulesMap);
      }
    } catch (error) {
      console.error("데이터 로드 오류:", error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    }
    setLoading(false);
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Group CRUD
  const openGroupDialog = (group?: PricingRuleGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupForm({
        profile_id: group.profile_id || "",
        name: group.name,
        description: group.description || "",
        season_type: group.season_type || "regular",
      });
    } else {
      setEditingGroup(null);
      setGroupForm({ profile_id: "", name: "", description: "", season_type: "regular" });
    }
    setGroupDialogOpen(true);
  };

  const saveGroup = async () => {
    if (!groupForm.name) {
      toast.error("그룹명을 입력해주세요.");
      return;
    }

    try {
      if (editingGroup) {
        const { error } = await supabase
          .from("pricing_rule_groups")
          .update({
            profile_id: groupForm.profile_id || null,
            name: groupForm.name,
            description: groupForm.description || null,
            season_type: groupForm.season_type,
          })
          .eq("id", editingGroup.id);
        if (error) throw error;
        toast.success("그룹이 수정되었습니다.");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("pricing_rule_groups").insert({
          profile_id: groupForm.profile_id || null,
          name: groupForm.name,
          description: groupForm.description || null,
          season_type: groupForm.season_type,
          created_by: user?.id,
        });
        if (error) throw error;
        toast.success("그룹이 생성되었습니다.");
      }
      setGroupDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("그룹 저장 오류:", error);
      toast.error("그룹 저장에 실패했습니다.");
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase.from("pricing_rule_groups").delete().eq("id", groupId);
      if (error) throw error;
      toast.success("그룹이 삭제되었습니다.");
      fetchData();
    } catch (error) {
      console.error("그룹 삭제 오류:", error);
      toast.error("그룹 삭제에 실패했습니다.");
    }
  };

  // Rule CRUD
  const openRuleDialog = (groupId: string, rule?: PricingRule) => {
    setCurrentGroupId(groupId);
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        name: rule.name,
        rule_type: rule.rule_type,
        months: rule.months || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        weekdays: rule.weekdays || [0, 1, 2, 3, 4, 5, 6],
        start_time: rule.start_time || "",
        end_time: rule.end_time || "",
        min_guests: rule.min_guests || 1,
        max_guests: rule.max_guests?.toString() || "",
        price: rule.price,
        is_percentage: rule.is_percentage,
        priority: rule.priority,
      });
    } else {
      setEditingRule(null);
      setRuleForm({
        name: "",
        rule_type: "base",
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        start_time: "",
        end_time: "",
        min_guests: 1,
        max_guests: "",
        price: 0,
        is_percentage: false,
        priority: 0,
      });
    }
    setRuleDialogOpen(true);
  };

  const saveRule = async () => {
    if (!ruleForm.name || !currentGroupId) {
      toast.error("규칙명을 입력해주세요.");
      return;
    }

    try {
      const ruleData = {
        group_id: currentGroupId,
        name: ruleForm.name,
        rule_type: ruleForm.rule_type,
        months: ruleForm.months,
        weekdays: ruleForm.weekdays,
        start_time: ruleForm.start_time || null,
        end_time: ruleForm.end_time || null,
        min_guests: ruleForm.min_guests,
        max_guests: ruleForm.max_guests ? parseInt(ruleForm.max_guests) : null,
        price: ruleForm.price,
        is_percentage: ruleForm.is_percentage,
        priority: ruleForm.priority,
      };

      if (editingRule) {
        const { error } = await supabase
          .from("pricing_rules")
          .update(ruleData)
          .eq("id", editingRule.id);
        if (error) throw error;
        toast.success("규칙이 수정되었습니다.");
      } else {
        const { error } = await supabase.from("pricing_rules").insert(ruleData);
        if (error) throw error;
        toast.success("규칙이 생성되었습니다.");
      }
      setRuleDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("규칙 저장 오류:", error);
      toast.error("규칙 저장에 실패했습니다.");
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase.from("pricing_rules").delete().eq("id", ruleId);
      if (error) throw error;
      toast.success("규칙이 삭제되었습니다.");
      fetchData();
    } catch (error) {
      console.error("규칙 삭제 오류:", error);
      toast.error("규칙 삭제에 실패했습니다.");
    }
  };

  const toggleMonth = (month: number) => {
    if (ruleForm.months.includes(month)) {
      setRuleForm({ ...ruleForm, months: ruleForm.months.filter((m) => m !== month) });
    } else {
      setRuleForm({ ...ruleForm, months: [...ruleForm.months, month].sort((a, b) => a - b) });
    }
  };

  const toggleWeekday = (day: number) => {
    if (ruleForm.weekdays.includes(day)) {
      setRuleForm({ ...ruleForm, weekdays: ruleForm.weekdays.filter((d) => d !== day) });
    } else {
      setRuleForm({ ...ruleForm, weekdays: [...ruleForm.weekdays, day].sort((a, b) => a - b) });
    }
  };

  return (
    <DashboardLayout currentPage="제휴업체 가격관리">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">제휴업체 가격관리</h1>
            <p className="text-muted-foreground">지점별 요금 규칙을 관리합니다.</p>
          </div>
          <Button onClick={() => openGroupDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            새 요금 그룹
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              등록된 요금 그룹이 없습니다. 새 요금 그룹을 추가해주세요.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => toggleGroup(group.id)}
                    >
                      {expandedGroups.has(group.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge variant="outline">
                        {SEASON_TYPES.find((s) => s.value === group.season_type)?.label || "일반"}
                      </Badge>
                      {group.profiles && (
                        <Badge variant="secondary">
                          {group.profiles.company_name || group.profiles.full_name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openGroupDialog(group)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>그룹을 삭제하시겠습니까?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{group.name}" 그룹과 하위 규칙이 모두 삭제됩니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteGroup(group.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-sm text-muted-foreground ml-7">{group.description}</p>
                  )}
                </CardHeader>

                {expandedGroups.has(group.id) && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-sm">요금 규칙</span>
                        <Button variant="outline" size="sm" onClick={() => openRuleDialog(group.id)}>
                          <Plus className="mr-1 h-3 w-3" />
                          규칙 추가
                        </Button>
                      </div>

                      {(!rules[group.id] || rules[group.id].length === 0) ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          등록된 규칙이 없습니다.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {rules[group.id].map((rule) => (
                            <div
                              key={rule.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{rule.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {RULE_TYPES.find((t) => t.value === rule.rule_type)?.label}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {rule.price.toLocaleString()}
                                    {rule.is_percentage ? "%" : "원"}
                                  </span>
                                  {rule.start_time && rule.end_time && (
                                    <span>
                                      {rule.start_time} ~ {rule.end_time}
                                    </span>
                                  )}
                                  {rule.weekdays && rule.weekdays.length < 7 && (
                                    <span>
                                      {rule.weekdays.map((d) => WEEKDAY_LABELS[d]).join(", ")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openRuleDialog(group.id, rule)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>규칙을 삭제하시겠습니까?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        "{rule.name}" 규칙이 삭제됩니다.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>취소</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteRule(rule.id)}
                                        className="bg-destructive text-destructive-foreground"
                                      >
                                        삭제
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Group Dialog */}
        <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGroup ? "요금 그룹 수정" : "새 요금 그룹"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>제휴업체 (선택)</Label>
                <Select
                  value={groupForm.profile_id}
                  onValueChange={(v) => setGroupForm({ ...groupForm, profile_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="제휴업체 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">선택 안함</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.company_name || p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>그룹명 *</Label>
                <Input
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="예: 강남점 주말 요금"
                />
              </div>
              <div>
                <Label>설명</Label>
                <Input
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="요금 그룹에 대한 설명"
                />
              </div>
              <div>
                <Label>시즌 타입</Label>
                <Select
                  value={groupForm.season_type}
                  onValueChange={(v) => setGroupForm({ ...groupForm, season_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEASON_TYPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={saveGroup} className="w-full">
                {editingGroup ? "수정" : "생성"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rule Dialog */}
        <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRule ? "요금 규칙 수정" : "새 요금 규칙"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>규칙명 *</Label>
                <Input
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="예: 평일 오전 요금"
                />
              </div>
              <div>
                <Label>규칙 타입</Label>
                <Select
                  value={ruleForm.rule_type}
                  onValueChange={(v) => setRuleForm({ ...ruleForm, rule_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>적용 요일</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {WEEKDAY_LABELS.map((label, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-1 rounded-md cursor-pointer border text-sm ${
                        ruleForm.weekdays.includes(idx)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                      onClick={() => toggleWeekday(idx)}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>적용 월</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {MONTH_LABELS.map((label, idx) => (
                    <div
                      key={idx}
                      className={`px-2 py-1 rounded-md cursor-pointer border text-xs ${
                        ruleForm.months.includes(idx + 1)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                      onClick={() => toggleMonth(idx + 1)}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>시작 시간</Label>
                  <Input
                    type="time"
                    value={ruleForm.start_time}
                    onChange={(e) => setRuleForm({ ...ruleForm, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>종료 시간</Label>
                  <Input
                    type="time"
                    value={ruleForm.end_time}
                    onChange={(e) => setRuleForm({ ...ruleForm, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>최소 인원</Label>
                  <Input
                    type="number"
                    value={ruleForm.min_guests}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, min_guests: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div>
                  <Label>최대 인원 (미입력시 무제한)</Label>
                  <Input
                    type="number"
                    value={ruleForm.max_guests}
                    onChange={(e) => setRuleForm({ ...ruleForm, max_guests: e.target.value })}
                    placeholder="무제한"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>금액</Label>
                  <Input
                    type="number"
                    value={ruleForm.price}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, price: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Checkbox
                    id="is_percentage"
                    checked={ruleForm.is_percentage}
                    onCheckedChange={(checked) =>
                      setRuleForm({ ...ruleForm, is_percentage: !!checked })
                    }
                  />
                  <Label htmlFor="is_percentage">퍼센트(%)</Label>
                </div>
              </div>

              <div>
                <Label>우선순위 (높을수록 먼저 적용)</Label>
                <Input
                  type="number"
                  value={ruleForm.priority}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <Button onClick={saveRule} className="w-full">
                {editingRule ? "수정" : "생성"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PricingManage;
