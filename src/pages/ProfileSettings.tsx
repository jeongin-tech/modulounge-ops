import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, CheckCircle } from "lucide-react";

const ProfileSettings = () => {
  const [step, setStep] = useState<"initial" | "verify" | "change">("initial");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 인증 이메일 발송
  const handleSendVerificationEmail = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("사용자 이메일을 찾을 수 없습니다.");
        return;
      }

      setEmail(user.email);

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/profile`,
      });

      if (error) throw error;

      toast.success("인증 이메일이 발송되었습니다. 이메일을 확인해주세요.");
      setStep("verify");
    } catch (error: any) {
      toast.error(error.message || "이메일 발송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 변경
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("비밀번호가 성공적으로 변경되었습니다.");
      setStep("initial");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // URL에서 recovery 토큰 확인 (이메일 링크 클릭 시)
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    
    if (type === "recovery") {
      setStep("change");
    }
  }, []);

  return (
    <DashboardLayout currentPage="/profile">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            프로필 관리
          </h1>
          <p className="text-muted-foreground mt-2">비밀번호를 변경할 수 있습니다</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              비밀번호 변경
            </CardTitle>
            <CardDescription>
              비밀번호 변경을 위해 이메일 인증이 필요합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === "initial" && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium">이메일 인증 필요</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        비밀번호를 변경하려면 등록된 이메일로 인증 링크를 받아야 합니다.
                        아래 버튼을 클릭하면 인증 이메일이 발송됩니다.
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleSendVerificationEmail} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "발송 중..." : "인증 이메일 발송"}
                </Button>
              </div>
            )}

            {step === "verify" && (
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium">이메일이 발송되었습니다</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>{email}</strong>로 인증 이메일을 발송했습니다.
                        이메일의 링크를 클릭하면 비밀번호를 변경할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep("initial")}
                  >
                    다시 시도
                  </Button>
                </div>
              </div>
            )}

            {step === "change" && (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-green-500" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">인증 완료</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        이메일 인증이 완료되었습니다. 새 비밀번호를 입력해주세요.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호 입력"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 다시 입력"
                  />
                </div>

                <Button 
                  onClick={handleChangePassword} 
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {loading ? "변경 중..." : "비밀번호 변경"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfileSettings;