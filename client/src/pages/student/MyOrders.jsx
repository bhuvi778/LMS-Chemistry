import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client.js';
import { CreditCard, Loader2, Download, AlertCircle, Check, FileText, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyOrders() {

  const [enrollments, setEnrollments] = useState([]);
  const [seriesEnrollments, setSeriesEnrollments] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);




  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const [enrollRes, seriesRes] = await Promise.all([
        api.get('/enroll/me'),
        api.get('/payment/my-series'),
      ]);
      setEnrollments(enrollRes.data || []);
      setSeriesEnrollments(seriesRes.data || []);
    } catch {
      toast.error('Failed to load purchase history');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const downloadInvoice = async (paymentId, invoiceNumber) => {
    try {
      const resp = await api.get(`/payment/invoice/${paymentId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber || paymentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Invoice not available');
    }
  };

  const allPurchases = [
    ...enrollments.map(e => ({
      _id: e._id,
      type: 'course',
      title: e.course?.title || 'Deleted Course',
      thumbnail: e.course?.thumbnail,
      price: e.pricePaid,
      date: e.createdAt,
      paymentId: e.paymentId,
      invoiceNumber: e.invoiceNumber,
    })),
    ...seriesEnrollments.map(se => ({
      _id: se._id,
      type: 'test_series',
      title: se.testSeries?.title || 'Deleted Test Series',
      thumbnail: se.testSeries?.thumbnail,
      price: se.pricePaid,
      date: se.createdAt,
      paymentId: se.paymentId,
      invoiceNumber: se.invoiceNumber,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-800">My Orders & Invoices</h1>
        <p className="text-sm text-slate-500 mt-1">Track offline bank payments and review purchase transactions.</p>
      </div>

      {/* Online Purchases & Invoices Card */}
      <div className="card p-6 sm:p-8 bg-white border border-slate-100 shadow-soft">
        <h2 className="font-display text-lg font-extrabold text-slate-850 flex items-center gap-2">
          <ShoppingBag size={20} className="text-brand-500" />
          <span>Purchase History & Invoices</span>
        </h2>
        <p className="text-slate-400 text-xs mt-0.5">View your online orders and download invoice PDFs.</p>

        {loadingOrders ? (
          <div className="flex items-center gap-2 text-slate-400 py-10 justify-center">
            <Loader2 size={20} className="animate-spin text-brand-500" />
            <span className="font-semibold text-xs">Loading purchases...</span>
          </div>
        ) : allPurchases.length === 0 ? (
          <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl mt-6">
            <ShoppingBag className="mx-auto mb-2 text-slate-300" size={32} />
            <p className="text-sm font-semibold">No purchases found</p>
            <p className="text-xs text-slate-400 mt-1">Enroll in courses or test series to view them here.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {allPurchases.map((purchase) => (
              <div key={purchase._id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {purchase.thumbnail ? (
                    <img src={purchase.thumbnail} alt={purchase.title} className="w-16 h-10 object-cover rounded-xl border shrink-0 bg-white" />
                  ) : (
                    <div className="w-16 h-10 bg-slate-250 rounded-xl shrink-0 flex items-center justify-center bg-white border">
                      <FileText size={18} className="text-slate-400" />
                    </div>
                  )}
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                      {purchase.type === 'course' ? 'Course Enrollment' : 'Test Series Access'}
                    </span>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug">{purchase.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>Paid: <b>₹{purchase.price || 0}</b></span>
                      <span>•</span>
                      <span>Date: {new Date(purchase.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-start md:self-center">
                  {purchase.paymentId && purchase.paymentId !== 'FREE' && !purchase.paymentId?.startsWith('FREE_') ? (
                    <button
                      onClick={() => downloadInvoice(purchase.paymentId, purchase.invoiceNumber)}
                      className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-brand-200 hover:text-brand-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition shadow-sm"
                    >
                      <Download size={14} /> Download Invoice
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                      Free Access
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
}
