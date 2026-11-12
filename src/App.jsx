
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react';

import { supabase } from './lib/supabase';

import {
  ShoppingCart,
  Send,
  Save,
  CheckCircle,
  Search,
  Stethoscope,
  Phone,
  User,
  MapPin,
  Eye,
  Printer,
  X,
  ShieldAlert,
  LogOut,
  Lock,
  KeyRound,
  ShieldCheck,
  LogIn,
  CreditCard,
  PhoneCall,
  Package,
  RotateCcw,
  IndianRupee,
  AlertCircle,
  Loader2,
  RefreshCw,
  ClipboardList,
  AlertTriangle,
  Boxes,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Filter,
  Plus
} from 'lucide-react';


// ======================================================
// HELPERS
// ======================================================

const money = value =>
  Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const todayKey = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
};

const localDateKey = value => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
};

const formatDate = value => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = value => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isMedicineExpired = medicine =>
  Boolean(
    medicine?.expiry_date &&
    medicine.expiry_date < todayKey()
  );

const inputClass =
  'w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition';

const escapeHtml = value =>
  String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);

function getBillItems(bill) {
  if (Array.isArray(bill?.items) && bill.items.length > 0) {
    return bill.items.map(item => ({
      name:
        item.name ||
        item.medicine_name ||
        item.medicines?.name ||
        'Medicine',
      qty: Number(item.qty ?? item.quantity ?? 0),
      price: Number(
        item.selling_price ??
        item.price ??
        0
      )
    }));
  }

  if (Array.isArray(bill?.bill_items)) {
    return bill.bill_items.map(item => ({
      name:
        item.name ||
        item.medicine_name ||
        item.medicines?.name ||
        'Medicine',
      qty: Number(item.qty ?? item.quantity ?? 0),
      price: Number(
        item.selling_price ??
        item.price ??
        0
      )
    }));
  }

  return [];
}


// ======================================================
// REUSABLE COMPONENTS
// ======================================================

function SummaryCard({
  title,
  value,
  icon: Icon,
  color = 'emerald'
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700'
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm min-w-0">

      <div className="flex justify-between items-center gap-2">

        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide">
          {title}
        </p>

        <div className={`p-2 rounded-xl shrink-0 ${colors[color]}`}>
          <Icon size={18} />
        </div>

      </div>

      <p className="text-xl sm:text-2xl font-black text-slate-900 mt-3 break-words">
        {value}
      </p>

    </div>
  );
}


function Message({ error, success, onClose }) {
  if (!error && !success) return null;

  return (
    <div
      role="alert"
      className={`p-3 sm:p-4 rounded-2xl border flex items-start gap-3 ${
        error
          ? 'bg-rose-50 border-rose-200 text-rose-700'
          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
      }`}
    >

      {error
        ? <AlertCircle size={18} className="shrink-0 mt-0.5" />
        : <CheckCircle size={18} className="shrink-0 mt-0.5" />}

      <p className="text-xs sm:text-sm font-semibold flex-1 break-words">
        {error || success}
      </p>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0"
          aria-label="Close message"
        >
          <X size={16} />
        </button>
      )}

    </div>
  );
}


// ======================================================
// MAIN APP
// ======================================================

export default function App() {

  // ==================================================
  // 1. AUTHENTICATION
  // ==================================================

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [loginError, setLoginError] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');


  // ==================================================
  // 2. PASSWORD CHANGE
  // ==================================================

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);


  // ==================================================
  // 3. NAVIGATION
  // ==================================================

  const [activeTab, setActiveTab] = useState('billing');


  // ==================================================
  // 4. APPLICATION DATA
  // ==================================================

  const [medicines, setMedicines] = useState([]);
  const [bills, setBills] = useState([]);
  const [credits, setCredits] = useState([]);
  const [returns, setReturns] = useState([]);

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');


  // ==================================================
  // 5. BILLING STATE
  // ==================================================

  const [cart, setCart] = useState([]);

  const [patient, setPatient] = useState({
    name: '',
    phone: '',
    locality: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [billingStep, setBillingStep] = useState(1);

  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState('');

  const [paymentMode, setPaymentMode] = useState('cash');
  const [cashPaid, setCashPaid] = useState('');


  // ==================================================
  // 6. OLD CREDIT PAYMENT
  // ==================================================

  const [existingCredit, setExistingCredit] = useState(0);
  const [payOldBalance, setPayOldBalance] = useState(false);
  const [partialOldPay, setPartialOldPay] = useState('');


  // ==================================================
  // 7. CHECKOUT STATE
  // ==================================================

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [partialCheckout, setPartialCheckout] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');


  // ==================================================
  // 8. BILL HISTORY
  // ==================================================

  const [selectedBill, setSelectedBill] = useState(null);
  const [historySearch, setHistorySearch] = useState('');


  // ==================================================
  // 9. CREDIT LEDGER
  // ==================================================

  const [creditSearch, setCreditSearch] = useState('');
  const [creditLoadingId, setCreditLoadingId] = useState(null);


  // ==================================================
  // 10. INVENTORY LOOKUP
  // ==================================================

  const [stockSearch, setStockSearch] = useState('');


  // ==================================================
  // 11. MEDICINE RETURNS
  // ==================================================

  const [selectedReturnMedicineId, setSelectedReturnMedicineId] =
    useState('');

  const [returnQuantity, setReturnQuantity] = useState('1');
  const [returnReason, setReturnReason] = useState('');

  const [returnCondition, setReturnCondition] =
    useState('resellable');

  const [returnLoading, setReturnLoading] = useState(false);

  const [returnError, setReturnError] = useState('');
  const [returnSuccess, setReturnSuccess] = useState('');

  const [returnSearch, setReturnSearch] = useState('');


  // ==================================================
  // AUTH INITIALIZATION
  // ==================================================

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(null);
      setProfileLoading(Boolean(newSession));
      setLoginError('');
    });

    async function initialize() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;
        if (error) throw error;

        const currentSession = data?.session ?? null;

        setSession(currentSession);
        setProfileLoading(Boolean(currentSession));
      } catch (error) {
        if (mounted) {
          setLoginError(
            error.message || 'Authentication initialization failed.'
          );
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    initialize();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  // ==================================================
  // VERIFY STAFF PROFILE
  // ==================================================

  useEffect(() => {
    let active = true;

    async function loadStaffProfile() {
      if (!session?.user?.id) {
        setUser(null);
        setProfileLoading(false);
        return;
      }

      setUser(null);
      setProfileLoading(true);

      try {
        const { data, error } = await supabase
          .from('clinic_users')
          .select('id, username, role, auth_user_id')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (!active) return;
        if (error) throw error;

        if (!data) {
          setLoginError(
            'Your account is not linked to a clinic user.'
          );
          return;
        }

        if (String(data.role || '').toLowerCase() !== 'staff') {
          setLoginError(
            'This application is for staff accounts only. Please use the staff account.'
          );
          return;
        }

        setUser(data);
        setLoginError('');
      } catch (error) {
        if (active) {
          setLoginError(
            error.message || 'Unable to verify staff account.'
          );
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    loadStaffProfile();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);


  // ==================================================
  // LOGIN
  // ==================================================

  async function handleLogin(event) {
    event.preventDefault();

    setLoginError('');
    setForgotMessage('');
    setLoginLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim().toLowerCase(),
        password: loginPass
      });

      if (error) throw error;

      setLoginPass('');
    } catch (error) {
      setLoginError(error.message || 'Login failed.');
    } finally {
      setLoginLoading(false);
    }
  }


  // ==================================================
  // LOGOUT
  // ==================================================

  async function handleLogout() {
    const { error } = await supabase.auth.signOut({
      scope: 'local'
    });

    if (error) {
      setLoginError(error.message);
      setDataError(error.message);
      return;
    }

    setUser(null);
    setSession(null);
    setCart([]);
    setActiveTab('billing');
    setBillingStep(1);
  }


  // ==================================================
  // FORGOT PASSWORD
  // ==================================================

  async function handleForgotPassword() {
    const email = loginEmail.trim().toLowerCase();

    if (!email) {
      setForgotMessage(
        'Enter your registered email address first.'
      );
      return;
    }

    setLoginLoading(true);
    setForgotMessage('');
    setLoginError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: window.location.origin
        }
      );

      if (error) throw error;

      setForgotMessage(
        'Password reset instructions have been requested. Check your registered email.'
      );
    } catch (error) {
      setForgotMessage(
        error.message || 'Unable to request password reset.'
      );
    } finally {
      setLoginLoading(false);
    }
  }


  // ==================================================
  // CHANGE OWN PASSWORD
  // ==================================================

  async function handleChangePassword(event) {
    event.preventDefault();

    setPasswordMessage('');

    if (newPassword.length < 8) {
      setPasswordMessage(
        'Password must contain at least 8 characters.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordMessage('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordMessage(
        error.message || 'Unable to update password.'
      );
    } finally {
      setPasswordLoading(false);
    }
  }


  // ==================================================
  // FETCH ALL APPLICATION DATA
  // ==================================================

  const fetchAllData = useCallback(async () => {
    if (!user) return;

    setDataLoading(true);
    setDataError('');

    try {
      const [
        medicineResult,
        billResult,
        creditResult,
        returnResult
      ] = await Promise.all([
        supabase
          .from('medicines')
          .select('*')
          .order('name', { ascending: true }),

        supabase
          .from('bills')
          .select('*, bill_items(*, medicines(name))')
          .order('created_at', { ascending: false })
          .limit(200),

        supabase
          .from('credits')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200),

        supabase
          .from('medicine_returns')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      const errors = [];

      if (medicineResult.error) {
        errors.push('Medicines: ' + medicineResult.error.message);
      } else {
        setMedicines(medicineResult.data || []);
      }

      if (billResult.error) {
        errors.push('Bills: ' + billResult.error.message);
      } else {
        setBills(billResult.data || []);
      }

      if (creditResult.error) {
        errors.push('Credits: ' + creditResult.error.message);
      } else {
        setCredits(creditResult.data || []);
      }

      if (returnResult.error) {
        errors.push('Returns: ' + returnResult.error.message);
      } else {
        setReturns(returnResult.data || []);
      }

      if (errors.length > 0) {
        setDataError(errors.join(' | '));
      }
    } catch (error) {
      setDataError(
        error.message || 'Unable to load application data.'
      );
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user, fetchAllData]);


  // ==================================================
  // PATIENT CREDIT CHECK
  // ==================================================

  useEffect(() => {
    let active = true;

    const phone = patient.phone.trim();
    const digits = phone.replace(/\D/g, '');

    if (digits.length < 10) {
      setExistingCredit(0);
      setPayOldBalance(false);
      setPartialOldPay('');
      return;
    }

    setExistingCredit(0);
    setPayOldBalance(false);
    setPartialOldPay('');

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('credits')
          .select('credit_amount')
          .eq('patient_phone', phone)
          .eq('status', 'Pending');

        if (!active) return;
        if (error) throw error;

        const total = (data || []).reduce(
          (sum, record) =>
            sum + Number(record.credit_amount || 0),
          0
        );

        setExistingCredit(total);
        setPartialOldPay(total > 0 ? String(total) : '');
      } catch (error) {
        if (active) {
          setCheckoutError(
            'Unable to check previous balance: ' + error.message
          );
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [patient.phone]);


  // ==================================================
  // BILLING CALCULATIONS
  // ==================================================

  const categories = useMemo(() => {
    const uniqueCategories = medicines.map(medicine =>
      (medicine.category || 'General').trim() || 'General'
    );

    return [
      'All',
      ...Array.from(new Set(uniqueCategories)).sort(
        (a, b) => a.localeCompare(b)
      )
    ];
  }, [medicines]);

  const filteredMedicines = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return medicines.filter(medicine => {
      const category =
        (medicine.category || 'General').trim() || 'General';

      const matchesCategory =
        selectedCategory === 'All' ||
        category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSearch =
        !query ||
        [
          medicine.name,
          medicine.category,
          medicine.batch_no
        ].some(value =>
          String(value || '').toLowerCase().includes(query)
        );

      return matchesCategory && matchesSearch;
    });
  }, [medicines, searchQuery, selectedCategory]);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.selling_price || item.price || 0) * item.qty,
      0
    );
  }, [cart]);

  const discountAmount = useMemo(() => {
    const value = Math.max(0, Number(discountValue || 0));

    if (discountType === 'percent') {
      return Math.min(
        subtotal,
        subtotal * Math.min(100, value) / 100
      );
    }

    if (discountType === 'flat') {
      return Math.min(subtotal, value);
    }

    return 0;
  }, [subtotal, discountType, discountValue]);

  const grandTotal = Math.max(0, subtotal - discountAmount);

  const oldBalanceToAdd = payOldBalance
    ? Number(partialOldPay || 0)
    : 0;

  const currentBillPaid =
    paymentMode === 'credit'
      ? 0
      : paymentMode === 'split'
        ? Number(cashPaid || 0)
        : grandTotal;

  const newCreditAmount = Math.max(
    0,
    grandTotal - currentBillPaid
  );

  const totalCollection =
    currentBillPaid + oldBalanceToAdd;

  const totalCartQty = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );


  // ==================================================
  // CART MANAGEMENT
  // ==================================================

  function addToCart(medicine) {
    setCheckoutError('');
    setCheckoutSuccess('');
    setWhatsappUrl('');

    if (isMedicineExpired(medicine)) {
      setCheckoutError(
        `${medicine.name} is expired and cannot be billed.`
      );
      return;
    }

    if (Number(medicine.stock || 0) <= 0) {
      setCheckoutError(
        `${medicine.name} is out of stock.`
      );
      return;
    }

    setCart(previous => {
      const existing = previous.find(
        item => item.id === medicine.id
      );

      if (existing) {
        if (existing.qty >= Number(medicine.stock)) {
          setCheckoutError(
            `Only ${medicine.stock} unit(s) of ${medicine.name} are available.`
          );
          return previous;
        }

        return previous.map(item =>
          item.id === medicine.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [...previous, { ...medicine, qty: 1 }];
    });
  }

  function updateQty(id, value) {
    const quantity = Number(value);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setCart(previous =>
        previous.filter(item => item.id !== id)
      );
      return;
    }

    setCart(previous =>
      previous.map(item => {
        if (item.id !== id) return item;

        if (quantity > Number(item.stock || 0)) {
          setCheckoutError(
            `Available stock for ${item.name} is ${item.stock} units.`
          );
          return item;
        }

        return { ...item, qty: quantity };
      })
    );
  }

  function removeFromCart(id) {
    setCart(previous =>
      previous.filter(item => item.id !== id)
    );
  }


  // ==================================================
  // PROCESS OLD CREDIT PAYMENT
  // ==================================================

  async function processOldCreditPayment(amount, phone) {
    if (amount <= 0) return;

    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .eq('patient_phone', phone.trim())
      .eq('status', 'Pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    let remaining = amount;

    for (const record of data || []) {
      if (remaining <= 0.001) break;

      const due = Number(record.credit_amount || 0);
      const alreadyPaid = Number(record.paid_amount || 0);

      const payment = Math.min(remaining, due);
      const newDue = Math.max(0, due - payment);

      const { error: updateError } = await supabase
        .from('credits')
        .update({
          credit_amount: newDue,
          paid_amount: alreadyPaid + payment,
          status: newDue <= 0.001 ? 'Settled' : 'Pending'
        })
        .eq('id', record.id);

      if (updateError) throw updateError;

      remaining -= payment;
    }

    if (remaining > 0.01) {
      throw new Error(
        'The complete old balance payment could not be allocated. Check the credit ledger.'
      );
    }
  }


  // ==================================================
  // WHATSAPP RECEIPT
  // ==================================================

  function createWhatsAppUrl() {
    const phone = patient.phone.replace(/\D/g, '');

    if (!phone) return '';

    const whatsappPhone =
      phone.startsWith('91') ? phone : `91${phone}`;

    let message =
      `Hello *${patient.name || 'Patient'}*,\n` +
      `Thank you for visiting *Dr. Gondhane Skin Care Clinic*.\n\n` +
      `*Billed Items:*\n`;

    if (cart.length > 0) {
      message += cart.map(item => {
        const price = Number(
          item.selling_price || item.price || 0
        );

        return `• ${item.name} (x${item.qty}) - ${money(price * item.qty)}`;
      }).join('\n');
    } else {
      message += 'Old balance payment only';
    }

    message += `\n\nSubtotal: ${money(subtotal)}\n`;

    if (discountAmount > 0) {
      message += `Discount: -${money(discountAmount)}\n`;
    }

    message += `*Current Bill Total: ${money(grandTotal)}*\n`;
    message += `Payment Mode: *${paymentMode.toUpperCase()}*\n`;
    message += `Paid on Current Bill: ${money(currentBillPaid)}\n`;

    if (newCreditAmount > 0) {
      message += `New Due: ${money(newCreditAmount)}\n`;
    }

    if (oldBalanceToAdd > 0) {
      message += `Old Balance Paid: ${money(oldBalanceToAdd)}\n`;
    }

    message += '\nSoftware by MithTechX.';

    return `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
  }


  // ==================================================
  // BILL CHECKOUT
  // ==================================================

  async function handleCheckout(openWhatsApp = false) {
    if (checkoutLoading || partialCheckout) return;

    setCheckoutError('');
    setCheckoutSuccess('');
    setWhatsappUrl('');

    if (!patient.name.trim()) {
      setCheckoutError('Please enter patient name.');
      return;
    }

    if (
      cart.length === 0 &&
      (!payOldBalance || oldBalanceToAdd <= 0)
    ) {
      setCheckoutError(
        'Add medicines or enter an old balance payment amount.'
      );
      return;
    }

    const phoneDigits = patient.phone.replace(/\D/g, '');

    if (patient.phone.trim() && phoneDigits.length < 10) {
      setCheckoutError(
        'Enter a valid patient phone number or leave it empty.'
      );
      return;
    }

    if (
      payOldBalance &&
      (
        !Number.isFinite(oldBalanceToAdd) ||
        oldBalanceToAdd <= 0 ||
        oldBalanceToAdd > existingCredit + 0.001
      )
    ) {
      setCheckoutError(
        'Enter a valid old balance payment amount not exceeding the pending due.'
      );
      return;
    }

    if (payOldBalance && phoneDigits.length < 10) {
      setCheckoutError(
        'A valid phone number is required to pay an old balance.'
      );
      return;
    }

    if (
      paymentMode === 'split' &&
      cart.length > 0 &&
      (
        !Number.isFinite(Number(cashPaid)) ||
        Number(cashPaid) < 0 ||
        Number(cashPaid) > grandTotal
      )
    ) {
      setCheckoutError(
        'Split payment must be between zero and the current bill total.'
      );
      return;
    }

    if (
      newCreditAmount > 0 &&
      phoneDigits.length < 10
    ) {
      setCheckoutError(
        'A valid phone number is required for a credit transaction.'
      );
      return;
    }

    setCheckoutLoading(true);

    let savedBillId = null;
    let hasMutatedDatabase = false;

    try {
      // Recheck stock and expiry directly in Supabase.
      let currentMedicines = [];

      if (cart.length > 0) {
        const medicineIds = cart.map(item => item.id);

        const { data, error } = await supabase
          .from('medicines')
          .select('id, name, stock, expiry_date')
          .in('id', medicineIds);

        if (error) throw error;

        currentMedicines = data || [];

        for (const item of cart) {
          const current = currentMedicines.find(
            medicine => medicine.id === item.id
          );

          if (!current) {
            throw new Error(
              `${item.name} is no longer available.`
            );
          }

          if (isMedicineExpired(current)) {
            throw new Error(`${item.name} has expired.`);
          }

          if (Number(current.stock || 0) < item.qty) {
            throw new Error(
              `Insufficient stock for ${item.name}. Available: ${current.stock}.`
            );
          }
        }
      }

      // Store item snapshot for Admin receipt compatibility.
      if (cart.length > 0) {
        const itemSnapshot = cart.map(item => {
          const price = Number(
            item.selling_price || item.price || 0
          );

          return {
            id: item.id,
            medicine_id: item.id,
            name: item.name,
            category: item.category || 'General',
            batch_no: item.batch_no || null,
            qty: item.qty,
            selling_price: price,
            price
          };
        });

        const { data: billData, error: billError } = await supabase
          .from('bills')
          .insert([{
            patient_name: patient.name.trim(),
            patient_phone: patient.phone.trim() || '0000000000',
            locality: patient.locality.trim() || 'Clinic',
            total_amount: grandTotal,
            payment_mode: paymentMode,
            items: itemSnapshot
          }])
          .select()
          .single();

        if (billError) throw billError;

        savedBillId = billData.id;
        hasMutatedDatabase = true;

        // Maintain normalized bill items for Staff and Admin history.
        const normalizedItems = cart.map(item => ({
          bill_id: billData.id,
          medicine_id: item.id,
          quantity: item.qty,
          price: Number(
            item.selling_price || item.price || 0
          )
        }));

        const { error: itemError } = await supabase
          .from('bill_items')
          .insert(normalizedItems);

        if (itemError) throw itemError;

        // Reduce medicine stock with a guarded update.
        for (const item of cart) {
          const current = currentMedicines.find(
            medicine => medicine.id === item.id
          );

          const { data: stockUpdate, error: stockError } =
            await supabase
              .from('medicines')
              .update({
                stock: Number(current.stock || 0) - item.qty
              })
              .eq('id', item.id)
              .gte('stock', item.qty)
              .select('id')
              .maybeSingle();

          if (stockError) throw stockError;

          if (!stockUpdate) {
            throw new Error(
              `Stock update could not be confirmed for ${item.name}.`
            );
          }

          hasMutatedDatabase = true;
        }

        // Record new unpaid balance against this bill only.
        if (newCreditAmount > 0) {
          const { error: creditError } = await supabase
            .from('credits')
            .insert([{
              patient_name: patient.name.trim(),
              patient_phone: patient.phone.trim(),
              total_bill_amount: grandTotal,
              paid_amount: currentBillPaid,
              credit_amount: newCreditAmount,
              status: 'Pending'
            }]);

          if (creditError) throw creditError;

          hasMutatedDatabase = true;
        }
      }

      // Old payments settle previous credit records separately.
      if (payOldBalance && oldBalanceToAdd > 0) {
        await processOldCreditPayment(
          oldBalanceToAdd,
          patient.phone
        );

        hasMutatedDatabase = true;
      }

      const finalWhatsAppUrl = openWhatsApp
        ? createWhatsAppUrl()
        : '';

      setWhatsappUrl(finalWhatsAppUrl);

      setCheckoutSuccess(
        savedBillId
          ? `Bill ${String(savedBillId).slice(0, 8)} generated successfully.`
          : 'Old balance payment recorded successfully.'
      );

      setCart([]);

      setPatient({
        name: '',
        phone: '',
        locality: ''
      });

      setDiscountType('none');
      setDiscountValue('');
      setPaymentMode('cash');
      setCashPaid('');

      setExistingCredit(0);
      setPayOldBalance(false);
      setPartialOldPay('');

      setBillingStep(1);
      setPartialCheckout(false);

      await fetchAllData();
    } catch (error) {
      console.error('Checkout error:', error);

      if (savedBillId || hasMutatedDatabase) {
        setPartialCheckout(true);

        setCheckoutError(
          `A database operation failed after some records may have been saved. ${savedBillId ? `Bill ${String(savedBillId).slice(0, 8)} was created. ` : ''}Error: ${error.message}. Do not submit again. Ask the administrator to inspect the bill, stock and credit records.`
        );
      } else {
        setCheckoutError(
          error.message || 'Unable to complete checkout.'
        );
      }
    } finally {
      setCheckoutLoading(false);
    }
  }


  // ==================================================
  // SETTLE CREDIT
  // ==================================================

  async function settleCredit(credit) {
    const confirmed = window.confirm(
      `Mark the remaining ${money(credit.credit_amount)} balance for ${credit.patient_name} as settled?`
    );

    if (!confirmed) return;

    setCreditLoadingId(credit.id);

    try {
      const updatedPaid =
        Number(credit.paid_amount || 0) +
        Number(credit.credit_amount || 0);

      const { error } = await supabase
        .from('credits')
        .update({
          status: 'Settled',
          credit_amount: 0,
          paid_amount: updatedPaid
        })
        .eq('id', credit.id);

      if (error) throw error;

      await fetchAllData();
    } catch (error) {
      setDataError(
        'Unable to settle credit: ' + error.message
      );
    } finally {
      setCreditLoadingId(null);
    }
  }


  // ==================================================
  // MEDICINE RETURNS
  // ==================================================

  const selectedReturnMedicine = useMemo(() => {
    return medicines.find(
      medicine => medicine.id === selectedReturnMedicineId
    ) || null;
  }, [medicines, selectedReturnMedicineId]);

  const validReturnQuantity =
    Number.isInteger(Number(returnQuantity)) &&
    Number(returnQuantity) > 0;

  const returnUnitPrice = Number(
    selectedReturnMedicine?.selling_price || 0
  );

  const returnTotal = validReturnQuantity
    ? returnUnitPrice * Number(returnQuantity)
    : 0;

  const returnExpired = isMedicineExpired(
    selectedReturnMedicine
  );

  const returnWillRestoreStock =
    returnCondition === 'resellable' &&
    !returnExpired;

  async function handleReturnSubmit(event) {
    event.preventDefault();

    setReturnError('');
    setReturnSuccess('');

    if (!selectedReturnMedicine) {
      setReturnError('Select a medicine.');
      return;
    }

    if (!validReturnQuantity) {
      setReturnError(
        'Enter a valid whole-number quantity.'
      );
      return;
    }

    if (returnReason.trim().length < 3) {
      setReturnError('Enter a valid return reason.');
      return;
    }

    setReturnLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        'record_medicine_return',
        {
          p_medicine_id: selectedReturnMedicine.id,
          p_quantity: Number(returnQuantity),
          p_reason: returnReason.trim(),
          p_item_condition: returnCondition
        }
      );

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result) {
        throw new Error(
          'The database did not confirm the return.'
        );
      }

      setReturnSuccess(
        Number(result.stock_added || 0) > 0
          ? `Return recorded successfully. ${result.stock_added} unit(s) added to stock.`
          : 'Return recorded. The item was not added to saleable stock.'
      );

      setSelectedReturnMedicineId('');
      setReturnQuantity('1');
      setReturnReason('');
      setReturnCondition('resellable');

      await fetchAllData();
    } catch (error) {
      setReturnError(
        error.message || 'Unable to record return.'
      );
    } finally {
      setReturnLoading(false);
    }
  }


  // ==================================================
  // FILTERED DATA
  // ==================================================

  const filteredStock = useMemo(() => {
    const query = stockSearch.trim().toLowerCase();

    return medicines.filter(medicine =>
      !query ||
      [
        medicine.name,
        medicine.category,
        medicine.batch_no
      ].some(value =>
        String(value || '').toLowerCase().includes(query)
      )
    );
  }, [medicines, stockSearch]);

  const filteredBills = useMemo(() => {
    const query = historySearch.trim().toLowerCase();

    return bills.filter(bill =>
      !query ||
      [
        bill.patient_name,
        bill.patient_phone,
        bill.locality,
        bill.id
      ].some(value =>
        String(value || '').toLowerCase().includes(query)
      )
    );
  }, [bills, historySearch]);

  const filteredCredits = useMemo(() => {
    const query = creditSearch.trim().toLowerCase();

    return credits.filter(credit =>
      !query ||
      [
        credit.patient_name,
        credit.patient_phone
      ].some(value =>
        String(value || '').toLowerCase().includes(query)
      )
    );
  }, [credits, creditSearch]);

  const filteredReturns = useMemo(() => {
    const query = returnSearch.trim().toLowerCase();

    return returns.filter(item =>
      !query ||
      [
        item.medicine_name,
        item.batch_no,
        item.reason
      ].some(value =>
        String(value || '').toLowerCase().includes(query)
      )
    );
  }, [returns, returnSearch]);


  // ==================================================
  // TODAY'S RETURN SUMMARY
  // ==================================================

  const todayReturns = useMemo(() => {
    return returns.filter(
      item => localDateKey(item.created_at) === todayKey()
    );
  }, [returns]);

  const returnSummary = useMemo(() => {
    return todayReturns.reduce((result, item) => {
      result.count += 1;
      result.quantity += Number(item.quantity || 0);
      result.value += Number(item.total_amount || 0);
      result.stock += Number(item.stock_added || 0);
      return result;
    }, {
      count: 0,
      quantity: 0,
      value: 0,
      stock: 0
    });
  }, [todayReturns]);


  // ==================================================
  // RECEIPT PRINTING
  // ==================================================

  function printReceipt(bill) {
    const items = getBillItems(bill);

    const rows = items.map(item => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">${money(item.price * item.qty)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clinic Receipt</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #111827;
              max-width: 420px;
              margin: 20px auto;
              padding: 20px;
            }
            h2, h3 { text-align: center; margin: 6px 0; }
            p { font-size: 12px; margin: 7px 0; }
            .muted { color: #64748b; }
            .line { border-top: 1px dashed #94a3b8; margin: 14px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { padding: 8px 3px; border-bottom: 1px solid #e2e8f0; }
            th { text-align: left; }
            .right { text-align: right; }
            .total { display: flex; justify-content: space-between; font-weight: 800; font-size: 18px; margin-top: 15px; }
            @media print { body { margin: 0 auto; } }
          </style>
        </head>
        <body>
          <h2>Dr. Gondhane Skin Care Clinic</h2>
          <h3>Official Patient Receipt</h3>
          <p class="muted" style="text-align:center">${escapeHtml(formatDateTime(bill.created_at))}</p>
          <div class="line"></div>
          <p><strong>Patient:</strong> ${escapeHtml(bill.patient_name)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(bill.patient_phone || 'N/A')}</p>
          <p><strong>Locality:</strong> ${escapeHtml(bill.locality || 'Clinic')}</p>
          <p><strong>Payment Mode:</strong> ${escapeHtml(bill.payment_mode || 'Cash')}</p>
          <div class="line"></div>
          <table>
            <thead>
              <tr><th>Item</th><th style="text-align:center">Qty</th><th class="right">Amount</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="total">
            <span>Grand Total</span>
            <span>${money(bill.total_amount)}</span>
          </div>
          <div class="line"></div>
          <p style="text-align:center" class="muted">Thank you for visiting!<br>Software by MithTechX</p>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      window.alert('Please allow pop-ups to print the receipt.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }


  // ==================================================
  // RECEIPT WHATSAPP
  // ==================================================

  function sendBillWhatsApp(bill) {
    const phone = String(bill.patient_phone || '').replace(/\D/g, '');

    if (phone.length < 10) {
      window.alert('This bill does not have a valid patient phone number.');
      return;
    }

    const whatsappPhone = phone.startsWith('91') ? phone : `91${phone}`;
    const items = getBillItems(bill);

    const itemLines = items.map(item =>
      `• ${item.name} (x${item.qty}) - ${money(item.price * item.qty)}`
    ).join('\n');

    const message =
      `Hello *${bill.patient_name || 'Patient'}*,\n` +
      `Thank you for visiting *Dr. Gondhane Skin Care Clinic*.\n\n` +
      `*Billed Items:*\n${itemLines || 'Items not available'}\n\n` +
      `Payment Mode: *${bill.payment_mode || 'Cash'}*\n` +
      `Total Amount: *${money(bill.total_amount)}*\n\n` +
      `Software by MithTechX.`;

    window.open(
      `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }


  // ==================================================
  // NAVIGATION TABS
  // ==================================================

  const tabs = [
    { id: 'billing', label: 'Billing Counter', icon: ShoppingCart },
    { id: 'history', label: 'Bill History', icon: ClipboardList },
    { id: 'credits', label: 'Credit Ledger', icon: CreditCard },
    { id: 'inventory', label: 'Stock Lookup', icon: Package },
    { id: 'returns', label: 'Medicine Returns', icon: RotateCcw }
  ];


  // ==================================================
  // LOGIN SCREEN
  // ==================================================

  if (authLoading || (session && profileLoading)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white space-y-3">
          <Loader2
            size={35}
            className="animate-spin mx-auto text-emerald-400"
          />
          <p className="text-sm font-bold">
            Verifying staff account...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6">

          <div className="text-center space-y-2">
            <div className="bg-emerald-700 text-white w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-md">
              <ShieldCheck size={28} />
            </div>

            <h2 className="text-2xl font-black text-slate-900">
              Dr. Gondhane Staff
            </h2>

            <p className="text-xs text-slate-500">
              Secure Staff Terminal · Powered by MithTechX
            </p>
          </div>

          <Message
            error={loginError}
            success={forgotMessage}
            onClose={() => {
              setLoginError('');
              setForgotMessage('');
            }}
          />

          <form onSubmit={handleLogin} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Staff Email
              </label>

              <div className="relative">
                <User
                  size={16}
                  className="absolute left-4 top-3.5 text-slate-400"
                />
                <input
                  type="email"
                  required
                  placeholder="staff@gmail.com"
                  autoComplete="username"
                  value={loginEmail}
                  onChange={event => setLoginEmail(event.target.value)}
                  className={`${inputClass} pl-11`}
                  disabled={loginLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-3.5 text-slate-400"
                />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={loginPass}
                  onChange={event => setLoginPass(event.target.value)}
                  className={`${inputClass} pl-11`}
                  disabled={loginLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Login to Staff Terminal
                </>
              )}
            </button>

            <button
              type="button"
              disabled={loginLoading}
              onClick={handleForgotPassword}
              className="w-full text-xs font-bold text-emerald-700 hover:underline"
            >
              Forgot password? Send reset email
            </button>

          </form>

          <div className="text-center pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-semibold">
            Software by MithTechX
          </div>
        </div>
      </div>
    );
  }


  // ==================================================
  // PROFILE NOT LINKED OR NOT STAFF
  // ==================================================

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-7 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">

          <ShieldAlert
            size={40}
            className="mx-auto text-rose-600"
          />

          <h2 className="text-xl font-black text-slate-900">
            Staff Access Required
          </h2>

          <p className="text-xs text-slate-500">
            {loginError || 'This account has not been verified for staff access.'}
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold"
          >
            Sign Out
          </button>

        </div>
      </div>
    );
  }


  // ==================================================
  // MAIN STAFF APPLICATION
  // ==================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
        }
      `}</style>


      {/* HEADER */}

      <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-40">

        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-3 sm:py-4">

          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">

              <div className="bg-emerald-700 p-2.5 rounded-xl border border-emerald-600 shrink-0">
                <Stethoscope size={22} />
              </div>

              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-black truncate">
                  Dr. Gondhane Clinic
                </h1>

                <p className="text-[9px] sm:text-xs text-emerald-200 truncate">
                  Staff Terminal · MithTechX
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2 shrink-0">

              <div className="hidden sm:block text-right mr-2">
                <p className="text-xs font-bold">
                  {user.username}
                </p>
                <p className="text-[10px] text-emerald-200">
                  Staff Account
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPasswordMessage('');
                  setShowPasswordModal(true);
                }}
                className="p-2.5 bg-emerald-900 hover:bg-emerald-700 rounded-xl transition"
                title="Change Password"
              >
                <KeyRound size={17} />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2.5 bg-emerald-900 hover:bg-rose-700 rounded-xl transition"
                title="Logout"
              >
                <LogOut size={17} />
              </button>

            </div>

          </div>


          {/* NAVIGATION */}

          <nav className="flex gap-1.5 mt-3 overflow-x-auto pb-1 -mx-1 px-1">

            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition ${
                    active
                      ? 'bg-white text-emerald-900 shadow'
                      : 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-900'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}

          </nav>

        </div>

      </header>


      {/* MAIN CONTENT */}

      <main className="max-w-7xl mx-auto p-3 sm:p-5 lg:p-6 w-full space-y-5 sm:space-y-6 pb-10">

        {dataError && (
          <Message
            error={dataError}
            onClose={() => setDataError('')}
          />
        )}

        {dataLoading && (
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Loader2 size={14} className="animate-spin" />
            Updating staff data...
          </div>
        )}


        {/* PASSWORD CHANGE MODAL */}

        {showPasswordModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">

            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-5">

              <div className="flex justify-between items-center border-b border-slate-100 pb-3">

                <h3 className="font-black text-slate-900 flex items-center gap-2">
                  <KeyRound size={18} className="text-emerald-700" />
                  Change Password
                </h3>

                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl"
                >
                  <X size={18} />
                </button>

              </div>

              {passwordMessage && (
                <Message
                  error={
                    passwordMessage.includes('successfully')
                      ? ''
                      : passwordMessage
                  }
                  success={
                    passwordMessage.includes('successfully')
                      ? passwordMessage
                      : ''
                  }
                  onClose={() => setPasswordMessage('')}
                />
              )}

              <form
                onSubmit={handleChangePassword}
                className="space-y-3"
              >

                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={event => setNewPassword(event.target.value)}
                    placeholder="New password (minimum 8 characters)"
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() => setShowNewPassword(value => !value)}
                    className="absolute right-3 top-3.5 text-slate-400"
                  >
                    {showNewPassword
                      ? <EyeOff size={17} />
                      : <Eye size={17} />}
                  </button>
                </div>

                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  className={inputClass}
                />

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-3 bg-emerald-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>

              </form>

            </div>

          </div>
        )}


        {/* =================================================
            BILLING COUNTER - STEP 1 & STEP 2
        ================================================= */}

        {activeTab === 'billing' && (

          <div className="space-y-5 pb-24">

            <div className="flex flex-wrap justify-between items-center gap-3">

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Billing Counter
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Search medicines, prepare patient bills and process payments.
                </p>
              </div>

              <div className="bg-emerald-50 text-emerald-800 rounded-xl px-3 py-2 text-xs font-bold">
                {medicines.length} Medicines Available
              </div>

            </div>

            <Message
              error={checkoutError}
              success={checkoutSuccess}
              onClose={() => {
                setCheckoutError('');
                setCheckoutSuccess('');
              }}
            />

            {partialCheckout && (
              <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl text-amber-900">
                <p className="text-xs font-black">
                  Administrator assistance required
                </p>
                <p className="text-xs mt-1">
                  A database operation failed after some records may have been saved. Do not submit this bill again. Ask the administrator to inspect the bill, inventory and credits.
                </p>
              </div>
            )}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold"
              >
                <Send size={15} />
                Open WhatsApp Receipt
              </a>
            )}


            {/* STEP 1: CATEGORY AND MEDICINE SELECTION */}

            {billingStep === 1 && (

              <div className="flex flex-col lg:flex-row gap-5">

                {/* CATEGORY SIDEBAR */}

                <aside className="w-full lg:w-60 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm shrink-0 h-fit">

                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Filter size={17} className="text-emerald-700" />
                    <h3 className="font-black text-sm text-slate-900">
                      Categories
                    </h3>
                  </div>

                  <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pt-3 pb-1">

                    {categories.map(category => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                          selectedCategory === category
                            ? 'bg-emerald-700 text-white shadow-md'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {category}
                      </button>
                    ))}

                  </div>

                </aside>


                {/* MEDICINE CATALOG */}

                <section className="flex-1 min-w-0 space-y-4">

                  <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">

                    <div className="relative">

                      <Search
                        size={18}
                        className="absolute left-4 top-3.5 text-slate-400"
                      />

                      <input
                        type="text"
                        placeholder="Search medicines by name, category or batch..."
                        value={searchQuery}
                        onChange={event => setSearchQuery(event.target.value)}
                        className={`${inputClass} pl-11`}
                      />

                    </div>

                    <div className="flex items-center justify-between mt-3 gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {selectedCategory} Medicines
                      </span>

                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                        {filteredMedicines.length} Items
                      </span>
                    </div>

                  </div>


                  {loading ? (
                    <div className="bg-white rounded-2xl p-10 text-center">
                      <Loader2 size={25} className="animate-spin mx-auto text-emerald-700" />
                      <p className="text-xs text-slate-400 mt-3">
                        Loading medicines...
                      </p>
                    </div>
                  ) : loadError ? (
                    <Message
                      error={loadError}
                      onClose={() => setLoadError('')}
                    />
                  ) : (

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">

                      {filteredMedicines.map(medicine => {
                        const inCart = cart.find(
                          item => item.id === medicine.id
                        );

                        const expired = isMedicineExpired(medicine);
                        const stock = Number(medicine.stock || 0);

                        return (
                          <button
                            type="button"
                            key={medicine.id}
                            disabled={stock <= 0 || expired}
                            onClick={() => addToCart(medicine)}
                            className={`bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border transition text-left flex flex-col justify-between min-w-0 min-h-36 sm:min-h-40 ${
                              inCart
                                ? 'border-emerald-500 bg-emerald-50/30 shadow-sm'
                                : 'border-slate-200 hover:border-emerald-400'
                            } ${
                              stock <= 0 || expired
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer'
                            }`}
                          >

                            <div className="space-y-2 min-w-0">

                              <div className="flex justify-between items-start gap-1">

                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md max-w-[75%] truncate">
                                  {medicine.category || 'General'}
                                </span>

                                {inCart && (
                                  <span className="w-5 h-5 shrink-0 bg-emerald-700 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                                    {inCart.qty}
                                  </span>
                                )}

                              </div>

                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm break-words line-clamp-2">
                                {medicine.name}
                              </h4>

                              <p className="text-[9px] text-slate-400">
                                Batch: {medicine.batch_no || '—'}
                              </p>

                            </div>

                            <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">

                              <div className="flex justify-between items-center gap-1">

                                <span className="text-xs font-black text-emerald-700">
                                  {money(medicine.selling_price || medicine.price)}
                                </span>

                                <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${
                                  expired
                                    ? 'bg-rose-50 text-rose-700'
                                    : stock <= 5
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {expired ? 'EXPIRED' : `Stock: ${stock}`}
                                </span>

                              </div>

                              <p className="text-center text-[10px] font-bold text-emerald-700">
                                {expired
                                  ? 'Not available'
                                  : stock <= 0
                                    ? 'Out of stock'
                                    : inCart
                                      ? 'Add another'
                                      : '+ Add to bill'}
                              </p>

                            </div>

                          </button>
                        );
                      })}

                    </div>

                  )}

                  {!loading && !loadError && filteredMedicines.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                      <Package size={28} className="mx-auto text-slate-300" />
                      <p className="text-sm font-bold text-slate-600 mt-3">
                        No medicines found
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try another search or category.
                      </p>
                    </div>
                  )}

                </section>

              </div>

            )}


            {/* STEP 2: PATIENT AND PAYMENT */}

            {billingStep === 2 && (

              <div className="max-w-3xl mx-auto bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-5">

                <div className="flex justify-between items-center border-b border-slate-100 pb-4 gap-2">

                  <div className="flex items-center gap-3 min-w-0">

                    <button
                      type="button"
                      onClick={() => setBillingStep(1)}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl shrink-0"
                    >
                      <ArrowLeft size={18} />
                    </button>

                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                        Step 2 of 2
                      </span>

                      <h3 className="font-black text-slate-900 text-lg mt-2">
                        Current Bill Counter
                      </h3>
                    </div>

                  </div>

                  <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl shrink-0">
                    {totalCartQty} Units
                  </span>

                </div>


                {/* PATIENT DETAILS */}

                <div className="space-y-3">

                  <h4 className="text-xs uppercase tracking-wider font-black text-slate-500">
                    Patient Information
                  </h4>

                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-4 top-3.5 text-slate-400"
                    />

                    <input
                      type="text"
                      placeholder="Patient Name *"
                      value={patient.name}
                      onChange={event =>
                        setPatient(current => ({
                          ...current,
                          name: event.target.value
                        }))
                      }
                      className={`${inputClass} pl-11`}
                      required
                    />
                  </div>

                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-4 top-3.5 text-slate-400"
                    />

                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Phone Number (for WhatsApp and Credit)"
                      value={patient.phone}
                      onChange={event =>
                        setPatient(current => ({
                          ...current,
                          phone: event.target.value
                        }))
                      }
                      className={`${inputClass} pl-11`}
                    />
                  </div>

                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-4 top-3.5 text-slate-400"
                    />

                    <input
                      type="text"
                      placeholder="Locality / Address"
                      value={patient.locality}
                      onChange={event =>
                        setPatient(current => ({
                          ...current,
                          locality: event.target.value
                        }))
                      }
                      className={`${inputClass} pl-11`}
                    />
                  </div>

                </div>


                {/* EXISTING CREDIT */}

                {existingCredit > 0 && (

                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3">

                    <div className="flex justify-between items-center gap-2 text-xs font-bold text-amber-900">
                      <span>Existing Pending Due</span>
                      <span className="text-rose-600 text-sm font-black">
                        {money(existingCredit)}
                      </span>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-2 border-t border-amber-100">

                      <input
                        type="checkbox"
                        checked={payOldBalance}
                        onChange={event =>
                          setPayOldBalance(event.target.checked)
                        }
                        className="rounded text-emerald-700 w-4 h-4"
                      />

                      Pay old balance now

                    </label>

                    {payOldBalance && (
                      <input
                        type="number"
                        min="0.01"
                        max={existingCredit}
                        step="0.01"
                        value={partialOldPay}
                        onChange={event =>
                          setPartialOldPay(event.target.value)
                        }
                        placeholder="Full or partial payment"
                        className={`${inputClass} bg-white border-amber-300`}
                      />
                    )}

                  </div>

                )}


                {/* CART ITEMS */}

                <div className="border-y border-slate-100 py-4 space-y-3">

                  <div className="flex items-center justify-between">
                    <h4 className="text-xs uppercase tracking-wider font-black text-slate-500">
                      Selected Medicines
                    </h4>

                    <button
                      type="button"
                      onClick={() => setBillingStep(1)}
                      className="text-[10px] font-bold text-emerald-700"
                    >
                      + Add More Medicines
                    </button>
                  </div>

                  {cart.map(item => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100 gap-2"
                    >

                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 break-words">
                          {item.name}
                        </p>
                        <p className="text-emerald-700 font-semibold mt-1">
                          {money(item.selling_price || item.price)} each
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">

                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="w-8 h-8 bg-white border border-slate-200 rounded-lg font-bold"
                        >
                          −
                        </button>

                        <span className="w-7 text-center font-bold">
                          {item.qty}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="w-8 h-8 bg-white border border-slate-200 rounded-lg font-bold"
                        >
                          +
                        </button>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg ml-1"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>

                    </div>
                  ))}

                  {cart.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No medicines selected. You can still process an old balance payment.
                    </p>
                  )}

                </div>


                {/* DISCOUNTS */}

                <div className="border-t border-slate-100 pt-3 space-y-3">

                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Discounts
                  </label>

                  <div className="grid grid-cols-4 gap-2">

                    {[5, 10, 15, 20].map(percent => (
                      <button
                        key={percent}
                        type="button"
                        onClick={() => {
                          setDiscountType('percent');
                          setDiscountValue(String(percent));
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                          discountType === 'percent' &&
                          Number(discountValue) === percent
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {percent}%
                      </button>
                    ))}

                  </div>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Flat discount amount (₹)"
                    value={discountType === 'flat' ? discountValue : ''}
                    onChange={event => {
                      setDiscountType('flat');
                      setDiscountValue(event.target.value);
                    }}
                    className={inputClass}
                  />

                  {discountType !== 'none' && (
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('none');
                        setDiscountValue('');
                      }}
                      className="text-[10px] font-bold text-rose-600"
                    >
                      Clear discount
                    </button>
                  )}

                </div>


                {/* PAYMENT MODE */}

                <div className="border-t border-slate-100 pt-4 space-y-3">

                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Payment Mode
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

                    {[
                      { id: 'cash', label: 'Cash' },
                      { id: 'online', label: 'Online' },
                      { id: 'credit', label: 'Credit' },
                      { id: 'split', label: 'Split' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPaymentMode(mode.id)}
                        className={`py-3 rounded-xl text-xs font-bold border transition ${
                          paymentMode === mode.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}

                  </div>

                  {paymentMode === 'split' && (
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      step="0.01"
                      placeholder="Amount paid now"
                      value={cashPaid}
                      onChange={event => setCashPaid(event.target.value)}
                      className={inputClass}
                    />
                  )}

                </div>


                {/* BILL TOTALS */}

                <div className="border-t border-slate-100 pt-4 bg-slate-50 p-4 rounded-2xl space-y-2 text-xs text-slate-600">

                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount Applied</span>
                      <span>−{money(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-slate-900 text-base">
                    <span>Current Bill Total</span>
                    <span className="text-emerald-700">
                      {money(grandTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Paid on Current Bill</span>
                    <span>{money(currentBillPaid)}</span>
                  </div>

                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>New Bill Due</span>
                    <span>{money(newCreditAmount)}</span>
                  </div>

                  {payOldBalance && oldBalanceToAdd > 0 && (
                    <div className="flex justify-between text-amber-700 font-semibold">
                      <span>Old Balance Payment</span>
                      <span>{money(oldBalanceToAdd)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 font-black text-slate-900 text-base">
                    <span>Total Collection</span>
                    <span className="text-xl sm:text-2xl text-emerald-700">
                      {money(totalCollection)}
                    </span>
                  </div>

                </div>


                {/* CHECKOUT BUTTONS */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">

                  <button
                    type="button"
                    disabled={checkoutLoading || partialCheckout}
                    onClick={() => handleCheckout(false)}
                    className="py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
                  >
                    {checkoutLoading
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Save size={16} />}
                    Save Bill & Items
                  </button>

                  <button
                    type="button"
                    disabled={checkoutLoading || partialCheckout}
                    onClick={() => handleCheckout(true)}
                    className="py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
                  >
                    <Send size={16} />
                    Save & WhatsApp
                  </button>

                </div>

              </div>

            )}


            {/* FIXED CART BAR ON STEP 1 */}

            {billingStep === 1 && (
              <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 shadow-2xl z-40">

                <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">

                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">

                    <div className="bg-emerald-700 text-white p-2.5 rounded-xl shrink-0">
                      <ShoppingCart size={20} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Selected Cart
                      </p>

                      <p className="text-xs sm:text-base font-black text-slate-900 truncate">
                        {totalCartQty} Units · {money(subtotal)}
                      </p>
                    </div>

                  </div>

                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => {
                      setCheckoutError('');
                      setCheckoutSuccess('');
                      setBillingStep(2);
                    }}
                    className="px-3 sm:px-6 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-sm shadow-lg flex items-center gap-1.5 sm:gap-2 shrink-0"
                  >
                    Next: Billing
                    <ArrowRight size={17} />
                  </button>

                </div>

              </div>
            )}

          </div>

        )}


        {/* =================================================
            BILL HISTORY - STAFF VIEW ONLY
        ================================================= */}

        {activeTab === 'history' && (

          <div className="space-y-4">

            <div className="flex flex-wrap justify-between items-center gap-3">

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Patient Bill History
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  View and print bills. Staff cannot delete bills.
                </p>
              </div>

              <div className="bg-amber-50 text-amber-700 border border-amber-100 rounded-xl px-3 py-2 text-[10px] font-bold flex items-center gap-1.5">
                <ShieldAlert size={14} />
                VIEW ONLY
              </div>

            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-3.5 text-slate-400"
                />

                <input
                  className={`${inputClass} pl-11`}
                  value={historySearch}
                  onChange={event => setHistorySearch(event.target.value)}
                  placeholder="Search patient, phone or bill ID..."
                />
              </div>
            </div>


            {/* MOBILE BILL CARDS */}

            <div className="md:hidden space-y-3">

              {filteredBills.map(bill => (
                <div
                  key={bill.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3"
                >

                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 text-sm">
                        {bill.patient_name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDateTime(bill.created_at)}
                      </p>
                    </div>

                    <span className="text-sm font-black text-emerald-700 whitespace-nowrap">
                      {money(bill.total_amount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400">Phone</p>
                      <p className="font-semibold text-slate-700">
                        {bill.patient_phone}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Locality</p>
                      <p className="font-semibold text-slate-700">
                        {bill.locality}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedBill(bill)}
                    className="w-full bg-emerald-50 text-emerald-800 py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-2"
                  >
                    <Eye size={15} />
                    View Receipt
                  </button>

                </div>
              ))}

            </div>


            {/* DESKTOP TABLE */}

            <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs uppercase">
                      <th className="p-4">Date</th>
                      <th className="p-4">Patient</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Locality</th>
                      <th className="p-4">Bill Amount</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredBills.map(bill => (
                      <tr key={bill.id}>

                        <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(bill.created_at)}
                        </td>

                        <td className="p-4 font-bold text-slate-900">
                          {bill.patient_name}
                        </td>

                        <td className="p-4 text-xs">
                          {bill.patient_phone}
                        </td>

                        <td className="p-4 text-xs">
                          {bill.locality}
                        </td>

                        <td className="p-4 font-black text-emerald-700 whitespace-nowrap">
                          {money(bill.total_amount)}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedBill(bill)}
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold"
                          >
                            <Eye size={14} className="inline mr-1" />
                            View
                          </button>
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            </div>

            {filteredBills.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-400">
                No matching bills found.
              </div>
            )}

          </div>

        )}


        {/* =================================================
            CREDIT LEDGER
        ================================================= */}

        {activeTab === 'credits' && (

          <div className="space-y-4">

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Customer Credit Ledger
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                View pending dues, contact patients and settle payments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              <SummaryCard
                title="Pending Accounts"
                value={credits.filter(credit => credit.status === 'Pending').length}
                icon={CreditCard}
                color="amber"
              />

              <SummaryCard
                title="Total Pending Due"
                value={money(
                  credits
                    .filter(credit => credit.status === 'Pending')
                    .reduce(
                      (sum, credit) =>
                        sum + Number(credit.credit_amount || 0),
                      0
                    )
                )}
                icon={IndianRupee}
                color="rose"
              />

              <SummaryCard
                title="Settled Accounts"
                value={credits.filter(credit => credit.status === 'Settled').length}
                icon={CheckCircle}
                color="emerald"
              />

            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-4 top-3.5 text-slate-400"
                />

                <input
                  className={`${inputClass} pl-11`}
                  value={creditSearch}
                  onChange={event => setCreditSearch(event.target.value)}
                  placeholder="Search patient or phone number..."
                />
              </div>
            </div>


            {/* MOBILE CREDIT CARDS */}

            <div className="md:hidden space-y-3">

              {filteredCredits.map(credit => (
                <div
                  key={credit.id}
                  className="bg-white p-4 border border-slate-200 rounded-2xl space-y-3"
                >

                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-black text-sm text-slate-900">
                        {credit.patient_name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDate(credit.created_at)}
                      </p>
                    </div>

                    <span className={`h-fit px-2 py-1 rounded-lg text-[10px] font-bold ${
                      credit.status === 'Pending'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {credit.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400">Phone</p>
                      <p className="font-bold">
                        {credit.patient_phone}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Amount Due</p>
                      <p className="font-black text-rose-600">
                        {money(credit.credit_amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">

                    <a
                      href={`tel:${String(credit.patient_phone || '').replace(/[^\d+]/g, '')}`}
                      className="flex-1 py-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center"
                    >
                      <PhoneCall size={14} className="inline mr-1" />
                      Call
                    </a>

                    {credit.status === 'Pending' && (
                      <button
                        type="button"
                        disabled={creditLoadingId === credit.id}
                        onClick={() => settleCredit(credit)}
                        className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                      >
                        {creditLoadingId === credit.id
                          ? 'Saving...'
                          : 'Settle'}
                      </button>
                    )}

                  </div>

                </div>
              ))}

            </div>


            {/* DESKTOP CREDIT TABLE */}

            <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-400 uppercase">
                      <th className="p-4">Date</th>
                      <th className="p-4">Patient</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Bill Total</th>
                      <th className="p-4">Paid</th>
                      <th className="p-4">Due</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredCredits.map(credit => (
                      <tr key={credit.id}>

                        <td className="p-4 text-xs text-slate-500">
                          {formatDate(credit.created_at)}
                        </td>

                        <td className="p-4 font-bold">
                          {credit.patient_name}
                        </td>

                        <td className="p-4 text-xs">
                          {credit.patient_phone}
                        </td>

                        <td className="p-4">
                          {money(credit.total_bill_amount)}
                        </td>

                        <td className="p-4 text-emerald-700">
                          {money(credit.paid_amount)}
                        </td>

                        <td className="p-4 font-black text-rose-600">
                          {money(credit.credit_amount)}
                        </td>

                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            credit.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {credit.status}
                          </span>
                        </td>

                        <td className="p-4 text-right">

                          <div className="flex items-center justify-end gap-2">

                            <a
                              href={`tel:${String(credit.patient_phone || '').replace(/[^\d+]/g, '')}`}
                              className="p-2 bg-emerald-50 text-emerald-700 rounded-lg"
                              title="Call"
                            >
                              <PhoneCall size={15} />
                            </a>

                            {credit.status === 'Pending' && (
                              <button
                                type="button"
                                onClick={() => settleCredit(credit)}
                                disabled={creditLoadingId === credit.id}
                                className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                              >
                                {creditLoadingId === credit.id
                                  ? 'Saving...'
                                  : 'Settle'}
                              </button>
                            )}

                          </div>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            </div>

            {filteredCredits.length === 0 && (
              <div className="bg-white rounded-2xl p-10 text-center text-xs text-slate-400">
                No credit records found.
              </div>
            )}

          </div>

        )}


        {/* =================================================
            STOCK LOOKUP
        ================================================= */}

        {activeTab === 'inventory' && (

          <div className="space-y-4">

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Medicine Stock Lookup
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Check stock, batches and expiry dates before billing.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-3.5 text-slate-400"
                />

                <input
                  type="text"
                  value={stockSearch}
                  onChange={event => setStockSearch(event.target.value)}
                  placeholder="Search medicine, category or batch..."
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>


            {/* MOBILE STOCK CARDS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">

              {filteredStock.map(medicine => (
                <div
                  key={medicine.id}
                  className="bg-white p-4 border border-slate-200 rounded-2xl space-y-3"
                >

                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-black text-sm text-slate-900 break-words">
                        {medicine.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {medicine.category || 'General'}
                      </p>
                    </div>

                    <span className={`h-fit px-2 py-1 rounded-lg text-[10px] font-bold ${
                      isMedicineExpired(medicine)
                        ? 'bg-rose-50 text-rose-700'
                        : Number(medicine.stock || 0) <= 5
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {isMedicineExpired(medicine)
                        ? 'EXPIRED'
                        : `${medicine.stock || 0} units`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] uppercase text-slate-400 font-bold">
                        Price
                      </p>
                      <p className="text-sm font-black text-emerald-700 mt-1">
                        {money(medicine.selling_price)}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] uppercase text-slate-400 font-bold">
                        Expiry
                      </p>
                      <p className="text-xs font-bold text-slate-700 mt-1">
                        {medicine.expiry_date || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Batch: {medicine.batch_no || '—'}
                  </p>

                </div>
              ))}

            </div>


            {/* DESKTOP STOCK TABLE */}

            <div className="hidden lg:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs uppercase">
                      <th className="p-4">Medicine</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Batch</th>
                      <th className="p-4">Expiry</th>
                      <th className="p-4">Selling Price</th>
                      <th className="p-4 text-right">Available Stock</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredStock.map(medicine => (
                      <tr key={medicine.id}>

                        <td className="p-4 font-bold">
                          {medicine.name}
                        </td>

                        <td className="p-4 text-xs">
                          {medicine.category || 'General'}
                        </td>

                        <td className="p-4 text-xs font-mono">
                          {medicine.batch_no || '—'}
                        </td>

                        <td className="p-4 text-xs">
                          {medicine.expiry_date || '—'}
                        </td>

                        <td className="p-4 font-bold text-emerald-700">
                          {money(medicine.selling_price)}
                        </td>

                        <td className="p-4 text-right">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isMedicineExpired(medicine)
                              ? 'bg-rose-50 text-rose-700'
                              : Number(medicine.stock || 0) <= 5
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {medicine.stock || 0} units
                          </span>
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            </div>

            {filteredStock.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-400">
                No matching medicines found.
              </div>
            )}

          </div>

        )}


        {/* =================================================
            MEDICINE RETURNS
        ================================================= */}

        {activeTab === 'returns' && (

          <div className="space-y-5">

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Medicine Returns
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Record returned medicines and update eligible stock.
              </p>
            </div>

            <Message
              error={returnError}
              success={returnSuccess}
              onClose={() => {
                setReturnError('');
                setReturnSuccess('');
              }}
            />


            {/* TODAY SUMMARY */}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

              <SummaryCard
                title="Returns Today"
                value={returnSummary.count}
                icon={ClipboardList}
                color="blue"
              />

              <SummaryCard
                title="Units Returned"
                value={returnSummary.quantity}
                icon={Package}
                color="amber"
              />

              <SummaryCard
                title="Stock Restored"
                value={returnSummary.stock}
                icon={Boxes}
                color="emerald"
              />

              <SummaryCard
                title="Return Value"
                value={money(returnSummary.value)}
                icon={IndianRupee}
                color="rose"
              />

            </div>


            {/* RETURN FORM */}

            <section className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">

              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
                  <RotateCcw size={20} />
                </div>

                <div>
                  <h3 className="font-black text-slate-900">
                    Record New Return
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter the item and return details.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleReturnSubmit}
                className="p-4 sm:p-6 space-y-4"
              >

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">
                    Select Medicine
                  </label>

                  <select
                    value={selectedReturnMedicineId}
                    onChange={event =>
                      setSelectedReturnMedicineId(event.target.value)
                    }
                    required
                    className={inputClass}
                    disabled={returnLoading}
                  >
                    <option value="">Choose medicine...</option>

                    {medicines.map(medicine => (
                      <option
                        key={medicine.id}
                        value={medicine.id}
                      >
                        {medicine.name}
                        {medicine.batch_no
                          ? ` | ${medicine.batch_no}`
                          : ''}
                      </option>
                    ))}

                  </select>
                </div>


                {selectedReturnMedicine && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Category
                      </p>
                      <p className="text-xs font-bold mt-1">
                        {selectedReturnMedicine.category || 'General'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Batch
                      </p>
                      <p className="text-xs font-bold mt-1 break-all">
                        {selectedReturnMedicine.batch_no || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Current Stock
                      </p>
                      <p className="text-xs font-bold text-emerald-700 mt-1">
                        {selectedReturnMedicine.stock || 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Expiry
                      </p>
                      <p className="text-xs font-bold mt-1">
                        {selectedReturnMedicine.expiry_date || '—'}
                      </p>
                    </div>

                  </div>
                )}


                {returnExpired && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-semibold">
                    This medicine has expired. It can be recorded as returned, but it will not be added to saleable stock.
                  </div>
                )}


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">
                      Returned Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={returnQuantity}
                      onChange={event => setReturnQuantity(event.target.value)}
                      className={inputClass}
                      disabled={returnLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">
                      Item Condition
                    </label>

                    <select
                      value={returnCondition}
                      onChange={event => setReturnCondition(event.target.value)}
                      className={inputClass}
                      disabled={returnLoading}
                    >
                      <option value="resellable">
                        Good / Resellable
                      </option>
                      <option value="not_resellable">
                        Damaged / Not Resellable
                      </option>
                    </select>
                  </div>

                </div>


                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">
                    Reason for Return
                  </label>

                  <textarea
                    rows="3"
                    required
                    maxLength={250}
                    value={returnReason}
                    onChange={event => setReturnReason(event.target.value)}
                    placeholder="Enter return reason..."
                    className={`${inputClass} resize-y`}
                    disabled={returnLoading}
                  />
                </div>


                {selectedReturnMedicine && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-2">

                    <div className="flex justify-between text-xs">
                      <span>Price per unit</span>
                      <strong>{money(returnUnitPrice)}</strong>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span>Return quantity</span>
                      <strong>
                        {validReturnQuantity
                          ? Number(returnQuantity)
                          : '—'}
                      </strong>
                    </div>

                    <div className="flex justify-between pt-2 border-t border-emerald-200">
                      <span className="text-sm font-black">
                        Estimated Return Value
                      </span>
                      <span className="text-lg font-black text-emerald-800">
                        {money(returnTotal)}
                      </span>
                    </div>

                    <p className="text-[10px] text-emerald-800 font-semibold">
                      {returnWillRestoreStock
                        ? `${Number(returnQuantity)} units will be added to available inventory.`
                        : 'No units will be added to available inventory.'}
                    </p>

                  </div>
                )}


                <button
                  type="submit"
                  disabled={
                    returnLoading ||
                    !selectedReturnMedicine ||
                    !validReturnQuantity ||
                    returnReason.trim().length < 3
                  }
                  className="w-full sm:w-auto px-7 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-black disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {returnLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Recording Return...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} />
                      Record Medicine Return
                    </>
                  )}
                </button>

              </form>

            </section>


            {/* RETURN HISTORY */}

            <section className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">

              <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">

                <div>
                  <h3 className="font-black text-slate-900">
                    Return History
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Latest 100 return transactions.
                  </p>
                </div>

                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-4 top-3.5 text-slate-400"
                  />

                  <input
                    className={`${inputClass} pl-11`}
                    value={returnSearch}
                    onChange={event => setReturnSearch(event.target.value)}
                    placeholder="Search medicine or reason..."
                  />
                </div>

              </div>


              {/* MOBILE RETURNS */}

              <div className="md:hidden divide-y divide-slate-100">

                {filteredReturns.map(item => (
                  <div key={item.id} className="p-4 space-y-2">

                    <div className="flex justify-between items-start gap-2">
                      <p className="font-black text-sm text-slate-900">
                        {item.medicine_name}
                      </p>

                      <span className={`text-[9px] px-2 py-1 rounded-lg font-bold ${
                        Number(item.stock_added) > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {Number(item.stock_added) > 0
                          ? 'Stock Added'
                          : 'Not Restocked'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">Quantity</p>
                        <p className="font-bold">{item.quantity}</p>
                      </div>

                      <div>
                        <p className="text-slate-400">Value</p>
                        <p className="font-black text-emerald-700">
                          {money(item.total_amount)}
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500">
                      Reason: {item.reason}
                    </p>

                    <p className="text-[10px] text-slate-400">
                      {formatDateTime(item.created_at)}
                    </p>

                  </div>
                ))}

              </div>


              {/* DESKTOP RETURNS */}

              <div className="hidden md:block overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase text-slate-400">
                      <th className="p-4">Medicine</th>
                      <th className="p-4">Quantity</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Condition</th>
                      <th className="p-4">Stock Added</th>
                      <th className="p-4 text-right">Value</th>
                      <th className="p-4">Date</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredReturns.map(item => (
                      <tr key={item.id}>

                        <td className="p-4 font-bold">
                          {item.medicine_name}
                        </td>

                        <td className="p-4">
                          {item.quantity}
                        </td>

                        <td className="p-4 text-xs">
                          {item.reason}
                        </td>

                        <td className="p-4 text-xs">
                          {item.item_condition === 'resellable'
                            ? 'Resellable'
                            : 'Not Resellable'}
                        </td>

                        <td className="p-4 font-bold text-emerald-700">
                          +{item.stock_added}
                        </td>

                        <td className="p-4 text-right font-black">
                          {money(item.total_amount)}
                        </td>

                        <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(item.created_at)}
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

              {filteredReturns.length === 0 && (
                <div className="p-10 text-center text-xs text-slate-400">
                  No return records found.
                </div>
              )}

            </section>

          </div>

        )}

      </main>


      {/* =================================================
          BILL RECEIPT MODAL
      ================================================= */}

      {selectedBill && (

        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[70] flex items-center justify-center p-3 sm:p-5">

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto relative">

            <button
              type="button"
              onClick={() => setSelectedBill(null)}
              className="absolute right-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-xl z-10"
              aria-label="Close receipt"
            >
              <X size={17} />
            </button>

            <div className="p-5 sm:p-7 space-y-5">

              <div className="text-center border-b border-slate-200 pb-4">

                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-700 text-white flex items-center justify-center">
                  <Stethoscope size={24} />
                </div>

                <h2 className="text-xl font-black text-slate-900 mt-3">
                  Dr. Gondhane Skin Care Clinic
                </h2>

                <p className="text-xs text-slate-500">
                  Official Patient Receipt
                </p>

                <p className="text-[10px] text-slate-400 mt-2">
                  {formatDateTime(selectedBill.created_at)}
                </p>

              </div>


              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs">

                <p>
                  <strong>Patient:</strong> {selectedBill.patient_name}
                </p>

                <p>
                  <strong>Phone:</strong> {selectedBill.patient_phone || 'N/A'}
                </p>

                <p>
                  <strong>Locality:</strong> {selectedBill.locality || 'Clinic'}
                </p>

                <p>
                  <strong>Payment Mode:</strong> {selectedBill.payment_mode || 'Cash'}
                </p>

                <p className="break-all">
                  <strong>Bill ID:</strong> {selectedBill.id}
                </p>

              </div>


              <div className="space-y-3">

                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Billed Medicines
                </h4>

                {getBillItems(selectedBill).length > 0 ? (
                  getBillItems(selectedBill).map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex justify-between gap-3 border-b border-slate-100 pb-3 text-xs"
                    >

                      <div>
                        <p className="font-bold text-slate-900">
                          {item.name}
                        </p>
                        <p className="text-slate-500 mt-1">
                          {item.qty} × {money(item.price)}
                        </p>
                      </div>

                      <p className="font-black">
                        {money(item.qty * item.price)}
                      </p>

                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">
                    No bill item details available.
                  </p>
                )}

              </div>


              <div className="border-t border-slate-200 pt-4 flex justify-between items-center">

                <span className="font-black text-base">
                  Grand Total
                </span>

                <span className="text-xl font-black text-emerald-700">
                  {money(selectedBill.total_amount)}
                </span>

              </div>


              <div className="text-center text-[10px] text-slate-400">
                Thank you. Get well soon.
                <br />
                Software by MithTechX
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

                <button
                  type="button"
                  onClick={() => printReceipt(selectedBill)}
                  className="py-3 bg-slate-900 text-white rounded-xl font-bold text-xs flex justify-center items-center gap-2"
                >
                  <Printer size={15} />
                  Print
                </button>

                <button
                  type="button"
                  onClick={() => sendBillWhatsApp(selectedBill)}
                  className="py-3 bg-emerald-700 text-white rounded-xl font-bold text-xs flex justify-center items-center gap-2"
                >
                  <Send size={15} />
                  WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBill(null)}
                  className="py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
