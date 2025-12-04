import { useEffect } from 'react';

interface ChannelTalkProfile {
  id: string;
  email: string;
  name?: string;
  mobileNumber?: string;
  companyName?: string;
  businessRegistrationNumber?: string;
  representativeName?: string;
  serviceType?: string;
  serviceRegions?: string[];
}

interface ChannelTalkProps {
  pluginKey: string;
  user?: ChannelTalkProfile;
}

declare global {
  interface Window {
    ChannelIO?: (...args: any[]) => void;
    ChannelIOInitialized?: boolean;
  }
}

const ChannelTalk = ({ pluginKey, user }: ChannelTalkProps) => {
  useEffect(() => {
    // Load Channel Talk SDK
    (function() {
      const w = window;
      if (w.ChannelIO) {
        return;
      }
      const ch = function(...args: any[]) {
        ch.c(args);
      } as any;
      ch.q = [] as any[];
      ch.c = function(args: any) {
        ch.q.push(args);
      };
      w.ChannelIO = ch;
      
      function l() {
        if (w.ChannelIOInitialized) return;
        w.ChannelIOInitialized = true;
        const s = document.createElement('script');
        s.type = 'text/javascript';
        s.async = true;
        s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
        const x = document.getElementsByTagName('script')[0];
        if (x && x.parentNode) {
          x.parentNode.insertBefore(s, x);
        }
      }
      
      if (document.readyState === 'complete') {
        l();
      } else {
        window.addEventListener('DOMContentLoaded', l);
        window.addEventListener('load', l);
      }
    })();

    // Boot Channel Talk
    const bootOption: any = {
      pluginKey,
    };

    if (user) {
      bootOption.memberId = user.id;
      bootOption.profile = {
        name: user.name || user.email,
        email: user.email,
        mobileNumber: user.mobileNumber || null,
        companyName: user.companyName || null,
        // 커스텀 프로필 필드 (채널톡 고객 연락처에 표시됨)
        bizRegNo: user.businessRegistrationNumber || null,
        ceoName: user.representativeName || null,
        serviceType: user.serviceType || null,
        serviceRegions: user.serviceRegions?.join(', ') || null,
      };
    }

    window.ChannelIO?.('boot', bootOption);

    return () => {
      window.ChannelIO?.('shutdown');
    };
  }, [pluginKey, user]);

  return null;
};

export default ChannelTalk;
