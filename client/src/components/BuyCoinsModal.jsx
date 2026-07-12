import { useState } from 'react';
import { X, CheckCircle, Loader2, Coins, AlertCircle } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const COIN_PACKAGES = [
  { id: 'starter', coins: 100, price: 100, bonus: 0, name: 'Starter Pack', theme: 'border-amber-200 bg-amber-50/20 text-amber-700 hover:border-amber-400' },
  { id: 'standard', coins: 250, price: 250, bonus: 0, name: 'Standard Pack', theme: 'border-slate-200 bg-slate-50/30 text-slate-700 hover:border-slate-400' },
  { id: 'pro', coins: 500, price: 500, bonus: 50, name: 'Pro Pack', popular: true, theme: 'border-yellow-300 bg-yellow-50/30 text-yellow-800 hover:border-yellow-500 ring-2 ring-yellow-400/30 shadow-md shadow-yellow-100' },
  { id: 'elite', coins: 1000, price: 1000, bonus: 80, name: 'Elite Pack', theme: 'border-indigo-200 bg-indigo-50/20 text-indigo-700 hover:border-indigo-400' },
];

const getBonusCoins = (coins) => {
  if (coins === 500) return 50;
  if (coins === 1000) return 80;
  return 0;
};

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BuyCoinsModal({ isOpen, onClose, onRequestSubmitted }) {
  const { user, setUser } = useAuth();
  const [selectedPack, setSelectedPack] = useState(COIN_PACKAGES[2]);
  const [customCoins, setCustomCoins] = useState('');
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [coinsAdded, setCoinsAdded] = useState(0);

  if (!isOpen) return null;

  const getCoinsCount = () => {
    const baseCoins = getBaseCoinsCount();
    return baseCoins + getBonusCoins(baseCoins);
  };

  const getBaseCoinsCount = () => {
    if (isCustomSelected) return parseInt(customCoins) || 0;
    return selectedPack?.coins || 0;
  };

  const getPrice = () => getBaseCoinsCount(); // 1 paid coin = ₹1

  const handlePayWithRazorpay = async () => {
    const paidCoins = getBaseCoinsCount();
    const coins = getCoinsCount();
    if (paidCoins < 50) {
      toast.error('Minimum request size is 50 Ace Coins');
      return;
    }

    setBusy(true);
    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Please check your internet connection.');
        setBusy(false);
        return;
      }

      // Create order on backend
      const { data: orderData } = await api.post('/coin-purchase/razorpay/create-order', { coins: paidCoins });

      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Ace2Examz',
        description: `${orderData.coins || coins} Ace Coins`,
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: { color: '#f59e0b' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled', { icon: '⚠️' });
            setBusy(false);
          },
        },
        handler: async (response) => {
          try {
            const { data: verifyData } = await api.post('/coin-purchase/razorpay/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setCoinsAdded(verifyData.coinsAdded);
            setSuccess(true);
            toast.success(verifyData.message || `${verifyData.coinsAdded || coins} Ace Coins added!`);
            // Update user coins in auth context if possible
            if (setUser) {
              setUser((prev) => prev ? { ...prev, coins: verifyData.totalCoins } : prev);
            }
            if (onRequestSubmitted) onRequestSubmitted();
          } catch (e) {
            toast.error(e.response?.data?.message || e.message || 'Payment verification failed. Contact support.');
          } finally {
            setBusy(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        setBusy(false);
      });
      rzp.open();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Could not initiate payment. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg my-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <Coins size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-display">Buy Ace Coins</h2>
              <p className="text-xs text-slate-500 font-medium">Use coins to redeem premium learning resources</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {success ? (
            /* ── Success State ── */
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="text-emerald-500 mx-auto animate-bounce" size={48} />
              <h3 className="text-xl font-extrabold text-slate-800">Coins Added! 🎉</h3>
              <p className="text-slate-500 text-sm">
                <span className="font-black text-amber-600 text-2xl">{coinsAdded}</span> Ace Coins have been credited to your account instantly.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-extrabold rounded-2xl transition cursor-pointer text-sm shadow-md hover:from-yellow-600 hover:to-amber-600"
              >
                Awesome! Close
              </button>
            </div>
          ) : (
            /* ── Select Pack ── */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {COIN_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPack(pkg);
                      setIsCustomSelected(false);
                    }}
                    className={`relative p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between h-28 group hover:scale-[1.02] ${
                      !isCustomSelected && selectedPack?.id === pkg.id
                        ? 'border-yellow-500 bg-yellow-50/30 ring-2 ring-yellow-400/20'
                        : 'border-slate-100 bg-white hover:shadow-sm'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-[9px] font-black text-white px-2 py-0.5 rounded-full shadow-sm">
                        BEST VALUE
                      </span>
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{pkg.name}</p>
                      <h4 className="text-xl font-extrabold text-slate-800 mt-1 flex items-center gap-1 font-display">
                        <Coins size={16} className="text-amber-500 group-hover:animate-bounce" /> {pkg.coins + pkg.bonus}
                      </h4>
                      {pkg.bonus > 0 && (
                        <p className="text-[10px] font-black text-emerald-600 mt-0.5">+{pkg.bonus} bonus coins</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-600 mt-auto">₹{pkg.price}</span>
                  </button>
                ))}
              </div>

              {/* Custom Package Option */}
              <div className={`p-4 rounded-2xl border-2 transition ${
                isCustomSelected ? 'border-yellow-500 bg-yellow-50/20' : 'border-slate-100 bg-white'
              }`}>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="radio"
                    checked={isCustomSelected}
                    onChange={() => setIsCustomSelected(true)}
                    className="accent-yellow-500"
                  />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Or Enter Custom Coins</span>
                </label>
                {isCustomSelected && (
                  <div className="flex items-center gap-3 mt-1">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="50"
                        placeholder="Min 50 coins"
                        value={customCoins}
                        onChange={(e) => setCustomCoins(e.target.value)}
                        className="w-full pl-8 pr-12 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-yellow-500 font-bold"
                      />
                      <Coins className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-500" size={15} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">Coins</span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-600 font-mono shrink-0">
                      = ₹{parseInt(customCoins) || 0} INR
                    </div>
                  </div>
                )}
                {isCustomSelected && getBonusCoins(getBaseCoinsCount()) > 0 && (
                  <p className="text-[10px] font-bold text-emerald-600 mt-2">
                    Bonus applied: +{getBonusCoins(getBaseCoinsCount())} extra coins
                  </p>
                )}
              </div>

              {/* Info */}
              <div className="flex gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 text-xs">
                <AlertCircle size={15} className="shrink-0 text-slate-400 mt-0.5" />
                <p className="leading-normal font-medium">
                  Payment is taken directly through Razorpay. Coins are credited <b>instantly</b> to your profile after successful payment.
                </p>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayWithRazorpay}
                disabled={busy || getBaseCoinsCount() < 50}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-extrabold rounded-2xl transition cursor-pointer text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing…</>
                ) : (
                  <><Coins size={16} /> Pay ₹{getPrice()} &bull; Get {getCoinsCount()} Coins</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
