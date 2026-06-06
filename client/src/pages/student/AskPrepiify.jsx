import { useEffect, useState } from 'react';
import { MessageSquare, Loader2, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

export default function AskPrepiify() {
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({ planType: 'none', limit: 0, used: 0, remaining: 0 });

  useEffect(() => {
    // Fetch doubt usage status
    api.get('/doubts/usage')
      .then((res) => {
        setUsage(res.data || { planType: 'none', limit: 0, used: 0, remaining: 0 });
      })
      .catch((err) => {
        console.error('Failed to load doubt usage', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Only initialize chatbot if we are not loading and have remaining doubts
    if (loading || (usage.limit !== -1 && usage.remaining <= 0)) {
      return;
    }

    const chatbotId = "09ab53ae7eec4078b03364a594c688af";
    const domain = "https://bot.frillbot.com";
    const apiHost = `${domain}/chat`;
    const chatbotsMemoryKey = 'NEWOAKS_CHATBOTS_STORE';
    const chatbotsSessionIdKey = 'NEWOAKS_CHATBOTS_IFRAME_SESSION_ID';

    function getCurrentTime() {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
      const day = ('0' + currentDate.getDate()).slice(-2);
      const hours = ('0' + currentDate.getHours()).slice(-2);
      const minutes = ('0' + currentDate.getMinutes()).slice(-2);
      const seconds = ('0' + currentDate.getSeconds()).slice(-2);
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    async function initConfig() {
      if (!window[chatbotsMemoryKey]) {
        window[chatbotsMemoryKey] = {};
      }
      if (window[chatbotsMemoryKey][chatbotId]) {
        return;
      }
      try {
        const result = await fetch(apiHost + '/Chatbot/GetConfig', {
          method: 'POST',
          body: JSON.stringify({
            serialNumber: chatbotId,
            clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            clientCurrentTime: getCurrentTime()
          }),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Referer': window.location.host,
            ReferrerInfo: JSON.stringify({
              url: window.location.href,
              agent: navigator.userAgent
            })
          }
        });
        const data = await result.json();
        if (data.Code === 200) {
          const config = data.Data;
          window[chatbotsMemoryKey][chatbotId] = config;
          const localSessionIDs = JSON.parse(
            localStorage.getItem(chatbotsSessionIdKey) || '{}'
          );
          localStorage.setItem(
            chatbotsSessionIdKey,
            JSON.stringify({
              ...localSessionIDs,
              [chatbotId]: localSessionIDs[chatbotId] || config.SessionID
            })
          );
        }
      } catch (err) {
        console.error('Failed to load chatbot config', err);
      }
    }

    initConfig();

    const handleMessage = (e) => {
      if (e.data === 'init-chatbot-iframe') {
        const iframe = document.getElementById('chatbot-iframe');
        if (!iframe) return;
        const currentChatbot = (window[chatbotsMemoryKey] ?? {})[chatbotId];
        if (!currentChatbot) return;
        iframe.contentWindow.postMessage(
          'config:' +
            JSON.stringify({
              ...currentChatbot,
              SessionID:
                JSON.parse(localStorage.getItem(chatbotsSessionIdKey) || '{}')[
                  chatbotId
                ] || currentChatbot.SessionID
            }),
          '*'
        );
      }
    };

    window.addEventListener('message', handleMessage, false);
    return () => {
      window.removeEventListener('message', handleMessage, false);
    };
  }, [loading, usage]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-brand-600 mb-2" />
        <span className="text-sm font-semibold text-slate-500">Checking doubt usage quota...</span>
      </div>
    );
  }

  const isLocked = usage.limit !== -1 && usage.remaining <= 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col items-center">
      <div className="mb-6 text-center max-w-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-bold mb-3">
          <Sparkles size={12} className="text-brand-500 animate-pulse" />
          <span>Ask Prepiify AI</span>
        </div>
        <h1 className="font-display text-2xl font-extrabold text-slate-800">Instant AI Doubt Solver</h1>
        <p className="text-sm text-slate-500 mt-1.5">
          Get direct explanations for your chemistry questions from our smart AI chatbot.
        </p>

        {/* Quota indicator */}
        {!isLocked && (
          <div className="mt-3 text-xs font-bold text-slate-650 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full inline-block">
            {usage.limit === -1 ? (
              <span className="text-emerald-600 font-extrabold">✓ Unlimited AI Doubts (Ace Infinity Plan)</span>
            ) : (
              <span>
                Weekly Usage: <strong className="text-brand-700">{usage.used}</strong> / <strong className="text-slate-800">{usage.limit}</strong> doubts ({usage.remaining} left)
              </span>
            )}
          </div>
        )}
      </div>

      {isLocked ? (
        <div className="max-w-md w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="font-display text-lg font-extrabold text-slate-800">Weekly Quota Reached</h2>
          <p className="text-slate-500 text-xs mt-2.5 leading-relaxed">
            Your current plan allows <strong>{usage.limit} doubt{usage.limit > 1 ? 's' : ''} per week</strong>. You have already used this quota.
          </p>
          <div className="mt-4 p-3 bg-violet-50/50 border border-violet-100/50 rounded-xl text-left text-xs text-slate-650">
            <p className="font-semibold text-slate-700 mb-1">Why Upgrade to Ace Infinity?</p>
            <ul className="space-y-1 list-disc pl-4 font-medium text-slate-500">
              <li>Unlimited instant AI doubts support</li>
              <li>1-on-1 personal expert mentorship</li>
              <li>Live interactive classes & Q&A</li>
            </ul>
          </div>
          <Link
            to="/student/courses"
            className="btn-primary w-full mt-6 text-xs font-bold py-3 justify-center gap-1.5"
          >
            Upgrade prep plan <ArrowUpRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="relative w-full max-w-[460px] flex justify-center bg-slate-50 rounded-2xl p-2 border border-slate-100 shadow-inner">
          <iframe
            allow="microphone"
            src="https://bot.frillbot.com/chatbot-iframe/09ab53ae7eec4078b03364a594c688af"
            id="chatbot-iframe"
            style={{ border: '1px solid #e5e7eb', borderRadius: '12px' }}
            width="460px"
            height="600px"
            frameBorder="0"
            title="Prepiify Chatbot"
          />
        </div>
      )}
    </div>
  );
}
