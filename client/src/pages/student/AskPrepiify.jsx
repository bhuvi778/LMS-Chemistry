import { useEffect, useState } from 'react';
import { MessageSquare, Loader2, Sparkles, AlertCircle, ArrowUpRight, CheckCircle } from 'lucide-react';
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
    const hasAccess = usage.planType === 'pro' || usage.planType === 'infinity';
    if (loading || !hasAccess) {
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
        <span className="text-sm font-semibold text-slate-500">Checking prep plan details...</span>
      </div>
    );
  }

  const hasAccess = usage.planType === 'pro' || usage.planType === 'infinity';

  if (!hasAccess) {
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
        </div>

        <div className="max-w-md w-full bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <MessageSquare size={28} className="text-brand-600" />
          </div>
          <h2 className="font-display text-xl font-black text-slate-800">Access Restricted</h2>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed">
            {usage.planType === 'batch' ? (
              <span>
                <strong>Ask Prepiify AI</strong> is exclusive to our <strong>Pro</strong> and <strong>Infinity</strong> cohorts. Your current <strong>Ace Batch</strong> plan does not include access.
              </span>
            ) : (
              <span>
                Please enroll in <strong>Ace Pro</strong> or <strong>Ace Infinity</strong> to unlock instant AI doubt-solving.
              </span>
            )}
          </p>
          <div className="mt-6 p-4 bg-white border border-slate-200 rounded-2xl text-left text-xs text-slate-605 shadow-sm">
            <p className="font-bold text-slate-700 mb-2">Unlock Ask Prepiify AI & More:</p>
            <ul className="space-y-2 font-semibold text-slate-500">
              <li className="flex items-center gap-2">
                <CheckCircle className="text-emerald-500 w-4 h-4 shrink-0" />
                <span>24/7 Unlimited AI Doubt Solving</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="text-emerald-500 w-4 h-4 shrink-0" />
                <span>Up to 3+ Daily Expert Doubt Support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="text-emerald-500 w-4 h-4 shrink-0" />
                <span>Live Interactive Classes & Mentorship</span>
              </li>
            </ul>
          </div>
          <Link
            to="/student/courses"
            className="btn-primary w-full mt-6 text-xs font-bold py-3.5 justify-center gap-1.5"
          >
            Upgrade Prep Plan <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="mt-3 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full inline-block">
          <span>✓ Unlimited AI Doubts ({usage.planType === 'infinity' ? 'Ace Infinity Plan' : 'Ace Pro Plan'})</span>
        </div>
      </div>

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
    </div>
  );
}
