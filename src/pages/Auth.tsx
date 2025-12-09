import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.jpg";

type AuthMode = "login" | "signup";
type UserRole = "STAFF" | "PARTNER";

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

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("PARTNER");
  const [serviceType, setServiceType] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<Array<{sido: string, gugun: string}>>([]);
  const [sido, setSido] = useState("");
  const [gugun, setGugun] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [loading, setLoading] = useState(false);

  // 시도 변경 시 군구 초기화
  const handleSidoChange = (value: string) => {
    setSido(value);
    setGugun("");
  };

  // 지역 추가
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

  // 지역 삭제
  const handleRemoveRegion = (index: number) => {
    setSelectedRegions(selectedRegions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 비밀번호 확인 검증
    if (mode === "signup" && password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              company_name: companyName,
              phone,
              role,
              service_type: serviceType || null,
              service_regions: selectedRegions,
              business_registration_number: businessNumber || null,
              representative_name: representativeName || null,
            },
          },
        });

        if (error) throw error;
        toast.success("회원가입이 완료되었습니다!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("로그인 성공!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="absolute left-2 top-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex justify-center">
            <img src={logo} alt="모드라운지 로고" className="h-16 w-16 rounded-full" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">모드라운지 ADMIN</CardTitle>
            <CardDescription>
              {mode === "login" ? "관리자 계정으로 로그인하세요" : "새 계정을 만들어주세요"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="role">역할</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PARTNER" id="partner" />
                      <Label htmlFor="partner" className="cursor-pointer">제휴업체</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="STAFF" id="staff" />
                      <Label htmlFor="staff" className="cursor-pointer">내부직원</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">이름</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="홍길동"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {role === "PARTNER" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">업체명 *</Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="업체명을 입력하세요"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="representativeName">대표자명 *</Label>
                      <Input
                        id="representativeName"
                        type="text"
                        placeholder="대표자명을 입력하세요"
                        value={representativeName}
                        onChange={(e) => setRepresentativeName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessNumber">사업자등록번호 *</Label>
                      <Input
                        id="businessNumber"
                        type="text"
                        placeholder="123-45-67890"
                        value={businessNumber}
                        onChange={(e) => setBusinessNumber(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceType">서비스 종류 *</Label>
                      <Select value={serviceType} onValueChange={setServiceType} required>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="서비스 종류를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
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
                        <Select value={sido} onValueChange={handleSidoChange}>
                          <SelectTrigger className="bg-background flex-1">
                            <SelectValue placeholder="시/도 선택" />
                          </SelectTrigger>
                          <SelectContent className="bg-background max-h-60">
                            {Object.keys(KOREA_REGIONS).map((region) => (
                              <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {sido && (
                          <Select value={gugun} onValueChange={setGugun}>
                            <SelectTrigger className="bg-background flex-1">
                              <SelectValue placeholder="군/구 선택" />
                            </SelectTrigger>
                            <SelectContent className="bg-background max-h-60">
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
                          최소 1개 이상의 서비스 지역을 선택한 뒤 지역추가를 눌러주세요
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phone">연락처</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">이메일 주소</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 (영문, 숫자 포함 6글자 이상)</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={6}
                />
                {passwordConfirm && password !== passwordConfirm && (
                  <p className="text-sm text-destructive">비밀번호가 일치하지 않습니다</p>
                )}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-primary" 
              disabled={loading || (mode === "signup" && role === "PARTNER" && selectedRegions.length === 0)}
            >
              {loading ? "처리중..." : mode === "login" ? "로그인" : "회원가입"}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary hover:underline"
              >
                {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
