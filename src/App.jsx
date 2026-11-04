import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { ShoppingCart, Send, Save, CheckCircle, Search, Stethoscope, Phone, User, MapPin, Eye, Printer, X, ShieldAlert, LogOut, Lock, KeyRound, ShieldCheck, LogIn, CreditCard, PhoneCall, Check } from 'lucide-react';

export default function StaffApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('billing'); // 'billing' | 'history' | 'credits' | 'inventory'
  
  // Login Form State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Change Password Modal State
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeUser, setChangeUser] = useState('');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [changeMsg, setChangeMsg] = useState('');

  // Inventory & Catalog State
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Billing Counter State
  const [cart, setCart] = useState([]);
  const [patient, setPatient] = useState({ name: '', phone: '', locality: '' });
  const [discountType, setDiscountType] = useState('none'); // 'none', 'percent', 'flat'
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash', 'online', 'credit', 'split'
  const [cashPaid, setCashPaid] = useState('');
  const [existingCredit, setExistingCredit] = useState(0);
  const [payOldBalance, setPayOldBalance] = useState(false);
  const [partialOldPay, setPartialOldPay] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Bill History & Credits State
  const [bills, setBills] = useState([]);
  const [credits, setCredits] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    if (user) {
      fetchMedicines();
      fetchBills();
      fetchCredits();
    }
  }, [user]);

  async function fetchMedicines() {
    const { data } = await supabase.from('medicines').select('*').order('name');
    if (data) setMedicines(data);
  }

  async function fetchBills() {
    const { data } = await supabase.from('bills').select('*, bill_items(*, medicines(name))').order('created_at', { ascending: false });
    if (data) setBills(data);
  }

  async function fetchCredits() {
    const { data } = await supabase.from('credits').select('*').order('created_at', { ascending: false });
    if (data) setCredits(data);
  }

  async function checkPatientCredit(phone) {
    if (!phone || phone.length < 10) {
      setExistingCredit(0);
      setPayOldBalance(false);
      setPartialOldPay('');
      return;
    }
    const { data } = await supabase
      .from('credits')
      .select('credit_amount')
      .eq('patient_phone', phone.trim())
      .eq('status', 'Pending');

    if (data && data.length > 0) {
      const totalPend = data.reduce((sum, c) => sum + Number(c.credit_amount), 0);
      setExistingCredit(totalPend);
      setPartialOldPay(totalPend);
    } else {
      setExistingCredit(0);
      setPayOldBalance(false);
      setPartialOldPay('');
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    const { data, error } = await supabase
      .from('clinic_users')
      .select('*')
      .eq('username', loginUser.trim())
      .eq('password', loginPass.trim())
      .maybeSingle();

    if (error || !data) {
      setLoginError('Invalid username or password.');
    } else {
      setUser(data);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangeMsg('');

    const { data, error } = await supabase
      .from('clinic_users')
      .select('*')
      .eq('username', changeUser.trim())
      .eq('password', oldPass.trim())
      .maybeSingle();

    if (error || !data) {
      setChangeMsg('❌ Incorrect username or old password.');
      return;
    }

    const { error: updateErr } = await supabase
      .from('clinic_users')
      .update({ password: newPass.trim() })
      .eq('id', data.id);

    if (updateErr) {
      setChangeMsg('❌ Error updating password.');
    } else {
      setChangeMsg('✅ Password updated successfully! Please login.');
      setTimeout(() => {
        setShowChangeModal(false);
        setChangeMsg('');
        setChangeUser('');
        setOldPass('');
        setNewPass('');
      }, 2000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans antialiased">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 border border-slate-200">
          <div className="text-center space-y-2">
            <div className="bg-emerald-700 text-white w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-md">
              <ShieldCheck size={28}/>
            </div>
            <h2 className="text-2xl font-black text-slate-900">Dr. Gondhane Staff</h2>
            <p className="text-xs text-slate-500">Secure Staff Terminal • Powered by MithTechX</p>
          </div>

          {loginError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-2xl font-bold text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-3.5 text-slate-400"/>
                <input 
                  type="text" 
                  required
                  placeholder="Enter staff username"
                  value={loginUser} 
                  onChange={e => setLoginUser(e.target.value)} 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-3.5 text-slate-400"/>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={loginPass} 
                  onChange={e => setLoginPass(e.target.value)} 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            <button type="submit" className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2">
              <LogIn size={18}/> Login to Staff Terminal
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <button onClick={() => setShowChangeModal(true)} className="text-xs font-bold text-emerald-700 hover:underline flex items-center justify-center gap-1 mx-auto">
              <KeyRound size={14}/> Change Password
            </button>
          </div>
        </div>

        {showChangeModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 relative">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2"><KeyRound size={18} className="text-emerald-700"/> Change Password</h3>
                <button onClick={() => setShowChangeModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              {changeMsg && (
                <div className={`text-xs p-3 rounded-2xl font-bold text-center ${changeMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                  {changeMsg}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <input type="text" required placeholder="Username" value={changeUser} onChange={e => setChangeUser(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500"/>
                <input type="password" required placeholder="Old Password" value={oldPass} onChange={e => setOldPass(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500"/>
                <input type="password" required placeholder="New Password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500"/>
                
                <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-sm transition">
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const addToCart = (med) => {
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      setCart(cart.map(item => item.id === med.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...med, qty: 1 }]);
    }
  };

  const updateQty = (id, qty) => {
    const numericQty = Number(qty);
    if (numericQty <= 0 || isNaN(numericQty)) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => item.id === id ? { ...item, qty: numericQty } : item));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.selling_price || 0) * item.qty), 0);
  
  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = (subtotal * Number(discountValue || 0)) / 100;
  } else if (discountType === 'flat') {
    discountAmount = Number(discountValue || 0);
  }
  
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const oldBalanceToAdd = payOldBalance ? Number(partialOldPay || 0) : 0;
  const totalWithOldBalance = grandTotal + oldBalanceToAdd;

  const handleCheckout = async (openWhatsApp = false) => {
    if (cart.length === 0 && (!payOldBalance || oldBalanceToAdd <= 0)) {
      alert('Please add medicines or enter an old balance payment amount.');
      return;
    }

    const finalBillAmount = totalWithOldBalance;
    let paidAmt = finalBillAmount;
    let creditAmt = 0;

    if (paymentMode === 'credit') {
      paidAmt = 0;
      creditAmt = finalBillAmount;
    } else if (paymentMode === 'split') {
      paidAmt = Number(cashPaid || 0);
      creditAmt = Math.max(0, finalBillAmount - paidAmt);
    }

    const { data: billData, error: billError } = await supabase.from('bills').insert([{
      patient_name: patient.name || 'Walk-in Patient',
      patient_phone: patient.phone || '0000000000',
      locality: patient.locality || 'Clinic',
      total_amount: finalBillAmount
    }]).select().single();

    if (billError) {
      alert('Error saving bill: ' + billError.message);
      return;
    }

    for (let item of cart) {
      await supabase.from('bill_items').insert([{
        bill_id: billData.id,
        medicine_id: item.id,
        quantity: item.qty,
        price: item.selling_price || 0
      }]);
      await supabase.from('medicines').update({ stock: Math.max(0, (item.stock || 0) - item.qty) }).eq('id', item.id);
    }

    if (payOldBalance && oldBalanceToAdd > 0) {
      const { data: pendingCredits } = await supabase
        .from('credits')
        .select('*')
        .eq('patient_phone', patient.phone.trim())
        .eq('status', 'Pending')
        .order('created_at', { ascending: true });

      let remainingToPay = oldBalanceToAdd;
      if (pendingCredits) {
        for (let creditRecord of pendingCredits) {
          if (remainingToPay <= 0) break;
          const dueOnThis = Number(creditRecord.credit_amount);
          if (remainingToPay >= dueOnThis) {
            await supabase.from('credits').update({ status: 'Settled' }).eq('id', creditRecord.id);
            remainingToPay -= dueOnThis;
          } else {
            const newDue = dueOnThis - remainingToPay;
            await supabase.from('credits').update({ credit_amount: newDue }).eq('id', creditRecord.id);
            remainingToPay = 0;
          }
        }
      }
    }

    if (creditAmt > 0) {
      await supabase.from('credits').insert([{
        patient_name: patient.name || 'Patient',
        patient_phone: patient.phone || '0000000000',
        total_bill_amount: finalBillAmount,
        paid_amount: paidAmt,
        credit_amount: creditAmt,
        status: 'Pending'
      }]);
    }

    setSuccessMsg('Bill Generated & Stock Updated Successfully!');
    
    if (openWhatsApp && patient.phone) {
      let message = `*Dr. Gondhane Clinic*\nPatient: ${patient.name || 'Patient'}\nDate: ${new Date().toLocaleString()}\n\n`;
      if (cart.length > 0) {
        message += `*Prescribed Medicines:*\n`;
        cart.forEach(i => {
          message += `- ${i.name} (${i.qty} x ₹${i.selling_price}) = ₹${i.qty * i.selling_price}\n`;
        });
      }
      if (discountAmount > 0) message += `Discount: -₹${discountAmount}\n`;
      if (payOldBalance && oldBalanceToAdd > 0) message += `Old Balance Paid: ₹${oldBalanceToAdd}\n`;
      message += `\n*Grand Total: ₹${finalBillAmount}*\nPaid: ₹${paidAmt} | Credit/Due: ₹${creditAmt}\nThank you! Get well soon.`;
      
      const encodedMsg = encodeURIComponent(message);
      const phoneClean = patient.phone.replace(/\D/g, '');
      window.open(`https://wa.me/91${phoneClean}?text=${encodedMsg}`, '_blank');
    }

    setCart([]);
    setPatient({ name: '', phone: '', locality: '' });
    setDiscountType('none');
    setDiscountValue(0);
    setPaymentMode('cash');
    setCashPaid('');
    setExistingCredit(0);
    setPayOldBalance(false);
    setPartialOldPay('');
    fetchMedicines();
    fetchBills();
    fetchCredits();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const settleCreditDirectly = async (creditId) => {
    const { error } = await supabase.from('credits').update({ status: 'Settled' }).eq('id', creditId);
    if (!error) {
      fetchCredits();
      alert('Credit marked as settled successfully!');
    }
  };

  const filteredMedicines = medicines.filter(m => (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (m.category || '').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      <header className="bg-emerald-800 text-white shadow-md p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-700 p-2.5 rounded-2xl border border-emerald-600 shadow-inner">
              <Stethoscope size={24} className="text-emerald-100" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Dr. Gondhane Clinic</h1>
              <p className="text-xs text-emerald-200">Staff Terminal • Powered by MithTechX</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-emerald-900/80 p-1 rounded-2xl border border-emerald-700 flex-wrap">
              <button 
                onClick={() => setActiveTab('billing')} 
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'billing' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100 hover:text-white'}`}
              >
                Billing Counter
              </button>
              <button 
                onClick={() => setActiveTab('history')} 
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'history' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100 hover:text-white'}`}
              >
                Bill History
              </button>
              <button 
                onClick={() => setActiveTab('credits')} 
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'credits' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100 hover:text-white'}`}
              >
                Credit Ledger
              </button>
              <button 
                onClick={() => setActiveTab('inventory')} 
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'inventory' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100 hover:text-white'}`}
              >
                Stock Lookup
              </button>
            </div>

            <button onClick={() => setUser(null)} className="p-2.5 bg-emerald-900 hover:bg-rose-700 text-emerald-100 hover:text-white rounded-2xl transition shadow-sm" title="Logout">
              <LogOut size={16}/>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 w-full flex-1 space-y-6">
        
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                <Search size={18} className="text-slate-400"/>
                <input 
                  type="text" 
                  placeholder="Search medicines by name or category..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  className="w-full text-sm outline-none bg-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-[68vh] overflow-y-auto pr-1">
                {filteredMedicines.map(med => (
                  <div 
                    key={med.id} 
                    onClick={() => (med.stock || 0) > 0 && addToCart(med)} 
                    className={`p-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between cursor-pointer transition hover:border-emerald-500 hover:shadow-md ${(med.stock || 0) <= 0 ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                  >
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{med.category || 'General'}</span>
                      <h4 className="font-bold text-slate-900 mt-2 text-sm">{med.name}</h4>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-emerald-700 font-black text-sm">₹{med.selling_price || 0}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${(med.stock || 0) > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                        Stock: {med.stock || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <ShoppingCart size={18} className="text-emerald-700"/> Counter Bill Cart
                    </h3>
                    {successMsg && <span className="text-xs text-emerald-700 font-bold flex items-center gap-1"><CheckCircle size={14}/> {successMsg}</span>}
                  </div>

                  <div className="space-y-2.5">
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-3 text-slate-400"/>
                      <input type="text" placeholder="Patient Name" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500"/>
                    </div>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-3 text-slate-400"/>
                      <input 
                        type="text" 
                        placeholder="Phone Number (for WhatsApp & Credit)" 
                        value={patient.phone} 
                        onChange={e => { 
                          setPatient({...patient, phone: e.target.value}); 
                          checkPatientCredit(e.target.value); 
                        }} 
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-3 text-slate-400"/>
                      <input type="text" placeholder="Locality / Address" value={patient.locality} onChange={e => setPatient({...patient, locality: e.target.value})} className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500"/>
                    </div>
                  </div>

                  {existingCredit > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-bold text-amber-800">
                        <span>⚠️ Total Pending Due:</span>
                        <span className="text-rose-600 text-sm font-black">₹{existingCredit}</span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1 border-t border-amber-100">
                        <input type="checkbox" checked={payOldBalance} onChange={e => setPayOldBalance(e.target.checked)} className="rounded text-emerald-700 w-4 h-4"/>
                        Pay Old Balance in this bill
                      </label>

                      {payOldBalance && (
                        <div className="space-y-1 pt-1">
                          <label className="text-[11px] font-bold text-amber-900 uppercase">Amount to pay now (Full or Partial):</label>
                          <input 
                            type="number" 
                            max={existingCredit}
                            value={partialOldPay} 
                            onChange={e => setPartialOldPay(e.target.value)} 
                            className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                            placeholder="Enter amount..."
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-3 max-h-36 overflow-y-auto space-y-2 pr-1">
                    {cart.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-6">No medicines added to cart yet.</p>
                    ) : (
                      cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100 gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 truncate">{item.name}</p>
                            <p className="text-slate-500">₹{item.selling_price || 0} each</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-7 h-7 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center">-</button>
                            <input 
                              type="number" 
                              value={item.qty} 
                              onChange={e => updateQty(item.id, e.target.value)} 
                              className="w-12 h-7 bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900 text-xs outline-none focus:border-emerald-500"
                            />
                            <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-7 h-7 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center">+</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Discounts</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[5, 10, 15, 20].map(pct => (
                        <button 
                          key={pct}
                          onClick={() => { setDiscountType('percent'); setDiscountValue(pct); }}
                          className={`py-2 rounded-xl text-xs font-bold border transition ${discountType === 'percent' && discountValue === pct ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                    <input 
                      type="number" 
                      placeholder="Flat discount amount (₹)..." 
                      value={discountType === 'flat' ? discountValue : ''}
                      onChange={e => { setDiscountType('flat'); setDiscountValue(e.target.value); }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Payment Mode</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'cash', label: 'Cash' },
                        { id: 'online', label: 'Online' },
                        { id: 'credit', label: 'Credit' },
                        { id: 'split', label: 'Split' }
                      ].map(m => (
                        <button 
                          key={m.id}
                          onClick={() => setPaymentMode(m.id)}
                          className={`py-2 rounded-xl text-xs font-bold border transition ${paymentMode === m.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {paymentMode === 'split' && (
                      <input 
                        type="number" 
                        placeholder="Enter amount paid on spot..." 
                        value={cashPaid}
                        onChange={e => setCashPaid(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-emerald-500 mt-2"
                      />
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal}</span></div>
                    {discountAmount > 0 && <div className="flex justify-between text-rose-600"><span>Discount:</span><span>-₹{discountAmount}</span></div>}
                    {payOldBalance && oldBalanceToAdd > 0 && <div className="flex justify-between text-amber-700"><span>Old Balance Payment:</span><span>+₹{oldBalanceToAdd}</span></div>}
                    <div className="flex justify-between items-center font-black text-base text-slate-900 pt-1 border-t border-slate-100">
                      <span>Grand Total:</span>
                      <span className="text-emerald-700 text-xl">₹{totalWithOldBalance}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleCheckout(false)} className="py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm">
                      <Save size={14}/> Save Bill
                    </button>
                    <button onClick={() => handleCheckout(true)} className="py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm">
                      <Send size={14}/> WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'credits' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900">Customer Credit Ledger (Udhar Khata)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Track pending balances, call customers directly, or settle accounts.</p>
              </div>
              <span className="text-xs font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-xl">
                {credits.filter(c => c.status === 'Pending').length} Pending Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-xs uppercase border-b border-slate-200">
                    <th className="p-4">Date</th>
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Bill Total</th>
                    <th className="p-4">Paid</th>
                    <th className="p-4">Due Credit</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {credits.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-8 text-slate-400 text-xs">No credit records found.</td></tr>
                  ) : (
                    credits.map(cr => (
                      <tr key={cr.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 text-slate-500 text-xs">{new Date(cr.created_at).toLocaleDateString()}</td>
                        <td className="p-4 font-bold text-slate-900">{cr.patient_name}</td>
                        <td className="p-4 font-mono text-slate-700 text-xs">{cr.patient_phone}</td>
                        <td className="p-4 font-bold">₹{cr.total_bill_amount}</td>
                        <td className="p-4 text-emerald-700">₹{cr.paid_amount}</td>
                        <td className="p-4 text-rose-600 font-black">₹{cr.credit_amount}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${cr.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {cr.status}
                          </span>
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <a href={`tel:${cr.patient_phone}`} className="p-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition" title="Call Customer">
                            <PhoneCall size={14}/>
                          </a>
                          {cr.status === 'Pending' && (
                            <button onClick={() => settleCreditDirectly(cr.id)} className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition flex items-center gap-1">
                              <Check size={14}/> Settle
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900">Patient Bill History</h3>
                <p className="text-xs text-slate-400 mt-0.5">Staff view: View receipts, print, or dispatch via WhatsApp.</p>
              </div>
              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl text-xs font-semibold">
                <ShieldAlert size={14}/> Deletion Restricted to Admin
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-xs uppercase border-b border-slate-200">
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Locality</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.map(bill => (
                    <tr key={bill.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 text-slate-500 text-xs">{new Date(bill.created_at).toLocaleString()}</td>
                      <td className="p-4 font-bold text-slate-900">{bill.patient_name}</td>
                      <td className="p-4 text-slate-600 text-xs">{bill.patient_phone}</td>
                      <td className="p-4 text-slate-600">{bill.locality}</td>
                      <td className="p-4 text-emerald-700 font-black">₹{bill.total_amount}</td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedBill(bill)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1">
                          <Eye size={14}/> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-900">Medicine Stock Lookup</h3>
                <p className="text-xs text-slate-400 mt-0.5">Check real-time stock levels and pricing before billing.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400"/>
                <input type="text" placeholder="Search stock..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"/>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-xs uppercase border-b border-slate-200">
                    <th className="p-4">Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Batch</th>
                    <th className="p-4">Expiry</th>
                    <th className="p-4">Price</th>
                    <th className="p-4 text-right">Available Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMedicines.map(med => (
                    <tr key={med.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-bold text-slate-900">{med.name}</td>
                      <td className="p-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs">{med.category || 'General'}</span></td>
                      <td className="p-4 text-slate-500 text-xs font-mono">{med.batch_no || '-'}</td>
                      <td className="p-4 text-slate-500 text-xs">{med.expiry_date || '-'}</td>
                      <td className="p-4 text-emerald-700 font-extrabold">₹{med.selling_price || 0}</td>
                      <td className="p-4 text-right">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${(med.stock || 0) > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                          {med.stock || 0} units
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-6 relative border border-slate-200">
            <button onClick={() => setSelectedBill(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X size={20}/></button>
            <div className="text-center border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900">Dr. Gondhane Clinic</h2>
              <p className="text-xs text-slate-500">Official Patient Receipt / Prescription Bill</p>
              <p className="text-[11px] text-slate-400 mt-1">{new Date(selectedBill.created_at).toLocaleString()}</p>
            </div>
            <div className="space-y-1.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p><strong className="text-slate-700">Patient Name:</strong> {selectedBill.patient_name}</p>
              <p><strong className="text-slate-700">Phone:</strong> {selectedBill.patient_phone}</p>
              <p><strong className="text-slate-700">Locality:</strong> {selectedBill.locality}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Billed Items</h4>
              <div className="max-h-40 overflow-y-auto space-y-2 divide-y divide-slate-100 pr-1">
                {selectedBill.bill_items && selectedBill.bill_items.map((item, idx) => (
                  <div key={idx} className="pt-2 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-slate-900">{item.medicines?.name || 'Medicine'}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity} × ₹{item.price}</p>
                    </div>
                    <span className="font-extrabold text-slate-900">₹{item.quantity * item.price}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
              <span className="font-extrabold text-base text-slate-900">Grand Total:</span>
              <span className="text-xl font-black text-emerald-700">₹{selectedBill.total_amount}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => window.print()} className="py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-black transition"><Printer size={14}/> Print Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}