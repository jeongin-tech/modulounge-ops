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
import logo from "@/assets/logo.jpg";

type AuthMode = "login" | "signup";
type UserRole = "STAFF" | "PARTNER";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("PARTNER");
  const [serviceType, setServiceType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <CardHeader className="space-y-4 text-center">
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
                      <Label htmlFor="companyName">업체명</Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="업체명을 입력하세요"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
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
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
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
