import { useEffect } from 'react';

interface ChannelTalkProps {
  pluginKey: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    companyName?: string;
  };
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
        companyName: user.companyName,
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
