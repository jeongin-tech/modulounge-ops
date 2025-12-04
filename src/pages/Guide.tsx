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
  return (
    <DashboardLayout currentPage="/guide">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">사용 가이드</h1>
          <p className="text-muted-foreground mt-2">
            모드라운지 ADMIN 시스템 사용 방법을 안내합니다.
          </p>
        </div>

        {/* 역할별 기능 안내 */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge>STAFF</Badge>
                내부직원 기능
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• 오더 요청 - 제휴업체에 새로운 오더 요청</p>
              <p>• 오더 전체보기 - 모든 오더 현황 조회</p>
              <p>• 정산 관리 - 제휴업체 정산 처리</p>
              <p>• 제휴업체 응답률관리 - 업체별 현황 확인</p>
              <p>• 사용자 관리 - 사용자 등록/수정/삭제</p>
              <p>• 전자서명관리 - 계약서 생성 및 관리</p>
              <p>• 견적서 작성 - 견적서 생성</p>
              <p>• 공간검색 - 공간 검색 도구</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">PARTNER</Badge>
                제휴업체 기능
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• 오더 수락 - 새로운 오더 확인 및 수락</p>
              <p>• 오더 관리 - 진행 중인 오더 관리</p>
              <p>• 정산 현황 - 본인 정산 내역 확인</p>
              <p>• 일정 보기 - 예약된 일정 캘린더 확인</p>
              <p>• C/S - 내부직원과 메시지 소통</p>
            </CardContent>
          </Card>
        </div>

        {/* 상세 가이드 */}
        <Card>
          <CardHeader>
            <CardTitle>상세 사용 가이드</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {/* 슬랙 연동 가이드 */}
              <AccordionItem value="slack">
                <AccordionTrigger className="text-left">
                  🔗 슬랙(Slack) 연동 설정 방법
                </AccordionTrigger>
                <AccordionContent className="space-y-4 text-sm">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold text-destructive mb-2">⚠️ 중요</p>
                    <p>제휴업체와 메시지 소통을 위해서는 슬랙 연동이 필수입니다.</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">1. Slack App 생성</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>
                        <a 
                          href="https://api.slack.com/apps" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          Slack API 페이지
                        </a>
                        에 접속합니다.
                      </li>
                      <li>"Create New App" 클릭 → "From scratch" 선택</li>
                      <li>App 이름 입력 (예: 모드라운지봇) 후 워크스페이스 선택</li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">2. Bot Token Scopes 설정</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>좌측 메뉴에서 "OAuth & Permissions" 클릭</li>
                      <li>"Scopes" 섹션에서 "Bot Token Scopes" 찾기</li>
                      <li>
                        아래 권한들을 추가:
                        <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                          <li>chat:write - 메시지 전송</li>
                          <li>channels:read - 채널 정보 읽기</li>
                          <li>users:read - 사용자 정보 읽기</li>
                          <li>users:read.email - 사용자 이메일 읽기</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">3. Event Subscriptions 설정 (메시지 수신용)</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>좌측 메뉴에서 "Event Subscriptions" 클릭</li>
                      <li>"Enable Events" 토글 ON</li>
                      <li>
                        Request URL에 Edge Function URL 입력:
                        <code className="block bg-muted px-2 py-1 rounded mt-1 text-xs break-all">
                          https://hunwnggzidopjhovvika.supabase.co/functions/v1/slack-events
                        </code>
                      </li>
                      <li>
                        "Subscribe to bot events"에서 추가:
                        <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                          <li>message.channels - 채널 메시지 수신</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">4. App 설치 및 토큰 발급</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>"OAuth & Permissions"로 이동</li>
                      <li>"Install to Workspace" 클릭 후 허용</li>
                      <li>"Bot User OAuth Token" 복사 (xoxb-로 시작)</li>
                      <li>이 토큰을 시스템 설정에 저장</li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">5. 제휴업체별 채널 생성 및 연결</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>Slack에서 제휴업체별 채널 생성 (예: #partner-업체명)</li>
                      <li>생성한 채널에 봇 앱 초대 (/invite @봇이름)</li>
                      <li>
                        채널 ID 확인 방법:
                        <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                          <li>채널명 우클릭 → "채널 세부정보 보기"</li>
                          <li>하단에 채널 ID 표시 (C로 시작하는 영문숫자)</li>
                        </ul>
                      </li>
                      <li>
                        <span className="font-medium">사용자 관리</span>에서 해당 제휴업체의 
                        <span className="font-medium text-primary"> Slack 채널 ID</span> 입력
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">6. 내부직원 Slack User ID 설정</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>
                        Slack User ID 확인 방법:
                        <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                          <li>Slack에서 본인 프로필 클릭</li>
                          <li>"프로필 보기" 클릭</li>
                          <li>더보기(⋯) → "멤버 ID 복사"</li>
                        </ul>
                      </li>
                      <li>
                        <span className="font-medium">사용자 관리</span>에서 내부직원의 
                        <span className="font-medium text-primary"> Slack User ID</span> 입력
                      </li>
                    </ol>
                  </div>

                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="font-semibold mb-2">✅ 연동 완료 후</p>
                    <p>• ADMIN에서 메시지 전송 시 → 해당 업체 Slack 채널로 전달</p>
                    <p>• Slack 채널에서 답장 시 → ADMIN C/S 화면에 표시</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 오더 관리 가이드 */}
              <AccordionItem value="orders">
                <AccordionTrigger className="text-left">
                  📋 오더 관리 프로세스
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
                  <div>
                    <p className="font-semibold">STAFF:</p>
                    <p>오더 요청 → 제휴업체 선택 → 서비스 정보 입력 → 요청</p>
                  </div>
                  <div>
                    <p className="font-semibold">PARTNER:</p>
                    <p>오더 수락에서 확인 → 수락/거절 → 오더 관리에서 진행상황 업데이트</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 정산 가이드 */}
              <AccordionItem value="settlements">
                <AccordionTrigger className="text-left">
                  💰 정산 관리 방법
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>완료된 오더에 대해 정산을 진행합니다.</p>
                  <div>
                    <p className="font-semibold">STAFF - 정산 관리:</p>
                    <p>• 완료된 오더 목록 확인</p>
                    <p>• 정산 금액 확인 후 정산 처리</p>
                    <p>• 정산 완료 시 업체에 알림</p>
                  </div>
                  <div>
                    <p className="font-semibold">PARTNER - 정산 현황:</p>
                    <p>• 본인의 정산 내역 확인</p>
                    <p>• 월별 정산 금액 조회</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 전자서명 가이드 */}
              <AccordionItem value="contracts">
                <AccordionTrigger className="text-left">
                  ✍️ 전자서명 계약서 생성
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>고객에게 전자서명 계약서를 발송할 수 있습니다.</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>전자서명관리 → 템플릿 관리에서 계약서 템플릿 생성</li>
                    <li>계약서 목록에서 "새 계약서 작성" 클릭</li>
                    <li>템플릿 선택 후 예약 정보 입력</li>
                    <li>생성된 링크를 고객에게 전달</li>
                    <li>고객이 서명 완료 시 계약서 확인 가능</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              {/* 일정 관리 가이드 */}
              <AccordionItem value="calendar">
                <AccordionTrigger className="text-left">
                  📅 일정 보기 사용법
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>캘린더에서 예약된 일정을 확인할 수 있습니다.</p>
                  <p>• 날짜 클릭 시 해당 날짜의 일정 목록 표시</p>
                  <p>• 오더와 연동된 일정 자동 표시</p>
                  <p>• 색상으로 일정 유형 구분</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* 문의 안내 */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              추가 문의사항은 C/S 메뉴를 통해 문의해주세요.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Guide;
