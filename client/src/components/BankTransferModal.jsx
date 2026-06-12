import { useState, useRef } from 'react';
import { X, Upload, CheckCircle, Loader2, Building2, Copy, Check } from 'lucide-react';
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

export default function BankTransferModal({ isOpen, onClose, itemType, itemId, itemName, planType, baseAmount, initialRequest, redeemCoins }) {
  const { user } = useAuth();
  const [step, setStep] = useState(initialRequest && initialRequest.status === 'pending' ? 2 : 1);
  const [submittedRequest, setSubmittedRequest] = useState(initialRequest || null);

  // Step 1 form state
  const [studentName, setStudentName] = useState(user?.name || '');
  const rawPhone = (user?.phone || '').replace(/^\+?971\s?/, '');
  const [studentPhone, setStudentPhone] = useState(rawPhone);
  const [studentEmail, setStudentEmail] = useState(user?.email || '');
  const [studentStreet, setStudentStreet] = useState('');
  const [studentCity, setStudentCity] = useState('');
  const [studentState, setStudentState] = useState('');
  const [studentPinCode, setStudentPinCode] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  // Step 2 proof state
  const [refNumber, setRefNumber] = useState(initialRequest?.referenceNumber || '');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(initialRequest?.screenshotUrl || '');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(initialRequest?.screenshotUrl || '');
  const [proofBusy, setProofBusy] = useState(false);
  const fileRef = useRef();

  // Fee calculation: flat 45 AED if < 7300, else 0.7%
  let finalBaseAmt = baseAmount;
  let coinDiscountVal = 0;
  if (redeemCoins && user && (user.coins || 0) >= 250) {
    const maxCoinsNeeded = Math.floor(baseAmount * 25);
    const coinsToRedeem = Math.min(user.coins || 0, maxCoinsNeeded);
    coinDiscountVal = coinsToRedeem / 25;
    finalBaseAmt = Math.max(0, baseAmount - coinDiscountVal);
  }

  const handlingFee = finalBaseAmt <= 7299 ? 45 : Math.round(finalBaseAmt * 0.007 * 100) / 100;
  const totalAmount = finalBaseAmt + handlingFee;

  if (!isOpen) return null;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const handleSubmitRequest = async () => {
    if (!studentName.trim()) { toast.error('Please enter your name'); return; }
    if (!studentPhone.trim()) { toast.error('Please enter your phone number'); return; }
    if (!studentEmail.trim()) { toast.error('Please enter your email address'); return; }
    if (!studentStreet.trim()) { toast.error('Please enter your street address'); return; }
    if (!studentCity.trim()) { toast.error('Please enter your city'); return; }
    if (!studentState.trim()) { toast.error('Please enter your state/emirate'); return; }
    if (!studentPinCode.trim()) { toast.error('Please enter your pin/postal code'); return; }
    const fullPhone = '+971' + studentPhone.trim();
    const fullAddress = [studentStreet.trim(), studentCity.trim(), studentState.trim(), studentPinCode.trim()].filter(Boolean).join(', ');
    setBusy(true);
    try {
      const payload = {
        itemType,
        ...(itemType === 'course' ? { courseId: itemId, planType } : { testSeriesId: itemId }),
        studentName: studentName.trim(),
        studentPhone: fullPhone,
        studentEmail: studentEmail.trim(),
        studentAddress: fullAddress,
        notes: notes.trim(),
        baseAmount,
        redeemCoins,
      };
      const { data } = await api.post('/bank-transfer', payload);
      setSubmittedRequest(data);
      setStep(2);
      toast.success('Request submitted! You can now add payment proof.');
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
    setScreenshot(file);
    // Auto-upload
    setUploadingImg(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/upload/screenshot', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setScreenshotUrl(data.url);
      toast.success('Screenshot uploaded!');
    } catch (e) {
      toast.error('Upload failed: ' + (e.response?.data?.message || e.message));
      setScreenshot(null);
      setScreenshotPreview('');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!refNumber.trim()) {
      toast.error('Please enter the reference number');
      return;
    }
    if (!screenshotUrl) {
      toast.error('Please upload the payment screenshot');
      return;
    }
    setProofBusy(true);
    try {
      await api.put(`/bank-transfer/${submittedRequest._id}`, {
        referenceNumber: refNumber.trim(),
        screenshotUrl,
      });
      toast.success('Payment proof submitted! Admin will confirm shortly.');
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Failed to submit proof');
    } finally {
      setProofBusy(false);
    }
  };

  const handleSkipProof = () => {
    toast('Request saved. You can add payment proof from your profile later.', { icon: 'ℹ️' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Bank Transfer Payment</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px]">{itemName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 px-5 pt-4">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s ? 'bg-indigo-600 text-white' : step > s ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {step > s ? <Check size={12} /> : s}
              </div>
              <span className={`text-xs font-medium ${step === s ? 'text-indigo-600' : step > s ? 'text-emerald-600' : 'text-slate-400'}`}>
                {s === 1 ? 'Submit Request' : 'Add Proof'}
              </span>
              {s < 2 && <div className={`w-6 h-px ${step > s ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* ─── STEP 1 ─── */}
          {step === 1 && (
            <>
               {/* Amount Summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Base Amount</span>
                  <span className="font-semibold">AED {baseAmount.toFixed(2)}</span>
                </div>
                {coinDiscountVal > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-bold">
                    <span>Coin Discount</span>
                    <span>- AED {coinDiscountVal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Internet Handling Charges</span>
                  <span className="text-slate-600">AED {handlingFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-slate-800">Total to Transfer</span>
                  <span className="text-indigo-600 text-base">AED {totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Bank Details */}
              <div className="border border-indigo-100 rounded-xl p-4 space-y-2.5 bg-indigo-50/40">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={15} className="text-indigo-600" />
                  <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Transfer To</h3>
                </div>
                {Object.entries(BANK_DETAILS).map(([key, val]) => {
                  const labels = { beneficiary: 'Beneficiary', bankName: 'Bank Name', accountNumber: 'Account Number', bicCode: 'BIC Code', accountType: 'Account Type', bankAddress: 'Bank Address' };
                  return (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">{labels[key]}</p>
                        <p className="text-sm font-semibold text-slate-700 font-mono">{val}</p>
                      </div>
                      <button onClick={() => copyToClipboard(val, key)} className="p-1.5 rounded-lg hover:bg-indigo-100 text-slate-400 flex-shrink-0">
                        {copied === key ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Contact Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500">YOUR DETAILS</h3>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">Phone / WhatsApp *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 border-slate-200 rounded-l-lg bg-slate-50 text-sm font-semibold text-slate-600 select-none">🇦🇪 +971</span>
                    <input
                      type="tel"
                      value={studentPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^\+?971\s?/, '');
                        setStudentPhone(val);
                      }}
                      className="flex-1 border border-slate-200 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                      placeholder="50 000 0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">Email *</label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">Street Address *</label>
                  <input
                    type="text"
                    value={studentStreet}
                    onChange={(e) => setStudentStreet(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="Building, Street, Area"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">City *</label>
                    <input
                      type="text"
                      value={studentCity}
                      onChange={(e) => setStudentCity(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                      placeholder="e.g. Dubai"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">State / Emirate *</label>
                    <input
                      type="text"
                      value={studentState}
                      onChange={(e) => setStudentState(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                      placeholder="e.g. Dubai"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">Pin / Postal Code *</label>
                  <input
                    type="text"
                    value={studentPinCode}
                    onChange={(e) => setStudentPinCode(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="e.g. 00000"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                    rows={2}
                    placeholder="Any additional info..."
                  />
                </div>
              </div>

              <button
                onClick={handleSubmitRequest}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                Submit Transfer Request
              </button>
            </>
          )}

          {/* ─── STEP 2 ─── */}
          {step === 2 && (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle size={16} className="text-emerald-500" />
                  Request Submitted Successfully!
                </div>
                <p className="text-xs text-emerald-700">
                  Transfer <strong>AED {totalAmount.toFixed(2)}</strong> to our bank account above. Once you've transferred, add the reference number or upload your screenshot below.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase">PAYMENT PROOF</h3>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">Transaction / Reference Number</label>
                  <input
                    type="text"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 font-mono"
                    placeholder="TXN123456789"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">Payment Screenshot</label>
                  <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleFileChange} />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-indigo-300 hover:bg-indigo-50/30 transition"
                  >
                    {uploadingImg ? (
                      <Loader2 size={22} className="animate-spin text-indigo-500" />
                    ) : screenshotPreview ? (
                      <img src={screenshotPreview} alt="preview" className="h-24 rounded-lg object-cover" />
                    ) : (
                      <>
                        <Upload size={22} className="text-slate-400" />
                        <span className="text-xs text-slate-500">Click to upload screenshot</span>
                      </>
                    )}
                  </button>
                  {screenshotUrl && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Check size={12} /> Uploaded successfully</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSkipProof}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleSubmitProof}
                  disabled={proofBusy || uploadingImg}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                >
                  {proofBusy ? <Loader2 size={15} className="animate-spin" /> : null}
                  Submit Proof
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
