import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

// 대한민국 시도/군구 데이터
const KOREA_REGIONS = {
  "서울특별시": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
  "부산광역시": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
  "대구광역시": ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"],
  "인천광역시": ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
  "광주광역시": ["광산구", "남구", "동구", "북구", "서구"],
  "대전광역시": ["대덕구", "동구", "서구", "유성구", "중구"],
  "울산광역시": ["남구", "동구", "북구", "울주군", "중구"],
  "세종특별자치시": ["세종특별자치시"],
  "경기도": ["가평군", "고양시", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시", "수원시", "시흥시", "안산시", "안성시", "안양시", "양주시", "양평군", "여주시", "연천군", "오산시", "용인시", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"],
  "강원특별자치도": ["강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"],
  "충청북도": ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시", "충주시"],
  "충청남도": ["계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군", "서산시", "서천군", "아산시", "예산군", "천안시", "청양군", "태안군", "홍성군"],
  "전북특별자치도": ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군", "장수군", "전주시", "정읍시", "진안군"],
  "전라남도": ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
  "경상북도": ["경산시", "경주시", "고령군", "구미시", "군위군", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시"],
  "경상남도": ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시", "통영시", "하동군", "함안군", "함양군", "합천군"],
  "제주특별자치도": ["서귀포시", "제주시"]
};

interface User {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
  phone: string | null;
  role: "STAFF" | "PARTNER";
  service_type: string | null;
  service_regions: Array<{sido: string, gugun: string}>;
  business_registration_number: string | null;
  representative_name: string | null;
  commission_rate: number | null;
  created_at: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    company_name: "",
    phone: "",
    role: "PARTNER" as "STAFF" | "PARTNER",
    service_type: "",
    business_number: "",
    representative_name: "",
    commission_rate: "",
  });
  
  const [selectedRegions, setSelectedRegions] = useState<Array<{sido: string, gugun: string}>>([]);
  const [sido, setSido] = useState("");
  const [gugun, setGugun] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Parse service_regions from JSON
      const parsedData = data?.map(user => ({
        ...user,
        service_regions: Array.isArray(user.service_regions) 
          ? user.service_regions 
          : JSON.parse((user.service_regions as any) || '[]')
      }));
      
      setUsers(parsedData || []);
    } catch (error: any) {
      toast.error("사용자 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRegion = () => {
    if (sido && gugun) {
      const isDuplicate = selectedRegions.some(
        r => r.sido === sido && r.gugun === gugun
      );
      if (!isDuplicate) {
        setSelectedRegions([...selectedRegions, { sido, gugun }]);
      }
      setSido("");
      setGugun("");
    }
  };

  const handleRemoveRegion = (index: number) => {
    setSelectedRegions(selectedRegions.filter((_, i) => i !== index));
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: "",
        full_name: user.full_name,
        company_name: user.company_name || "",
        phone: user.phone || "",
        role: user.role,
        service_type: user.service_type || "",
        business_number: user.business_registration_number || "",
        representative_name: user.representative_name || "",
        commission_rate: user.commission_rate?.toString() || "",
      });
      setSelectedRegions(user.service_regions || []);
      setSido("");
      setGugun("");
    } else {
      setEditingUser(null);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        company_name: "",
        phone: "",
        role: "PARTNER",
        service_type: "",
        business_number: "",
        representative_name: "",
        commission_rate: "",
      });
      setSelectedRegions([]);
      setSido("");
      setGugun("");
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // 프로필 업데이트
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            company_name: formData.company_name || null,
            phone: formData.phone || null,
            service_type: formData.service_type || null,
            service_regions: selectedRegions,
            business_registration_number: formData.business_number || null,
            representative_name: formData.representative_name || null,
            commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) : null,
          })
          .eq("id", editingUser.id);

        if (error) throw error;
        toast.success("사용자 정보가 수정되었습니다.");
      } else {
        // 새 사용자 생성
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: formData.full_name,
              company_name: formData.company_name,
              phone: formData.phone,
              role: formData.role,
              service_type: formData.service_type || null,
              service_regions: JSON.stringify(selectedRegions),
              business_registration_number: formData.business_number || null,
              representative_name: formData.representative_name || null,
            },
          },
        });

        if (signUpError) throw signUpError;
        toast.success("새 사용자가 추가되었습니다.");
      }

      setDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "작업에 실패했습니다.");
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      // Supabase Auth에서 사용자 삭제는 admin API 필요
      // 대신 profiles 테이블에서 삭제 (cascade로 연결된 데이터도 삭제됨)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
      
      toast.success("사용자가 삭제되었습니다.");
      fetchUsers();
    } catch (error: any) {
      toast.error("사용자 삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="/users">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩중...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/users">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              사용자 관리
            </h1>
            <p className="text-muted-foreground mt-2">
              모든 사용자 계정을 관리합니다
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                새 사용자 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "사용자 수정" : "새 사용자 추가"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser ? "사용자 정보를 수정합니다" : "새로운 사용자를 추가합니다"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingUser && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">이메일 *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">비밀번호 *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="role">역할 *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData({ ...formData, role: value as "STAFF" | "PARTNER" })}
                    disabled={!!editingUser}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PARTNER">제휴업체</SelectItem>
                      <SelectItem value="STAFF">내부직원</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="full_name">이름 *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                
                {formData.role === "PARTNER" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="company_name">업체명 *</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="representative_name">대표자명 *</Label>
                      <Input
                        id="representative_name"
                        value={formData.representative_name}
                        onChange={(e) => setFormData({ ...formData, representative_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_number">사업자등록번호 *</Label>
                      <Input
                        id="business_number"
                        value={formData.business_number}
                        onChange={(e) => setFormData({ ...formData, business_number: e.target.value })}
                        placeholder="123-45-67890"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="service_type">서비스 종류 *</Label>
                      <Select 
                        value={formData.service_type} 
                        onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="케이터링">케이터링</SelectItem>
                          <SelectItem value="뷔페서비스">뷔페서비스</SelectItem>
                          <SelectItem value="청소서비스">청소서비스</SelectItem>
                          <SelectItem value="MC">MC</SelectItem>
                          <SelectItem value="사진촬영">사진촬영</SelectItem>
                          <SelectItem value="파티룸">파티룸</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>서비스 지역 (중복 선택 가능) *</Label>
                      
                      <div className="flex gap-2">
                        <Select value={sido} onValueChange={(value) => { setSido(value); setGugun(""); }}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="시/도 선택" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {Object.keys(KOREA_REGIONS).map((region) => (
                              <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {sido && (
                          <Select value={gugun} onValueChange={setGugun}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="군/구 선택" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              <SelectItem value="전체">전체</SelectItem>
                              {KOREA_REGIONS[sido as keyof typeof KOREA_REGIONS]?.map((gu) => (
                                <SelectItem key={gu} value={gu}>{gu}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {sido && gugun && (
                        <Button
                          type="button"
                          onClick={handleAddRegion}
                          variant="outline"
                          className="w-full"
                        >
                          지역 추가
                        </Button>
                      )}

                      {selectedRegions.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30">
                          {selectedRegions.map((region, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleRemoveRegion(index)}
                              className="group flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-destructive/10 text-sm rounded-full transition-colors"
                            >
                              <span className="group-hover:line-through">
                                {region.sido} {region.gugun}
                              </span>
                              <span className="text-muted-foreground group-hover:text-destructive transition-colors">
                                ✕
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedRegions.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          최소 1개 이상의 서비스 지역을 선택해주세요
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commission_rate">수수료율 (%)</Label>
                      <Input
                        id="commission_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.commission_rate}
                        onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                        placeholder="예: 15"
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="phone">연락처</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    취소
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    {editingUser ? "수정" : "추가"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>전체 사용자 ({users.length}명)</CardTitle>
            <CardDescription>등록된 모든 사용자 목록</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이메일</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>업체명</TableHead>
                  <TableHead>서비스</TableHead>
                  <TableHead>지역</TableHead>
                  <TableHead>수수료율</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      등록된 사용자가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "STAFF" ? "default" : "secondary"}>
                          {user.role === "STAFF" ? "내부직원" : "제휴업체"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.company_name || "-"}</TableCell>
                      <TableCell>{user.service_type || "-"}</TableCell>
                      <TableCell>
                        {user.service_regions && user.service_regions.length > 0
                          ? user.service_regions.map(r => `${r.sido} ${r.gugun}`).join(", ")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {user.commission_rate ? `${user.commission_rate}%` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>사용자 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(user.id)}>
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Users;
