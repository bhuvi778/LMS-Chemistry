import { useEffect, useState } from 'react';
import { MessageSquare, Sparkles, AlertCircle, ArrowUpRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import LogoLoader from '../../components/LogoLoader.jsx';

const fallbackConfig = {
  "PushToTalkOpenAI": true,
  "PushToTalk": false,
  "EnableWebVoiceCall": null,
  "WebVoiceTitle": null,
  "ChatbotID": 2881,
  "SystemID": 13175,
  "WelcomeMessage": "Ask Anything ?",
  "Flags": 0,
  "SuggestedMessage": "",
  "Theme": 0,
  "DisplayName": "Prepiify",
  "UserMessageColor": "rgb(255, 249, 243)",
  "ChatBubbleColor": "rgb(255, 249, 243)",
  "ChatBubbleAlign": 0,
  "ShowWelcomeMessageDelay": 3,
  "ShowChatBoxDelay": -1,
  "Domains": "https://www.ace2examz.in\nhttps://www.test.ace2examz.in\nhttps://www.ace2examz.com\nhttps://www.uae.ace2examz.com",
  "Status": 2,
  "UserFlags": 32,
  "ClientID": 3939,
  "WorkspaceID": 971,
  "ChatbotProductID": 968,
  "UserEmail": "naviarora4chem@gmail.com",
  "RoleID": 13175,
  "SessionKey": "KvAYV7jIQ8ek9ZWCnOaG5SryoGZ90aRvQujKhKNV6SFb3PeKmUYuFIILWbzk/JBvTab4Z4rtsqUXv7KemNk+SvEX59XaGFlT0pPGWU3k655SQdeW9IyX/20VLDJ65/Yy",
  "SessionID": 94132110,
  "ChatProfilePicture": "1651218",
  "ChatProfilePictureFileName": "Logo.png",
  "ChatProfilePictureUrl": "https://newoaks.s3.us-west-1.amazonaws.com/NewOaks/4939/dba18ae1-ff10-4a83-9c9a-ccdf4abd8477.png",
  "ChatIcon": "1651217",
  "ChatIconFileName": "Logo.png",
  "ChatIconUrl": "https://newoaks.s3.us-west-1.amazonaws.com/NewOaks/4939/3a266e85-4d09-4119-9756-2fe129a8591b.png",
  "CalendlyAppointmentEnable": false,
  "CalendlyAppointmentTriggerKeyword": "",
  "CalendlyAppointmentScheduleUrl": "",
  "PrivacyPolicyUrl": "https://ace2examz.in/privacy-policy/",
  "RemovePowerBy": false,
  "CompanyName": "FrillBot",
  "CustomDomain": "https://bot.frillbot.com",
  "TalkToHumanEmail": "crack@ace2examz.in",
  "DisplaySourceReferenceLink": false,
  "ChatbotStyle": {
    "ShadowOffsetX": 0,
    "ShadowOffsetY": 0,
    "ShadowBlurRadius": 0,
    "ShadowSpreadRadius": 0,
    "ShadowColor": "rgb(0, 0, 0)",
    "ShadowAlpha": 1,
    "isOpenBubbleShadow": false,
    "BubbleShadowOffsetX": 0,
    "BubbleShadowOffsetY": 0,
    "BubbleShadowBlurRadius": 0,
    "BubbleShadowSpreadRadius": 0,
    "BubbleShadowColor": "rgb(0, 0, 0)",
    "BubbleShadowAlpha": 1,
    "FontFamily": "'Noto Sans', sans-serif"
  },
  "CustomStyle": "#newoaks-chatbot-container{\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  background-color: #f8fafc;\n}\n#newoaks-chatbot-header {\n  height: 56px;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 4px 16px;\n  background-color: #6f44fc;\n  color: #fff;\n  gap: 4px;\n}\n#newoaks-chatbot-header_avatar {\n  object-fit: cover;\n  width: 36px;\n  height: 36px;\n  margin-right: 0.25rem;\n  border-radius: 50%;\n}\n#newoaks-chatbot-header_title{\n  padding: 0 8px;\n  font-size: 18px;\n  line-height: 28px;\n  font-weight: 700;\n}\n#newoaks-chatbot-header .chatbot-header-icon {\n  font-size: 20px;\n  line-height: 28px;\n}\n#newoaks-chatbot-message-list {\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 0%;\n  overflow-y: auto;\n  overscroll-behavior: none;\n  padding: 0 16px;\n  position: relative;\n  background-color: #f8f6ff;\n}\n.newoaks-chatbot-message-bubble-container {\n  padding: 8px 0;\n  display: flex;\n  gap: 0.375rem;\n}\n.newoaks-chatbot-message-bubble-container .chatbot-message-right{\n  margin-left: auto;\n  padding: 8px 12px;\n  border-radius: 0.75rem;\n  line-height: 1.5;\n  font-size: 15px;\n  overflow: hidden;\n  border-bottom-right-radius: 0px;\n  color: #fff;\n  background-color: #6f44fc;\n}\n.newoaks-chatbot-message-bubble-container .chatbot-message-left{\n  padding: 8px 12px;\n  border-radius: 0.75rem;\n  line-height: 1.5;\n  font-size: 15px;\n  overflow: hidden;\n  border-bottom-left-radius: 0px;\n  color: #000;\n  background-color: #e2e8f0;\n}\n#newoaks-chatbot-common-expression {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-end;\n  justify-content: flex-end;\n  flex: 1;\n}\n.newoaks-chatbot-common-expression_item{\n  color: #6f44fc;\n  border: 1px solid #6f44fc;\n  border-radius: 8px;\n  border-bottom-right-radius: 0px;\n  padding: 6px 8px;\n  font-size: 15px;\n  line-height: 1.5;\n  margin: 6px 0;\n  cursor: pointer;\n}\n.newoaks-chatbot-common-expression_item:hover{\n  background-color: #eae4ff;\n}\n#newoaks-chatbot-input-toolbar {\n  margin: 8px 16px 0;\n  padding: 4px 0px 4px 8px;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n  display: flex;\n  align-items: center;\n}\n#newoaks-chatbot-send-message-btn{\n  cursor: pointer;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  border-radius: 6px;\n  width: 40px;\n  height: 32px;\n}\n.newoaks-chatbot-send-message-btn_icon {\n  width: 22px;\n  height: 22px;\n  fill: #6F44FC;\n}",
  "CustomeStyleIFrame": ".newoaks-chatbot-bubble-iframe {\n  right: 48px !important;\n  height: 600px;\n  overflow: hidden;\n  border: 1px solid #ccc;\n  border-radius: 12px;\n}",
  "CustomeSystemBubble": ".newoaks-chatbot-bubble-switch-button{\n  user-select: none;\n  cursor: pointer;\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  position: fixed;\n  z-index: 2147483645;\n  bottom: 48px;\n  right: 48px;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  overflow: hidden;\n  background-color: #000;\n}\n.newoaks-chatbot-bubble-switch-button svg{\n  fill: #fff;\n  stroke: #fff;\n}\n\n@media screen and (max-width: 768px) {.newoaks-chatbot-bubble-switch-button {bottom: 90px;}}",
  "CustomInitialWelcomeMessage": ".newoaks-chatbot-initial-welcome-bubble {\nposition: fixed;\nright: 48px;\nbottom: 120px;\nz-index: 2147483645;\n}\n.newoaks-chatbot-initial-welcome-bubble-close-btn {\nmargin-left: auto;\nwidth: 26px;\nheight: 26px;\ndisplay: flex;\njustify-content: center;\nalign-items: center;\nborder-radius: 50%;\nbackground-color: #e0e0e0;\ncursor: pointer;\nuser-select: none;\n}\n.newoaks-chatbot-initial-welcome-bubble-close-btn svg {\nwidth: 16px;\nheight: 16px;\nfill: #333;\n}\n.newoaks-chatbot-initial-welcome-bubble-text{\nmargin-left: auto;\nmargin-bottom: 0;\nmargin-top: 12px;\nmin-width: min-content;\nmax-width: max-content;\npadding: 12px 16px;\nbackground-color: #f2f2ff;\ncolor: #6f44fc;\nborder-radius: 10px;\nline-height: 1.6;\nborder: 1px solid #ebebeb;\nbox-shadow: 0 0 16px rgba(0,0,0,.1);\n}",
  "CustomStyleEnable": false,
  "LeadRequired": false,
  "UserInputPlaceholder": "Ask your question about chemistry...",
  "UserFontColor": "",
  "LeadFormDisplayOption": 1,
  "IsHumanServiceAccount": false,
  "LeadsTitle": "Chat Inquiry",
  "LeadsDisplayLastName": "Last Name",
  "LeadsDisplayFirstName": "First Name",
  "LeadsDisplayEmail": "Email",
  "LeadsDisplayPhoneNumber": "Phone number",
  "LeadsDisplayMessage": "Message",
  "SourceLinkStyle": {},
  "ChatbotPopupOnce": false,
  "PartialPathDomain": "",
  "RemoveChatLogOnBrowserClose": true,
  "ConsentEnable": null,
  "ConsentContent": "",
  "ConsentCheckboxText": "",
  "ConsentAgreeButtonText": "",
  "ConsentDisagreeButtonText": "",
  "InitialMessage": "",
  "FacebookUrl": "https://facebook.com/ace2examzz",
  "WhatsappUrl": "https://wa.me/+919115179935?text=Hi,%20I%20am%20using%20Ace2Examz",
  "InstagramUrl": "https://instagram.com/ace2examz",
  "ChatbotPrivacyPolicyName": "privacy policy",
  "ChatbotPrivacyPolicyUrl": "https://ace2examz.com/privacy-policy",
  "ChatbotPrivacyPolicyDescription": "Read it Carefully - ",
  "EnableChatBubble": true,
  "EnablePushToTalk": false,
  "EnableWebVoiceCallIndependent": true,
  "EnableUploadImage": true
};

export default function AskPrepiify() {
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({ planType: 'none', limit: 0, used: 0, remaining: 0 });
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    // Fetch doubt usage status and enrollments
    Promise.all([
      api.get('/doubts/usage').then((res) => res.data),
      api.get('/enroll/me').then((res) => res.data).catch(() => [])
    ])
      .then(([usageData, enrollData]) => {
        setUsage(usageData || { planType: 'none', limit: 0, used: 0, remaining: 0 });
        setEnrollments(enrollData || []);
      })
      .catch((err) => {
        console.error('Failed to load doubt usage or enrollments', err);
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
        } else {
          console.warn('API returned non-200 code. Using fallback configuration for chatbot.');
          window[chatbotsMemoryKey][chatbotId] = fallbackConfig;
        }
      } catch (err) {
        console.error('Failed to load chatbot config, using fallback', err);
        window[chatbotsMemoryKey][chatbotId] = fallbackConfig;
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex items-center justify-center min-h-[300px]">
        <LogoLoader size={60} text="Checking prep plan details..." />
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
                <strong>Ask Prepiify AI</strong> is exclusive to our <strong>Pro</strong> and <strong>Infinity</strong> cohorts. Your current <strong>Ace Starter</strong> plan does not include access.
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
          {enrollments.filter(e => e.planType !== 'infinity').length > 0 ? (
            <div className="w-full mt-6 space-y-2">
              {enrollments.filter(e => e.planType !== 'infinity').map((e) => (
                <Link
                  key={e._id}
                  to={`/courses/${e.course?.slug || e.course?._id}`}
                  className="btn-primary w-full text-xs font-bold py-3.5 justify-center gap-1.5"
                >
                  Upgrade {e.course?.title || 'Prep Plan'} <ArrowUpRight size={14} />
                </Link>
              ))}
            </div>
          ) : (
            <Link
              to="/student/courses"
              className="btn-primary w-full mt-6 text-xs font-bold py-3.5 justify-center gap-1.5"
            >
              Upgrade Prep Plan <ArrowUpRight size={14} />
            </Link>
          )}
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
