import { useState, useRef } from 'react';
import { X, Upload, CheckCircle, Loader2, Building2, Copy, Check, ArrowLeft, Coins, AlertCircle } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const BANK_DETAILS = {
  beneficiary: 'KEYSTONE ACADEMY CONNECT (OPC) PRIVATE LIMITED',
  bankName: 'The Currency Cloud Limited',
  accountNumber: 'GB93TCCL04140414984233',
  bicCode: 'TCCLGB3L',
  accountType: 'Business',
  bankAddress: '12 Steward Street, The Steward Building, London, E1 6FQ, GB',
};

const COIN_PACKAGES = [
  { id: 'starter', coins: 100, price: 100, name: 'Starter Pack', theme: 'border-amber-200 bg-amber-50/20 text-amber-700 hover:border-amber-400' },
  { id: 'standard', coins: 250, price: 250, name: 'Standard Pack', theme: 'border-slate-200 bg-slate-50/30 text-slate-700 hover:border-slate-400' },
  { id: 'pro', coins: 500, price: 500, name: 'Pro Pack', popular: true, theme: 'border-yellow-300 bg-yellow-50/30 text-yellow-800 hover:border-yellow-500 ring-2 ring-yellow-400/30 shadow-md shadow-yellow-100' },
  { id: 'elite', coins: 1000, price: 1000, name: 'Elite Pack', theme: 'border-indigo-200 bg-indigo-50/20 text-indigo-700 hover:border-indigo-400' },
];

export default function BuyCoinsModal({ isOpen, onClose, onRequestSubmitted, initialRequest }) {
  const { user } = useAuth();
  const [step, setStep] = useState(initialRequest ? 3 : 1);
  const [selectedPack, setSelectedPack] = useState(COIN_PACKAGES[2]); // Default to Pro Pack (500)
  const [customCoins, setCustomCoins] = useState('');
  const [isCustomSelected, setIsCustomSelected] = useState(false);

  // Request Submission
  const [submittedRequest, setSubmittedRequest] = useState(initialRequest || null);
  const [studentName, setStudentName] = useState(user?.name || '');
  const rawPhone = (user?.phone || '').replace(/^\+?91\s?/, '');
  const [studentPhone, setStudentPhone] = useState(rawPhone);
  const [studentEmail, setStudentEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState(initialRequest?.notes || '');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  // Proof Submission
  const [refNumber, setRefNumber] = useState(initialRequest?.referenceNumber || '');
  const [screenshotPreview, setScreenshotPreview] = useState(initialRequest?.screenshotUrl || '');
  const [screenshotUrl, setScreenshotUrl] = useState(initialRequest?.screenshotUrl || '');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [proofBusy, setProofBusy] = useState(false);
  const fileRef = useRef();

  if (!isOpen) return null;

  const getCoinsCount = () => {
    if (isCustomSelected) {
      return parseInt(customCoins) || 0;
    }
    return selectedPack?.coins || 0;
  };

  const getPrice = () => {
    const coins = getCoinsCount();
    // 1 Coin = 1 INR
    return coins;
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const handleNextStep = () => {
    const coins = getCoinsCount();
    if (coins < 50) {
      toast.error('Minimum request size is 50 Ace Coins');
      return;
    }
    setStep(2);
  };

  const handleSubmitRequest = async () => {
    const coins = getCoinsCount();
    const price = getPrice();

    if (!studentName.trim()) { toast.error('Please enter your name'); return; }
    if (!studentPhone.trim()) { toast.error('Please enter your phone number'); return; }
    if (!studentEmail.trim()) { toast.error('Please enter your email address'); return; }

    const fullPhone = studentPhone.trim().startsWith('+') ? studentPhone.trim() : '+91' + studentPhone.trim();
    setBusy(true);

    try {
      const payload = {
        coinsRequested: coins,
        amountPaid: price,
        studentName: studentName.trim(),
        studentPhone: fullPhone,
        studentEmail: studentEmail.trim(),
        notes: notes.trim(),
      };

      const { data } = await api.post('/coin-purchase', payload);
      setSubmittedRequest(data);
      setStep(3);
      toast.success('Request submitted! Please upload your payment details.');
      if (onRequestSubmitted) onRequestSubmitted();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Submission failed');
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotPreview(URL.createObjectURL(file));
    setUploadingImg(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/upload/screenshot', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setScreenshotUrl(data.url);
      toast.success('Payment screenshot uploaded!');
    } catch (e) {
      toast.error('Upload failed: ' + (e.response?.data?.message || e.message));
      setScreenshotPreview('');
      setScreenshotUrl('');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!refNumber.trim()) {
      toast.error('Please enter the UPI/Bank Reference Number');
      return;
    }
    if (!screenshotUrl) {
      toast.error('Please upload the payment proof screenshot');
      return;
    }

    setProofBusy(true);
    try {
      await api.put(`/coin-purchase/${submittedRequest._id}`, {
        referenceNumber: refNumber.trim(),
        screenshotUrl,
      });
      toast.success('Proof uploaded successfully! Admin will verify and credit your coins.');
      if (onRequestSubmitted) onRequestSubmitted();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Failed to submit proof');
    } finally {
      setProofBusy(false);
    }
  };

  const handleClose = () => {
    if (step === 3) {
      toast('You can add payment proof from your wallet page later.', { icon: 'ℹ️' });
    }
    onClose();
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
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex gap-2 px-6 pt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1.5 flex-1 last:flex-none">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                step === s
                  ? 'bg-yellow-500 text-white shadow-md shadow-yellow-100'
                  : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
              }`}>
                {step > s ? <Check size={11} /> : s}
              </div>
              <span className={`text-[11px] font-bold tracking-tight whitespace-nowrap ${
                step === s ? 'text-yellow-600' : step > s ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {s === 1 ? 'Choose Pack' : s === 2 ? 'Submit Request' : 'Upload Proof'}
              </span>
              {s < 3 && <div className={`h-0.5 flex-1 min-w-[20px] rounded-full ${step > s ? 'bg-emerald-400' : 'bg-slate-150'}`} />}
            </div>
          ))}
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* STEP 1: SELECT COIN PACKS */}
          {step === 1 && (
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
                        <Coins size={16} className="text-amber-500 group-hover:animate-bounce" /> {pkg.coins}
                      </h4>
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
              </div>

              {/* conversion helper info */}
              <div className="flex gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 text-xs">
                <AlertCircle size={15} className="shrink-0 text-slate-400 mt-0.5" />
                <p className="leading-normal font-medium">
                  Standard conversion is <b>1 Coin = ₹1 INR</b>. You can request any number of coins (min 50) and make the equivalent payment.
                </p>
              </div>

              {/* Proceed Button */}
              <button
                onClick={handleNextStep}
                disabled={getCoinsCount() < 50}
                className="w-full py-3 bg-slate-900 hover:bg-yellow-500 hover:text-slate-950 text-white font-extrabold rounded-2xl transition cursor-pointer text-sm shadow-md"
              >
                Proceed to Pay &bull; ₹{getPrice()}
              </button>
            </div>
          )}

          {/* STEP 2: BANK TRANSFER DETAILS & CONTACT INFO */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Back & Amount Summary */}
              <div className="flex items-center justify-between">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700">
                  <ArrowLeft size={13} /> Back
                </button>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Purchase Amount</span>
                  <div className="text-sm font-black text-slate-800">
                    {getCoinsCount()} Coins = <span className="text-yellow-600 font-extrabold">₹{getPrice()}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="border border-yellow-100 rounded-2xl p-4 space-y-2.5 bg-yellow-50/30">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={15} className="text-yellow-600" />
                  <h3 className="text-xs font-black text-yellow-800 uppercase tracking-wide">Pay To Our Account</h3>
                </div>
                {Object.entries(BANK_DETAILS).map(([key, val]) => {
                  const labels = { beneficiary: 'Beneficiary', bankName: 'Bank Name', accountNumber: 'Account Number', bicCode: 'BIC Code', accountType: 'Account Type', bankAddress: 'Bank Address' };
                  return (
                    <div key={key} className="flex items-start justify-between gap-3 text-xs border-b border-slate-100/50 pb-1.5 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{labels[key]}</p>
                        <p className="font-semibold text-slate-700 break-all font-mono leading-tight">{val}</p>
                      </div>
                      <button onClick={() => copyToClipboard(val, key)} className="p-1 rounded-lg hover:bg-yellow-100 text-slate-400 shrink-0">
                        {copied === key ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* User Fields */}
              <div className="space-y-3 pt-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Billing Contact Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Name *</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-400 font-medium"
                      placeholder="Billing Name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-400 font-medium"
                      placeholder="10-digit Phone"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-1">Email *</label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-400 font-medium"
                    placeholder="Email Address"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-1">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-400 font-medium resize-none"
                    placeholder="E.g., Sent via GPay"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitRequest}
                disabled={busy}
                className="w-full py-3 bg-slate-900 hover:bg-yellow-500 hover:text-slate-950 text-white font-extrabold rounded-2xl transition cursor-pointer text-sm shadow-md flex items-center justify-center gap-1.5"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : 'Submit & Add Proof'}
              </button>
            </div>
          )}

          {/* STEP 3: UPLOAD TRANSACTION PROOF */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                <CheckCircle className="text-emerald-500 mx-auto mb-2 animate-bounce" size={32} />
                <h3 className="text-sm font-bold text-slate-800">Request Submitted Successfully!</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Please provide your transfer proof to finalize the request.</p>
              </div>

              {/* Request ID Tag */}
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Request ID</span>
                <span className="font-mono font-bold text-slate-700">{submittedRequest?._id}</span>
              </div>

              {/* Reference ID input */}
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">UPI / BANK TRANSACTION REFERENCE NUMBER *</label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-400 font-semibold"
                  placeholder="E.g., UPI Ref 123456789012"
                />
              </div>

              {/* File Upload Box */}
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1.5">UPLOAD PAYMENT RECEIPT SCREENSHOT *</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-yellow-400 transition bg-slate-50/50 hover:bg-yellow-50/10 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden group"
                >
                  {screenshotPreview ? (
                    <>
                      <img src={screenshotPreview} alt="Receipt preview" className="max-h-[120px] max-w-full rounded-lg object-contain shadow-sm" />
                      {uploadingImg && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Loader2 className="animate-spin text-yellow-600" size={24} />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-slate-900/60 p-1 rounded-full text-white hover:bg-slate-900 transition opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setScreenshotPreview(''); setScreenshotUrl(''); }}>
                        <X size={12} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-2 group-hover:bg-yellow-100 group-hover:text-yellow-600 transition">
                        <Upload size={18} />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Click to upload screenshot</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">JPEG, PNG up to 5MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer text-center"
                >
                  Skip & Pay Later
                </button>
                <button
                  onClick={handleSubmitProof}
                  disabled={proofBusy || uploadingImg || !screenshotUrl}
                  className="py-2.5 bg-slate-900 hover:bg-yellow-500 hover:text-slate-950 text-white font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-0"
                >
                  {proofBusy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Submit Proof
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
