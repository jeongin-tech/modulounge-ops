import DashboardLayout from "@/components/DashboardLayout";

const ChannelTalkDesk = () => {
  return (
    <DashboardLayout currentPage="/channel-desk">
      <div className="h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)] -m-4 lg:-m-8">
        <iframe
          src="https://desk.channel.io/modlounge/user-chats/정희재-69313f832c3c7adf5914"
          className="w-full h-full border-0"
          title="채널톡 상담"
          allow="microphone; camera; clipboard-write"
        />
      </div>
    </DashboardLayout>
  );
};

export default ChannelTalkDesk;
