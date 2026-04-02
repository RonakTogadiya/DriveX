import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { generatePaymentQR, verifyPayment } from '../services/api';
import toast from 'react-hot-toast';

const PaymentPage = () => {
    const { bookingId } = useParams();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'RENTAL'; // 'DEPOSIT' or 'RENTAL'
    
    const navigate = useNavigate();
    const [qrData, setQrData] = useState(null);
    const [amount, setAmount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [txnId, setTxnId] = useState('');

    useEffect(() => {
        const fetchQR = async () => {
            try {
                const { data } = await generatePaymentQR(bookingId, type);
                setQrData(data.qr);
                setAmount(data.amount);
            } catch (err) {
                console.error(err);
                toast.error('Failed to generate payment QR');
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchQR();
    }, [bookingId, type, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!txnId.trim()) {
            toast.error('Please enter the transaction ID from your UPI app');
            return;
        }
        setVerifying(true);
        try {
            await verifyPayment(bookingId, { type, transactionId: txnId });
            toast.success('Payment verified successfully!');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            toast.error('Payment verification failed. Please check transaction ID.');
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <span className="text-emerald-600 font-semibold animate-pulse">Generating Secure QR Code...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
            <div className="max-w-md mx-auto">
                <div className="mb-8">
                    <button onClick={() => navigate('/dashboard')} className="text-slate-500 text-sm hover:text-emerald-600 transition-colors mb-4 block">← Back to Dashboard</button>
                    <h1 className="font-bold text-2xl text-slate-900">Secure Payment</h1>
                    <p className="text-slate-500 text-sm mt-1">Scan the QR code to pay your vehicle {type === 'DEPOSIT' ? 'security deposit' : 'rental fee'}.</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center">
                    <div className="w-full flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Payment Type</span>
                        <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg text-sm">{type}</span>
                    </div>

                    <p className="text-slate-500 text-sm mb-2">Amount to pay</p>
                    <p className="text-4xl font-black text-emerald-600 mb-8">₹{amount?.toLocaleString()}</p>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
                        {qrData ? (
                            <img src={qrData} alt="UPI QR Code" className="w-48 h-48 object-contain mix-blend-multiply" />
                        ) : (
                            <div className="w-48 h-48 flex items-center justify-center text-slate-400">QR Error</div>
                        )}
                    </div>

                    <p className="text-xs text-center text-slate-500 max-w-[250px] mb-8 leading-relaxed">
                        Scan with GPay, PhonePe, Paytm or any UPI app to complete the payment.
                    </p>

                    <form onSubmit={handleVerify} className="w-full">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Enter Transaction ID</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="e.g. 123456789012"
                            value={txnId}
                            onChange={(e) => setTxnId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all mb-4"
                        />
                        
                        {type === 'RENTAL' && (
                            <label className="flex items-start gap-2 mb-4 text-xs text-slate-700 bg-amber-50 p-3 rounded-xl border border-amber-200 cursor-pointer">
                                <input type="checkbox" required className="mt-0.5 accent-amber-600 w-4 h-4 cursor-pointer" />
                                <span>I have reviewed the vehicle's condition post-deposit and agree to the final terms and conditions for taking possession of the vehicle.</span>
                            </label>
                        )}

                        <button 
                            type="submit" 
                            disabled={verifying}
                            className="w-full bg-emerald-600 text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {verifying ? 'Verifying...' : 'Confirm Payment'}
                        </button>
                    </form>
                </div>
                
                <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-2">
                    <span>🔒</span> Payments are securely processed 
                </p>
            </div>
        </div>
    );
};

export default PaymentPage;
