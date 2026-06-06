import { useEffect } from 'react';

export default function AskPrepiify() {
  useEffect(() => {
    // Define the global config for the chatbot
    window.chatpilotIframeConfig = {
      chatbotId: "09ab53ae7eec4078b03364a594c688af",
      domain: "https://bot.frillbot.com"
    };

    // Dynamically append the chatbot iframe script
    const script = document.createElement('script');
    script.src = "https://bot.frillbot.com/embed.iframe.js";
    script.charset = "utf-8";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up the script tag when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col items-center">
      <div className="mb-6 text-center max-w-md">
        <h1 className="font-display text-2xl font-extrabold text-slate-800">Ask Prepiify</h1>
        <p className="text-sm text-slate-500 mt-1">
          Have a chemistry doubt or question? Ask our AI assistant Prepiify for instant explanations.
        </p>
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
