import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Guide = () => {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
    fetchUserRole();
  }, []);

  const isPartner = userRole === "PARTNER";

  return (
    <DashboardLayout currentPage="/guide">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">사용 가이드</h1>
          <p className="text-muted-foreground mt-2">
            {isPartner 
              ? "모드라운지 파트너 시스템 사용 방법을 안내합니다."
              : "모드라운지 ADMIN 시스템 사용 방법을 안내합니다."}
          </p>
        </div>

        {/* 역할별 기능 안내 */}
        {isPartner ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">PARTNER</Badge>
                파트너 기능 안내
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• 대시보드 - 오더 현황 및 통계 확인</p>
              <p>• 오더 수락 - 새로운 오더 확인 및 수락/거절</p>
              <p>• 오더 관리 - 진행 중인 오더 관리 및 완료 처리</p>
              <p>• 일정 보기 - 예약된 일정 캘린더 확인</p>
              <p>• 정산 현황 - 본인 정산 내역 확인</p>
              <p>• 프로필 관리 - 내 정보 수정</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge>STAFF</Badge>
                내부직원 기능 안내
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="font-semibold text-primary">📋 업무 도구</p>
                  <p>• 공간검색하기 - 파트너 공간 검색</p>
                  <p>• 대관료계산기 - 대관료 자동 계산</p>
                  <p>• 견적서 작성하기 - 견적서 생성/발송</p>
                  <p>• 전자서명관리 - 계약서 생성 및 관리</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-primary">📦 오더 관리</p>
                  <p>• 오더 요청 - 제휴업체에 오더 요청</p>
                  <p>• 오더 전체보기 - 모든 오더 현황 조회/확정</p>
                  <p>• 일정 보기 - 전체 예약 일정 캘린더</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-primary">💰 정산 및 관리</p>
                  <p>• 정산 관리 - 제휴업체 정산 처리</p>
                  <p>• 제휴업체 응답률관리 - 업체별 응답률/통계</p>
                  <p>• 제휴업체 가격관리 - 업체별 가격 설정</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-primary">⚙️ 시스템</p>
                  <p>• 사용자 관리 - 사용자 등록/수정/삭제</p>
                  <p>• 시스템 설정 - 시스템 환경 설정</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-primary">🔗 외부 연동</p>
                  <p>• 아임웹 로그인 - 아임웹 관리자 빠른 접속</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 상세 가이드 */}
        <Card>
          <CardHeader>
            <CardTitle>상세 사용 가이드</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {/* ========== 파트너용 가이드 ========== */}
              {isPartner && (
                <AccordionItem value="order-accept">
                  <AccordionTrigger className="text-left">
                    📥 오더 수락 방법
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <p className="font-semibold mb-2">💡 오더 수락 프로세스</p>
                      <p>새로운 오더가 들어오면 "오더 수락" 메뉴에서 확인할 수 있습니다.</p>
                    </div>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>좌측 메뉴에서 <strong>"오더 수락"</strong> 클릭</li>
                      <li>새로운 오더 목록에서 상세 정보 확인
                        <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                          <li>고객명, 서비스 유형, 일정, 장소, 금액</li>
                        </ul>
                      </li>
                      <li>오더 내용 확인 후 <strong>"수락"</strong> 또는 <strong>"거절"</strong> 버튼 클릭</li>
                    </ol>
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ 오더 수락 후에는 관리자 확정을 기다려주세요. 확정 시 캘린더에 일정이 자동 등록됩니다.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {isPartner && (
                <AccordionItem value="order-manage">
                  <AccordionTrigger className="text-left">
                    📋 오더 관리 및 완료 처리
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">오더 상태 흐름</h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="bg-yellow-100">요청됨</Badge>
                        <span>→</span>
                        <Badge variant="outline" className="bg-blue-100">수락됨</Badge>
                        <span>→</span>
                        <Badge variant="outline" className="bg-purple-100">확정됨</Badge>
                        <span>→</span>
                        <Badge variant="outline" className="bg-green-100">완료됨</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">완료 처리 방법</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>"오더 관리" 메뉴에서 <strong>확정됨</strong> 상태의 오더 확인</li>
                        <li><strong>"완료 처리하기"</strong> 버튼 클릭</li>
                        <li><strong>완료일자</strong> 입력 (필수)</li>
                        <li><strong>파일 첨부</strong> - 서비스 완료 사진 등록 (필수, 1개 이상)</li>
                        <li>현장 이슈 메모 입력 (선택)</li>
                        <li><strong>"완료 처리"</strong> 버튼 클릭</li>
                      </ol>
                    </div>
                    <div className="bg-destructive/10 p-3 rounded-lg">
                      <p className="text-sm text-destructive">
                        ⚠️ 완료일자와 첨부파일은 필수입니다. 파일 없이는 완료 처리가 불가능합니다.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {isPartner && (
                <AccordionItem value="partner-settlements">
                  <AccordionTrigger className="text-left">
                    💰 정산 현황 확인
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>완료된 오더에 대한 정산 내역을 확인할 수 있습니다.</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>좌측 메뉴에서 "정산 현황" 클릭</li>
                      <li>정산 예정 / 정산 완료 내역 확인</li>
                      <li>월별 정산 금액 조회 가능</li>
                    </ol>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">
                        💡 정산은 관리자가 처리하며, 완료 시 알림을 받게 됩니다.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {isPartner && (
                <AccordionItem value="partner-memo">
                  <AccordionTrigger className="text-left">
                    📝 파트너 메모 기능
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>각 오더별로 메모를 남길 수 있습니다.</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>오더 관리에서 해당 오더의 "파트너 메모" 버튼 클릭</li>
                      <li>메모 내용 입력 후 저장</li>
                      <li>저장된 메모는 본인만 확인 가능</li>
                    </ol>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">
                        💡 고객 특이사항, 현장 메모 등을 기록해두세요.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {isPartner && (
                <AccordionItem value="cs-inquiry">
                  <AccordionTrigger className="text-left">
                    💬 C/S 문의방법
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>문의사항이 있을 경우 아래 방법으로 연락해주세요.</p>
                    <div className="space-y-2">
                      <h4 className="font-semibold">1. 채널톡 채팅상담</h4>
                      <p className="text-muted-foreground">
                        화면 우측 하단의 <strong>채널톡 채팅상담 아이콘</strong>을 클릭하여 실시간 상담이 가능합니다.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">2. 오더별 문의</h4>
                      <p className="text-muted-foreground">
                        "오더 관리" 메뉴에서 각 오더 하단의 <strong>"이 오더 문의"</strong> 버튼을 클릭하면 해당 오더에 대해 바로 문의할 수 있습니다.
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">
                        💡 오더 관련 문의는 "이 오더 문의" 버튼을 이용하시면 담당자가 빠르게 확인할 수 있습니다.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ========== STAFF용 가이드 ========== */}
              {!isPartner && (
                <AccordionItem value="space-finder">
                  <AccordionTrigger className="text-left">
                    🔍 공간검색하기
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>고객 요청에 맞는 파트너 공간을 검색합니다.</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>좌측 메뉴에서 "공간검색하기" 클릭</li>
                      <li>지역, 서비스 유형 등 조건 설정</li>
                      <li>검색 결과에서 적합한 공간 선택</li>
                      <li>선택한 공간으로 오더 요청 진행</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              )}

              {!isPartner && (
                <AccordionItem value="fee-calculator">
                  <AccordionTrigger className="text-left">
                    🧮 대관료계산기
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>대관료를 자동으로 계산합니다.</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>좌측 메뉴에서 "대관료계산기" 클릭</li>
                      <li>공간, 날짜, 시간, 인원수 입력</li>
                      <li>시즌/요일별 가격 자동 적용</li>
                      <li>부가세, 청소비 등 추가 비용 포함된 총액 확인</li>
                    </ol>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">
                        💡 제휴업체 가격관리에서 설정한 가격 정책이 자동 적용됩니다.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {!isPartner && (
                <AccordionItem value="quote">
                  <AccordionTrigger className="text-left">
                    📄 견적서 작성하기
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>고객에게 발송할 견적서를 작성합니다.</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>좌측 메뉴에서 "견적서 작성하기" 클릭</li>
                      <li>고객 정보, 예약 정보 입력</li>
                      <li>항목별 금액 입력</li>
                      <li>견적서 미리보기 확인</li>
                      <li>PDF 저장 또는 이미지로 저장</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              )}

              {!isPartner && (
                <AccordionItem value="contracts">
                  <AccordionTrigger className="text-left">
                    ✍️ 전자서명관리
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>고객에게 전자서명 계약서를 발송합니다.</p>
                    <div className="space-y-2">
                      <h4 className="font-semibold">템플릿 관리</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>"템플릿 관리" 버튼 클릭</li>
                        <li>새 템플릿 생성 또는 기존 템플릿 수정</li>
                        <li>가격, 약관, 환불정책 등 설정</li>
                      </ol>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">계약서 생성</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>"새 계약서 작성" 버튼 클릭</li>
                        <li>템플릿 선택 후 예약 정보 입력</li>
                        <li>생성된 링크를 고객에게 전달</li>
                        <li>고객 서명 완료 시 계약서 확인 가능</li>
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {!isPartner && (
                <AccordionItem value="orders">
                  <AccordionTrigger className="text-left">
                    📋 오더 요청 및 관리
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">오더 상태 흐름</h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">요청됨</Badge>
                        <span>→</span>
                        <Badge variant="outline">수락됨</Badge>
                        <span>→</span>
                        <Badge variant="outline">확정됨</Badge>
                        <span>→</span>
                        <Badge variant="outline">완료됨</Badge>
                        <span>→</span>
                        <Badge variant="outline">정산완료</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">오더 요청</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>"오더 요청" 메뉴에서 제휴업체 선택</li>
                        <li>고객 정보, 서비스 유형, 일정, 금액 입력</li>
                        <li>"오더 요청" 버튼 클릭</li>
                        <li>제휴업체에 알림 발송됨</li>
                      </ol>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">오더 전체보기</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>모든 오더 현황 조회</li>
                        <li>상태별 필터링 (요청됨/수락됨/확정됨/완료됨)</li>
                        <li>제휴업체가 수락한 오더 "확정" 처리 (캘린더 일정 자동 등록)</li>
                        <li>첨부파일 확인 및 관리</li>
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {!isPartner && (
                <AccordionItem value="settlements">
                  <AccordionTrigger className="text-left">
                    💰 정산 관리
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>완료된 오더에 대해 정산을 처리합니다.</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>"정산 관리" 메뉴에서 완료된 오더 확인</li>
                      <li>정산 금액 확인 (수수료 자동 계산)</li>
                      <li>정산일 선택 후 "정산 확정" 버튼 클릭</li>
                      <li>제휴업체에 정산 완료 알림 발송</li>
                    </ol>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">
                        💡 제휴업체별 수수료율은 사용자 관리에서 설정합니다.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {!isPartner && (
                <AccordionItem value="partners">
                  <AccordionTrigger className="text-left">
                    📊 제휴업체 응답률관리
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>제휴업체별 응답률과 통계를 확인합니다.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>업체별 응답률, 평균 응답시간 확인</li>
                      <li>총 요청/수락/거절/완료 오더 수 확인</li>
                      <li>지역별, 서비스별 필터링</li>
                      <li>응답률 높은 순서로 정렬</li>
                      <li>업체명, 담당자명, 이메일로 검색</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}

              {!isPartner && (
                <AccordionItem value="pricing">
                  <AccordionTrigger className="text-left">
                    💵 제휴업체 가격관리
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>제휴업체별 대관료 가격 정책을 설정합니다.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>기본 가격, 인원 추가 가격 설정</li>
                      <li>시즌별 가격 (성수기/비수기) 설정</li>
                      <li>요일별 가격 (평일/주말) 설정</li>
                      <li>시간대별 가격 설정</li>
                    </ul>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">
                        💡 설정한 가격 정책은 대관료계산기에 자동 적용됩니다.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {!isPartner && (
                <AccordionItem value="users">
                  <AccordionTrigger className="text-left">
                    👥 사용자 관리
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>시스템 사용자(내부직원/제휴업체)를 관리합니다.</p>
                    <div className="space-y-2">
                      <h4 className="font-semibold">사용자 등록</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>"사용자 등록" 버튼 클릭</li>
                        <li>이메일, 이름, 역할(STAFF/PARTNER) 선택</li>
                        <li>제휴업체인 경우: 업체명, 서비스유형, 지역, 수수료율 입력</li>
                      </ol>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">설정 항목</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>수수료율</strong> - 정산 시 적용할 수수료 비율</li>
                        <li><strong>서비스 지역</strong> - 담당 지역 설정</li>
                        <li><strong>서비스 유형</strong> - 제공 서비스 종류</li>
                      </ul>
                    </div>
                </AccordionContent>
              </AccordionItem>
              )}

              {!isPartner && (
                <AccordionItem value="imweb-login">
                  <AccordionTrigger className="text-left">
                    🔗 아임웹 로그인
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm">
                    <p>아임웹 관리자 페이지에 빠르게 로그인합니다.</p>
                    <div className="space-y-2">
                      <h4 className="font-semibold">사용 방법</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>좌측 메뉴에서 "아임웹 로그인" 클릭</li>
                        <li>페이지 접속 시 아임웹 로그인 페이지로 자동 이동</li>
                        <li>저장된 계정 정보로 자동 로그인 진행</li>
                      </ol>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <p className="text-sm">
                        💡 아임웹 관리자 페이지에서 예약, 상품, 고객 관리 등을 수행할 수 있습니다.
                      </p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ 로그인 정보가 변경된 경우 담당자에게 문의해주세요.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ========== 공통 가이드 ========== */}
              <AccordionItem value="calendar">
                <AccordionTrigger className="text-left">
                  📅 일정 보기 사용법
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>캘린더에서 예약된 일정을 확인할 수 있습니다.</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>날짜 클릭 시 해당 날짜의 일정 목록 표시</li>
                    <li>오더와 연동된 일정 자동 표시</li>
                    <li>색상으로 일정 유형 구분</li>
                  </ul>
                  {isPartner && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">
                        💡 관리자가 오더 확정 시 자동으로 캘린더에 일정이 등록됩니다.
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* 문의 안내 */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              추가 문의사항은 담당자에게 문의해주세요.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Guide;
