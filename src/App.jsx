import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  createTransaction as createBackendTransaction,
  deleteTransaction as deleteBackendTransaction,
  getMyProfile,
  getTransactions,
  isAuthenticated,
  loginUser,
  registerUser,
  logoutUser,
  updateMyCurrency,
  getGoogleLoginUrl,
  exchangeGoogleCode,
} from "./services/api";

/* =========================================================
   CURRENCIES
========================================================= */

const CURRENCIES = [
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", flag: "🇬🇭" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", flag: "🇪🇬" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", flag: "🇹🇿" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", flag: "🇺🇬" },
  { code: "RWF", name: "Rwandan Franc", symbol: "RF", flag: "🇷🇼" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "DH", flag: "🇲🇦" },
  { code: "DZD", name: "Algerian Dinar", symbol: "دج", flag: "🇩🇿" },
  { code: "AOA", name: "Angolan Kwanza", symbol: "Kz", flag: "🇦🇴" },
  { code: "BWP", name: "Botswana Pula", symbol: "P", flag: "🇧🇼" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", flag: "🇿🇲" },
  { code: "ZWG", name: "Zimbabwe Gold", symbol: "ZiG", flag: "🇿🇼" },
  { code: "MUR", name: "Mauritian Rupee", symbol: "₨", flag: "🇲🇺" },
  { code: "NAD", name: "Namibian Dollar", symbol: "N$", flag: "🇳🇦" },
  { code: "SLE", name: "Sierra Leonean Leone", symbol: "Le", flag: "🇸🇱" },
  { code: "LRD", name: "Liberian Dollar", symbol: "L$", flag: "🇱🇷" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br", flag: "🇪🇹" },
  { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", flag: "🇹🇳" },
  { code: "LYD", name: "Libyan Dinar", symbol: "ل.د", flag: "🇱🇾" },
  { code: "SDG", name: "Sudanese Pound", symbol: "ج.س", flag: "🇸🇩" },
  { code: "SSP", name: "South Sudanese Pound", symbol: "£", flag: "🇸🇸" },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA", flag: "🌍" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", flag: "🌍" },
];

/* =========================================================
   FALLBACK RATES
========================================================= */

const FALLBACK_RATES = {
  NGN: 1530,
  GHS: 15.2,
  KES: 129,
  ZAR: 17.4,
  EGP: 48.5,
  TZS: 2540,
  UGX: 3500,
  RWF: 1450,
  MAD: 10,
  DZD: 133,
  AOA: 920,
  BWP: 13.8,
  ZMW: 23.5,
  ZWG: 25,
  MUR: 45.5,
  NAD: 17.4,
  SLE: 23,
  LRD: 200,
  ETB: 140,
  TND: 2.9,
  LYD: 5,
  SDG: 600,
  SSP: 1300,
  XOF: 590,
  XAF: 590,
};

/* =========================================================
   CATEGORIES
========================================================= */

const CATEGORIES = [
  { name: "Food", icon: "🍔" },
  { name: "Rent", icon: "🏠" },
  { name: "Electricity", icon: "⚡" },
  { name: "Water", icon: "💧" },
  { name: "Airtime", icon: "📱" },
  { name: "Internet", icon: "🌐" },
  { name: "Transport", icon: "🚗" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Health", icon: "❤️" },
  { name: "Education", icon: "📚" },
  { name: "Entertainment", icon: "🎮" },
  { name: "Bills", icon: "🧾" },
  { name: "Other", icon: "📦" },
];

/* =========================================================
   DEFAULT TRANSACTIONS
========================================================= */

const DEFAULT_TRANSACTIONS = [
  {
    id: 1,
    title: "Food",
    amount: 4500,
    currency: "NGN",
    category: "Food",
    type: "expense",
    timestamp: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Transport",
    amount: 2500,
    currency: "NGN",
    category: "Transport",
    type: "expense",
    timestamp: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Freelance Payment",
    amount: 85000,
    currency: "NGN",
    category: "Other",
    type: "income",
    timestamp: new Date().toISOString(),
  },
  {
    id: 4,
    title: "Internet Data",
    amount: 5000,
    currency: "NGN",
    category: "Internet",
    type: "expense",
    timestamp: new Date().toISOString(),
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getCurrency(code) {
  return (
    CURRENCIES.find(
      (currency) => currency.code === code
    ) || CURRENCIES[0]
  );
}

function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}

function formatMoney(amount, currencyCode) {
  const currency = getCurrency(currencyCode);

  return `${currency.symbol}${formatNumber(amount)}`;
}

/* =========================================================
   BANK-STYLE LIVE TIME
========================================================= */

function parseTransactionTimestamp(timestamp) {
  if (!timestamp) {
    return null;
  }

  if (timestamp instanceof Date) {
    return Number.isNaN(timestamp.getTime())
      ? null
      : timestamp;
  }

  if (typeof timestamp === "number") {
    const date = new Date(timestamp);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  let value = String(timestamp).trim();

  if (!value) {
    return null;
  }

  /*
    FastAPI/SQLAlchemy may return a UTC datetime
    without a timezone.

    Treat a timezone-less backend timestamp
    as UTC instead of browser-local time.
  */
  if (
    !/[zZ]$/.test(value) &&
    !/[+-]\d{2}:\d{2}$/.test(value)
  ) {
    value = `${value}Z`;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function formatTransactionClock(timestamp) {
  const date =
    parseTransactionTimestamp(timestamp);

  if (!date) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatRelativeTime(timestamp, now) {
  const date =
    parseTransactionTimestamp(timestamp);

  if (!date) {
    return "Unknown time";
  }

  const transactionTime =
    date.getTime();

  const difference =
    Math.max(
      0,
      now - transactionTime
    );

  const seconds = Math.floor(
    difference / 1000
  );

  if (seconds < 10) {
    return "Just now";
  }

  if (seconds < 60) {
    return `${seconds} seconds ago`;
  }

  const minutes = Math.floor(
    seconds / 60
  );

  if (minutes === 1) {
    return "1 minute ago";
  }

  if (minutes < 60) {
    return `${minutes} minutes ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours === 1) {
    return "1 hour ago";
  }

  if (hours < 24) {
    return `${hours} hours ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  const weeks = Math.floor(
    days / 7
  );

  if (weeks === 1) {
    return "1 week ago";
  }

  if (weeks < 4) {
    return `${weeks} weeks ago`;
  }

  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/* =========================================================
   CURRENCY CONVERSION
========================================================= */

function convertCurrency(
  amount,
  fromCurrency,
  toCurrency,
  rates
) {
  const numericAmount =
    Number(amount) || 0;

  if (
    fromCurrency === toCurrency
  ) {
    return numericAmount;
  }

  const fromRate =
    rates[fromCurrency];

  const toRate =
    rates[toCurrency];

  if (!fromRate || !toRate) {
    return numericAmount;
  }

  const usdAmount =
    numericAmount / fromRate;

  return usdAmount * toRate;
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [page, setPage] =
    useState("dashboard");

  const [loggedIn, setLoggedIn] =
    useState(() => isAuthenticated());

  const [loadingData, setLoadingData] =
    useState(false);

  const [apiError, setApiError] =
    useState("");

  const [userProfile, setUserProfile] =
    useState(null);

  /* =======================================================
     APP DATA STATE
  ======================================================= */

  const [
    currency,
    setCurrencyState,
  ] = useState("NGN");

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    rates,
    setRates,
  ] = useState(FALLBACK_RATES);

  const [
    rateStatus,
    setRateStatus,
  ] = useState("reference");

  const [
    budget,
    setBudget,
  ] = useState({
    amount: 100000,
    currency: "NGN",
  });

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    addingCustomCategory,
    setAddingCustomCategory,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState({
    title: "",
    amount: "",
    currency: "NGN",
    category: "Food",
    type: "expense",
    customCategory: "",
    customIcon: "✨",
  });

  /* =======================================================
     LIVE CLOCK
  ======================================================= */

  const [now, setNow] =
    useState(Date.now());

  useEffect(() => {
    const timer =
      setInterval(() => {
        setNow(Date.now());
      }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  /* =======================================================
     GOOGLE OAUTH CALLBACK
  ======================================================= */

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const googleCode =
      params.get("google_code");

    if (!googleCode) {
      return;
    }

    async function completeGoogleLogin() {
      try {
        await exchangeGoogleCode(
          googleCode
        );

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        setApiError("");
        setLoggedIn(true);
        setPage("dashboard");
      } catch (error) {
        localStorage.removeItem(
          "afri_access_token"
        );

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        setLoggedIn(false);

        setApiError(
          error?.message ||
            "Google authentication could not be completed."
        );
      }
    }

    completeGoogleLogin();
  }, []);

  /* =======================================================
     LOAD BACKEND DATA
  ======================================================= */

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    async function loadBackendData() {
      setLoadingData(true);
      setApiError("");

      try {
        const [
          profile,
          backendTransactions,
        ] = await Promise.all([
          getMyProfile(),
          getTransactions(),
        ]);

        setUserProfile(profile);

        setCurrencyState(
          profile?.currency || "NGN"
        );

        setTransactions(
          Array.isArray(
            backendTransactions
          )
            ? backendTransactions.map(
                (transaction) => ({
                  ...transaction,

                  title:
                    transaction.description ||
                    transaction.category ||
                    "Transaction",

                  timestamp:
                    transaction.created_at,

                  category:
                    transaction.category ||
                    "Other",
                })
              )
            : []
        );
      } catch (error) {
        const message =
          error?.message ||
          "Could not load your Afri Spender data.";

        setApiError(message);

        if (
          message
            .toLowerCase()
            .includes("credentials")
        ) {
          logoutUser();
          setLoggedIn(false);
        }
      } finally {
        setLoadingData(false);
      }
    }

    loadBackendData();
  }, [loggedIn]);

  /* =======================================================
     MAIN CURRENCY CHANGE
  ======================================================= */

  async function setCurrency(
    nextCurrency
  ) {
    const normalizedCurrency =
      String(
        nextCurrency || "NGN"
      ).toUpperCase();

    setCurrencyState(
      normalizedCurrency
    );

    setForm((previous) => ({
      ...previous,
      currency:
        normalizedCurrency,
    }));

    if (!loggedIn) {
      return;
    }

    try {
      const updatedProfile =
        await updateMyCurrency(
          normalizedCurrency
        );

      setUserProfile(
        updatedProfile
      );

      setApiError("");
    } catch (error) {
      setApiError(
        error?.message ||
          "Could not update your currency."
      );
    }
  }

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const allCategories =
    useMemo(() => {
      const categories = [
        ...CATEGORIES,
      ];

      transactions.forEach(
        (transaction) => {
          if (!transaction.category) {
            return;
          }

          const exists =
            categories.some(
              (category) =>
                category.name ===
                transaction.category
            );

          if (!exists) {
            categories.push({
              name:
                transaction.category,

              icon:
                transaction.category_icon ||
                "📦",
            });
          }
        }
      );

      return categories;
    }, [transactions]);

  /* =======================================================
     CONVERT TRANSACTIONS
  ======================================================= */

  const convertedTransactions =
    useMemo(() => {
      return transactions.map(
        (transaction) => ({
          ...transaction,

          convertedAmount:
            convertCurrency(
              transaction.amount,
              transaction.currency ||
                currency,
              currency,
              rates
            ),
        })
      );
    }, [
      transactions,
      currency,
      rates,
    ]);

  /* =======================================================
     TOTAL INCOME
  ======================================================= */

  const totalIncome =
    useMemo(() => {
      return convertedTransactions
        .filter(
          (transaction) =>
            transaction.type ===
            "income"
        )
        .reduce(
          (
            total,
            transaction
          ) =>
            total +
            Number(
              transaction.convertedAmount ||
                0
            ),
          0
        );
    }, [
      convertedTransactions,
    ]);

  /* =======================================================
     TOTAL EXPENSES
  ======================================================= */

  const totalExpenses =
    useMemo(() => {
      return convertedTransactions
        .filter(
          (transaction) =>
            transaction.type ===
            "expense"
        )
        .reduce(
          (
            total,
            transaction
          ) =>
            total +
            Number(
              transaction.convertedAmount ||
                0
            ),
          0
        );
    }, [
      convertedTransactions,
    ]);

  const totalMoney =
    totalIncome;

  const remainingMoney =
    totalMoney -
    totalExpenses;

  const moneyUsagePercentage =
    totalMoney > 0
      ? (totalExpenses /
          totalMoney) *
        100
      : 0;

  /* =======================================================
     BUDGET CALCULATIONS
  ======================================================= */

  const budgetInMainCurrency =
    convertCurrency(
      budget.amount,
      budget.currency,
      currency,
      rates
    );

  const budgetPercentage =
    budgetInMainCurrency > 0
      ? (totalExpenses /
          budgetInMainCurrency) *
        100
      : 0;

  const budgetRemaining =
    budgetInMainCurrency -
    totalExpenses;

  const budgetExceeded =
    budgetRemaining < 0;

  const budgetOverage =
    budgetExceeded
      ? Math.abs(
          budgetRemaining
        )
      : 0;

  /* =======================================================
     OPEN TRANSACTION MODAL
  ======================================================= */

  function openTransactionModal() {
    setForm({
      title: "",
      amount: "",
      currency: currency,
      category: "Food",
      type: "expense",
      customCategory: "",
      customIcon: "✨",
    });

    setAddingCustomCategory(
      false
    );

    setShowModal(true);
  }

  /* =======================================================
     ADD TRANSACTION
  ======================================================= */

  async function addTransaction(
    event
  ) {
    event.preventDefault();

    setApiError("");

    const title =
      form.title.trim();

    const amount =
      Number(form.amount);

    if (!title) {
      setApiError(
        "Please enter a transaction title."
      );

      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setApiError(
        "Please enter a valid transaction amount."
      );

      return;
    }

    let category =
      form.category;

    let categoryIcon = null;

    if (
      addingCustomCategory
    ) {
      category =
        form.customCategory.trim();

      categoryIcon =
        form.customIcon.trim() ||
        "✨";

      if (!category) {
        setApiError(
          "Please enter a custom category name."
        );

        return;
      }
    } else {
      const selectedCategory =
        allCategories.find(
          (item) =>
            item.name === category
        );

      categoryIcon =
        selectedCategory?.icon ||
        "📦";
    }

    try {
      const created =
        await createBackendTransaction({
          description: title,
          amount: amount,
          currency:
            form.currency ||
            currency,
          category: category,
          type: form.type,
        });

      const transaction = {
        ...created,

        title:
          created?.description ||
          title,

        timestamp:
          created?.created_at ||
          new Date().toISOString(),

        category:
          created?.category ||
          category,

        category_icon:
          created?.category_icon ||
          categoryIcon,
      };

      setTransactions(
        (previous) => [
          transaction,
          ...previous,
        ]
      );

      setShowModal(false);

      setForm({
        title: "",
        amount: "",
        currency: currency,
        category: "Food",
        type: "expense",
        customCategory: "",
        customIcon: "✨",
      });

      setAddingCustomCategory(
        false
      );

      setApiError("");
    } catch (error) {
      setApiError(
        error?.message ||
          "Could not create transaction."
      );
    }
  }

  /* =======================================================
     DELETE TRANSACTION
  ======================================================= */

  async function deleteTransaction(
    transactionId
  ) {
    if (!transactionId) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this transaction?"
      );

    if (!confirmed) {
      return;
    }

    setApiError("");

    try {
      await deleteBackendTransaction(
        transactionId
      );

      setTransactions(
        (previous) =>
          previous.filter(
            (transaction) =>
              transaction.id !==
              transactionId
          )
      );
    } catch (error) {
      setApiError(
        error?.message ||
          "Could not delete transaction."
      );
    }
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  function handleLogout() {
    logoutUser();

    setLoggedIn(false);
    setUserProfile(null);
    setTransactions([]);
    setPage("dashboard");
    setApiError("");
    setShowModal(false);
  }

  /* =======================================================
     REFERENCE RATES
  ======================================================= */

  useEffect(() => {
    setRates(
      FALLBACK_RATES
    );

    setRateStatus(
      "reference"
    );
  }, []);

  /* =======================================================
     LOGIN HANDLER
  ======================================================= */

  async function handleLogin(
    email,
    password
  ) {
    setApiError("");

    try {
      await loginUser(
        email,
        password
      );

      setLoggedIn(true);
      setPage("dashboard");
    } catch (error) {
      setApiError(
        error?.message ||
          "Incorrect email or password"
      );

      /*
        Re-throw so the Login component
        knows the login failed and does
        not display a false success state.
      */
      throw error;
    }
  }

  /* =======================================================
     REGISTER HANDLER
  ======================================================= */

  async function handleRegister(
    email,
    password,
    registerCurrency = "NGN"
  ) {
    setApiError("");

    try {
      await registerUser(
        email,
        password,
        registerCurrency
      );

      await loginUser(
        email,
        password
      );

      setLoggedIn(true);
      setPage("dashboard");
    } catch (error) {
      setApiError(
        error?.message ||
          "Registration could not be completed."
      );

      /*
        Re-throw so the Login component
        does not show "Account created"
        when registration actually failed.
      */
      throw error;
    }
  }

  /* =======================================================
     NOT LOGGED IN
  ======================================================= */

  if (!loggedIn) {
    return (
      <Login
        onLogin={handleLogin}
        onRegister={
          handleRegister
        }
        onGoogleLogin={() => {
          setApiError("");

          window.location.href =
            getGoogleLoginUrl();
        }}
        apiError={apiError}
      />
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="app">

      <Sidebar
        page={page}
        setPage={setPage}
        onLogout={handleLogout}
      />

      <main className="main">

        <Topbar
          currency={currency}
          setCurrency={
            setCurrency
          }
          currencies={
            CURRENCIES
          }
          rateStatus={
            rateStatus
          }
          onAdd={
            openTransactionModal
          }
        />

        {loadingData && (
          <div
            className="panel"
            style={{
              margin: "18px",
            }}
          >
            Loading your Afri
            Spender data...
          </div>
        )}

        {apiError &&
          !loadingData && (
            <div
              className="panel"
              style={{
                margin: "18px",
              }}
            >
              {apiError}
            </div>
          )}

        {page === "dashboard" && (
          <Dashboard
            totalMoney={
              totalMoney
            }
            expenses={
              totalExpenses
            }
            remaining={
              remainingMoney
            }
            moneyUsagePercentage={
              moneyUsagePercentage
            }
            budget={
              budgetInMainCurrency
            }
            budgetCurrency={
              currency
            }
            budgetPercentage={
              budgetPercentage
            }
            budgetRemaining={
              budgetRemaining
            }
            budgetExceeded={
              budgetExceeded
            }
            budgetOverage={
              budgetOverage
            }
            transactions={
              convertedTransactions
            }
            currency={
              currency
            }
            allCategories={
              allCategories
            }
            now={now}
            setPage={
              setPage
            }
          />
        )}

        {page ===
          "transactions" && (
          <Transactions
            transactions={
              transactions
            }
            currency={
              currency
            }
            rates={rates}
            allCategories={
              allCategories
            }
            deleteTransaction={
              deleteTransaction
            }
            now={now}
          />
        )}

        {page === "analytics" && (
          <Analytics
            transactions={
              convertedTransactions
            }
            expenses={
              totalExpenses
            }
            income={
              totalIncome
            }
            currency={
              currency
            }
            allCategories={
              allCategories
            }
          />
        )}

        {page === "budgets" && (
          <Budgets
            budget={budget}
            setBudget={
              setBudget
            }
            expenses={
              totalExpenses
            }
            budgetInMainCurrency={
              budgetInMainCurrency
            }
            percentage={
              budgetPercentage
            }
            remaining={
              budgetRemaining
            }
            exceeded={
              budgetExceeded
            }
            overage={
              budgetOverage
            }
            currency={
              currency
            }
            currencies={
              CURRENCIES
            }
            rates={rates}
          />
        )}

        {page === "settings" && (
          <Settings
            currency={
              currency
            }
            setCurrency={
              setCurrency
            }
            currencies={
              CURRENCIES
            }
            profile={
              userProfile
            }
            logout={
              handleLogout
            }
          />
        )}

      </main>

      {showModal && (
        <TransactionModal
          form={form}
          setForm={
            setForm
          }
          onSubmit={
            addTransaction
          }
          onClose={() =>
            setShowModal(false)
          }
          currencies={
            CURRENCIES
          }
          categories={
            allCategories
          }
          addingCustomCategory={
            addingCustomCategory
          }
          setAddingCustomCategory={
            setAddingCustomCategory
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  page,
  setPage,
  onLogout,
}) {
  const menu = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "⌂",
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: "↔",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: "▥",
    },
    {
      id: "budgets",
      label: "Budgets",
      icon: "◎",
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙",
    },
  ];

  return (
    <aside className="sidebar">

      <div className="brand">

        <div className="brand-symbol">
          A
        </div>

        <div>
          <strong>
            AFRI
          </strong>

          <span>
            SPENDER
          </span>
        </div>

      </div>

      <nav>
        {menu.map(
          (item) => (
            <button
              key={
                item.id
              }
              className={
                page ===
                item.id
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(
                  item.id
                )
              }
            >
              <span>
                {item.icon}
              </span>

              {item.label}
            </button>
          )
        )}
      </nav>

      <button
        className="logout-button"
        onClick={
          onLogout
        }
      >
        <span>↪</span>
        Logout
      </button>

    </aside>
  );
}

/* =========================================================
   TOPBAR
========================================================= */

function Topbar({
  currency,
  setCurrency,
  currencies,
  rateStatus,
  onAdd,
}) {
  const selected =
    getCurrency(currency);

  return (
    <header className="topbar">

      <div>
        <h1>
          Afri Spender
        </h1>

        <p>
          Manage your money
          across multiple
          currencies
        </p>
      </div>

      <div className="topbar-actions">

        <div className="rate-status">

          <span
            className={
              rateStatus ===
              "live"
                ? "status-dot live"
                : "status-dot"
            }
          />

          {rateStatus ===
          "live"
            ? "Live rates"
            : "Reference rates"}

        </div>

        <div className="currency-control">

          <span>
            {selected.flag}
          </span>

          <select
            value={
              currency
            }
            onChange={(
              event
            ) =>
              setCurrency(
                event.target
                  .value
              )
            }
          >
            {currencies.map(
              (item) => (
                <option
                  key={
                    item.code
                  }
                  value={
                    item.code
                  }
                >
                  {item.code} —{" "}
                  {item.name}
                </option>
              )
            )}
          </select>

        </div>

        <button
          className="primary-button"
          onClick={onAdd}
        >
          + Add Transaction
        </button>

      </div>

    </header>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  totalMoney,
  expenses,
  remaining,
  moneyUsagePercentage,
  budget,
  budgetCurrency,
  budgetPercentage,
  budgetRemaining,
  budgetExceeded,
  budgetOverage,
  transactions,
  currency,
  allCategories,
  now,
  setPage,
}) {
  return (
    <section className="page">

      <div className="page-heading">

        <div>
          <h2>
            Overview
          </h2>

          <p>
            Your financial
            summary
          </p>
        </div>

      </div>

      <div className="stats">

        <div className="balance-card">

          <div className="card-label">
            Total Money
          </div>

          <div className="big-number">
            {formatMoney(
              totalMoney,
              currency
            )}
          </div>

          <div className="card-description">
            Total income
            received
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon expense">
            ↓
          </div>

          <div>
            <span>
              Spent
            </span>

            <strong>
              {formatMoney(
                expenses,
                currency
              )}
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon remaining">
            ✓
          </div>

          <div>
            <span>
              Remaining
            </span>

            <strong
              className={
                remaining < 0
                  ? "danger-text"
                  : ""
              }
            >
              {formatMoney(
                remaining,
                currency
              )}
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon budget">
            ◎
          </div>

          <div>
            <span>
              Budget Remaining
            </span>

            <strong
              className={
                budgetExceeded
                  ? "danger-text"
                  : ""
              }
            >
              {formatMoney(
                budgetRemaining,
                currency
              )}
            </strong>
          </div>

        </div>

      </div>

      <div className="dashboard-grid">

        <div className="panel">

          <div className="panel-header">

            <div>
              <h3>
                Money Usage
              </h3>

              <p>
                Spending compared
                with total money
              </p>
            </div>

          </div>

          <div className="usage-box">

            <div
              className="usage-ring"
              style={{
                "--usage": `${
                  Math.min(
                    Math.max(
                      moneyUsagePercentage,
                      0
                    ),
                    100
                  )
                }%`,
              }}
            >

              <div className="ring-inner">

                <strong>
                  {formatNumber(
                    moneyUsagePercentage
                  )}
                  %
                </strong>

                <span>
                  used
                </span>

              </div>

            </div>

            <div className="usage-details">

              <div>
                <span>
                  Total money
                </span>

                <strong>
                  {formatMoney(
                    totalMoney,
                    currency
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Total spent
                </span>

                <strong>
                  {formatMoney(
                    expenses,
                    currency
                  )}
                </strong>
              </div>

            </div>

          </div>

        </div>

        <div className="panel">

          <div className="panel-header">

            <div>
              <h3>
                Budget
              </h3>

              <p>
                Your spending
                limit
              </p>
            </div>

            <button
              className="text-button"
              onClick={() =>
                setPage(
                  "budgets"
                )
              }
            >
              Manage
            </button>

          </div>

          <div className="budget-overview">

            <div
              className="budget-ring"
              style={{
                "--progress": `${
                  Math.min(
                    Math.max(
                      budgetPercentage,
                      0
                    ),
                    100
                  )
                }%`,
              }}
            >

              <div className="budget-ring-inner">

                <strong>
                  {formatNumber(
                    budgetPercentage
                  )}
                  %
                </strong>

                <span>
                  used
                </span>

              </div>

            </div>

            <div className="budget-numbers">

              <div>
                <span>
                  Budget
                </span>

                <strong>
                  {formatMoney(
                    budget,
                    budgetCurrency
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Spent
                </span>

                <strong>
                  {formatMoney(
                    expenses,
                    currency
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Remaining
                </span>

                <strong
                  className={
                    budgetExceeded
                      ? "danger-text"
                      : ""
                  }
                >
                  {formatMoney(
                    budgetRemaining,
                    currency
                  )}
                </strong>
              </div>

            </div>

          </div>

          {budgetExceeded ? (
            <div className="warning-box">
              ⚠️ Budget exceeded
              by{" "}
              <strong>
                {formatMoney(
                  budgetOverage,
                  currency
                )}
              </strong>
            </div>
          ) : (
            <div className="success-box">
              ✓ You have{" "}
              <strong>
                {formatMoney(
                  budgetRemaining,
                  currency
                )}
              </strong>{" "}
              left in your
              budget.
            </div>
          )}

        </div>

      </div>

      <div className="dashboard-grid lower-grid">

        <div className="panel">

          <div className="panel-header">

            <div>
              <h3>
                Recent
                Transactions
              </h3>

              <p>
                Your latest
                financial activity
              </p>
            </div>

            <button
              className="text-button"
              onClick={() =>
                setPage(
                  "transactions"
                )
              }
            >
              View all
            </button>

          </div>

          <div className="transaction-list">

            {transactions
              .slice(0, 5)
              .map(
                (
                  transaction
                ) => (
                  <TransactionRow
                    key={
                      transaction.id
                    }
                    transaction={
                      transaction
                    }
                    mainCurrency={
                      currency
                    }
                    allCategories={
                      allCategories
                    }
                    now={now}
                  />
                )
              )}

            {transactions.length ===
              0 && (
              <div className="empty-state">
                <span>💳</span>

                <p>
                  No transactions
                  yet.
                </p>
              </div>
            )}

          </div>

        </div>

        <div className="panel">

          <div className="panel-header">

            <div>
              <h3>
                Spending by
                Category
              </h3>

              <p>
                Where your money
                is going
              </p>
            </div>

            <button
              className="text-button"
              onClick={() =>
                setPage(
                  "analytics"
                )
              }
            >
              Analytics
            </button>

          </div>

          <CategoryBreakdown
            transactions={
              transactions
            }
            currency={
              currency
            }
            allCategories={
              allCategories
            }
          />

        </div>

      </div>

    </section>
  );
}

/* =========================================================
   TRANSACTION ROW
========================================================= */

function TransactionRow({
  transaction,
  mainCurrency,
  allCategories,
  now,
}) {
  const category =
    allCategories.find(
      (item) =>
        item.name ===
        transaction.category
    );

  const isIncome =
    transaction.type ===
    "income";

  return (
    <div className="transaction-row">

      <div
        className={`transaction-icon ${
          isIncome
            ? "income-icon"
            : ""
        }`}
      >
        {category?.icon ||
          "📦"}
      </div>

      <div className="transaction-info">

        <strong>
          {transaction.title}
        </strong>

        <span>
          {transaction.category}
        </span>

        <small className="transaction-time">
          🕐{" "}
          {formatTransactionClock(
            transaction.timestamp
          )}{" "}
          ·{" "}
          {formatRelativeTime(
            transaction.timestamp,
            now
          )}
        </small>

      </div>

      <div
        className={`transaction-amount ${
          isIncome
            ? "income"
            : "expense"
        }`}
      >

        {isIncome
          ? "+"
          : "-"}

        {formatMoney(
          transaction.amount,
          transaction.currency
        )}

        {transaction.currency !==
          mainCurrency && (
          <small>
            ≈{" "}
            {formatMoney(
              transaction.convertedAmount,
              mainCurrency
            )}
          </small>
        )}

      </div>

    </div>
  );
}

/* =========================================================
   CATEGORY BREAKDOWN
========================================================= */

function CategoryBreakdown({
  transactions,
  currency,
  allCategories,
}) {
  const categoryTotals =
    useMemo(() => {
      const totals = {};

      transactions
        .filter(
          (transaction) =>
            transaction.type ===
            "expense"
        )
        .forEach(
          (transaction) => {
            if (
              !totals[
                transaction.category
              ]
            ) {
              totals[
                transaction.category
              ] = 0;
            }

            totals[
              transaction.category
            ] +=
              Number(
                transaction.convertedAmount ||
                  convertCurrency(
                    transaction.amount,
                    transaction.currency,
                    currency,
                    FALLBACK_RATES
                  )
              );
          }
        );

      return Object.entries(
        totals
      )
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .map(
          ([name, amount]) => ({
            name,
            amount,
            icon:
              allCategories.find(
                (category) =>
                  category.name ===
                  name
              )?.icon ||
              "📦",
          })
        );
    }, [
      transactions,
      allCategories,
      currency,
    ]);

  const total =
    categoryTotals.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    );

  if (
    categoryTotals.length ===
    0
  ) {
    return (
      <div className="empty-state">

        <span>📊</span>

        <p>
          No expense data yet.
        </p>

      </div>
    );
  }

  return (
    <div className="category-list">

      {categoryTotals.map(
        (item) => {
          const percentage =
            total > 0
              ? (item.amount /
                  total) *
                100
              : 0;

          return (
            <div
              className="category-item"
              key={
                item.name
              }
            >

              <div className="category-top">

                <div className="category-name">

                  <span>
                    {item.icon}
                  </span>

                  <strong>
                    {item.name}
                  </strong>

                </div>

                <strong>
                  {formatMoney(
                    item.amount,
                    currency
                  )}
                </strong>

              </div>

              <div className="category-bar">

                <div
                  style={{
                    width: `${percentage}%`,
                  }}
                />

              </div>

              <small>
                {formatNumber(
                  percentage
                )}
                % of spending
              </small>

            </div>
          );
        }
      )}

    </div>
  );
}

/* =========================================================
   TRANSACTIONS PAGE
========================================================= */

function Transactions({
  transactions,
  currency,
  rates,
  allCategories,
  deleteTransaction,
  now,
}) {
  const converted =
    transactions.map(
      (transaction) => ({
        ...transaction,

        convertedAmount:
          convertCurrency(
            transaction.amount,
            transaction.currency ||
              currency,
            currency,
            rates
          ),
      })
    );

  return (
    <section className="page">

      <div className="page-heading">

        <div>

          <h2>
            Transactions
          </h2>

          <p>
            All your income and
            expenses
          </p>

        </div>

      </div>

      <div className="panel">

        <div className="transaction-list full-list">

          {converted.length ===
          0 ? (
            <div className="empty-state">

              <span>💳</span>

              <p>
                No transactions
                yet.
              </p>

            </div>
          ) : (
            converted.map(
              (
                transaction
              ) => (
                <div
                  className="transaction-with-delete"
                  key={
                    transaction.id
                  }
                >

                  <TransactionRow
                    transaction={
                      transaction
                    }
                    mainCurrency={
                      currency
                    }
                    allCategories={
                      allCategories
                    }
                    now={now}
                  />

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteTransaction(
                        transaction.id
                      )
                    }
                  >
                    ×
                  </button>

                </div>
              )
            )
          )}

        </div>

      </div>

    </section>
  );
}

/* =========================================================
   ANALYTICS
========================================================= */

function Analytics({
  transactions,
  expenses,
  income,
  currency,
  allCategories,
}) {
  const categoryTotals =
    useMemo(() => {
      const totals = {};

      transactions
        .filter(
          (transaction) =>
            transaction.type ===
            "expense"
        )
        .forEach(
          (transaction) => {
            totals[
              transaction.category
            ] =
              (totals[
                transaction.category
              ] || 0) +
              Number(
                transaction.convertedAmount ||
                  0
              );
          }
        );

      return Object.entries(
        totals
      )
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .map(
          ([name, amount]) => ({
            name,
            amount,
            icon:
              allCategories.find(
                (category) =>
                  category.name ===
                  name
              )?.icon ||
              "📦",
          })
        );
    }, [
      transactions,
      allCategories,
    ]);

  const savings =
    income - expenses;

  return (
    <section className="page">

      <div className="page-heading">

        <div>

          <h2>
            Analytics
          </h2>

          <p>
            Understand your
            spending patterns
          </p>

        </div>

      </div>

      <div className="analytics-summary">

        <div className="summary-card">

          <span>
            Total Income
          </span>

          <strong>
            {formatMoney(
              income,
              currency
            )}
          </strong>

        </div>

        <div className="summary-card">

          <span>
            Total Spending
          </span>

          <strong>
            {formatMoney(
              expenses,
              currency
            )}
          </strong>

        </div>

        <div className="summary-card">

          <span>
            Net Balance
          </span>

          <strong
            className={
              savings < 0
                ? "danger-text"
                : ""
            }
          >
            {formatMoney(
              savings,
              currency
            )}
          </strong>

        </div>

      </div>

      <div className="panel">

        <div className="panel-header">

          <div>

            <h3>
              Spending by
              Category
            </h3>

            <p>
              Actual spending
              converted to{" "}
              {
                getCurrency(
                  currency
                ).name
              }
            </p>

          </div>

        </div>

        {categoryTotals.length ===
        0 ? (
          <div className="empty-state">

            <span>📊</span>

            <p>
              No spending data
              available.
            </p>

          </div>
        ) : (
          <div className="analytics-categories">

            {categoryTotals.map(
              (category) => {

                const percentage =
                  expenses > 0
                    ? (category.amount /
                        expenses) *
                      100
                    : 0;

                return (
                  <div
                    className="analytics-category"
                    key={
                      category.name
                    }
                  >

                    <div className="analytics-category-icon">
                      {
                        category.icon
                      }
                    </div>

                    <div className="analytics-category-main">

                      <div>

                        <strong>
                          {
                            category.name
                          }
                        </strong>

                        <span>
                          {formatNumber(
                            percentage
                          )}
                          %
                        </span>

                      </div>

                      <div className="analytics-bar">

                        <div
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>

                    <strong>
                      {formatMoney(
                        category.amount,
                        currency
                      )}
                    </strong>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

    </section>
  );
}

/* =========================================================
   BUDGETS
========================================================= */

function Budgets({
  budget,
  setBudget,
  expenses,
  budgetInMainCurrency,
  percentage,
  remaining,
  exceeded,
  overage,
  currency,
  currencies,
  rates,
}) {
  const [
    budgetCurrency,
    setBudgetCurrency,
  ] = useState(
    budget.currency
  );

  const [
    budgetInput,
    setBudgetInput,
  ] = useState("");

  useEffect(() => {
    setBudgetCurrency(
      budget.currency
    );

    const converted =
      convertCurrency(
        budget.amount,
        budget.currency,
        currency,
        rates
      );

    setBudgetInput(
      converted
        ? String(
            Number(
              converted.toFixed(2)
            )
          )
        : ""
    );
  }, [
    budget,
    currency,
    rates,
  ]);

  function saveBudget(event) {
    event.preventDefault();

    const amount =
      Number(budgetInput);

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      alert(
        "Please enter a valid budget amount."
      );

      return;
    }

    /*
      budgetInput is displayed in the
      currently selected main currency.

      Store that amount with the selected
      budget currency.
    */
    setBudget({
      amount,
      currency:
        budgetCurrency,
    });
  }

  return (
    <section className="page">

      <div className="page-heading">

        <div>

          <h2>
            Budget
          </h2>

          <p>
            Set and monitor
            your spending limit
          </p>

        </div>

      </div>

      <div className="budget-layout">

        <div className="panel budget-editor-panel">

          <div className="panel-header">

            <div>

              <h3>
                Set Budget Limit
              </h3>

              <p>
                Choose the budget
                currency before
                entering the limit.
              </p>

            </div>

          </div>

          <form
            className="budget-editor"
            onSubmit={
              saveBudget
            }
          >

            <label>
              Budget Currency
            </label>

            <div className="budget-currency-select">

              <span>
                {
                  getCurrency(
                    budgetCurrency
                  ).flag
                }
              </span>

              <select
                value={
                  budgetCurrency
                }
                onChange={(
                  event
                ) =>
                  setBudgetCurrency(
                    event.target
                      .value
                  )
                }
              >

                {currencies.map(
                  (item) => (
                    <option
                      key={
                        item.code
                      }
                      value={
                        item.code
                      }
                    >
                      {item.code} —{" "}
                      {item.name}
                    </option>
                  )
                )}

              </select>

            </div>

            <label>
              Budget Limit
            </label>

            <div className="money-input">

              <span>
                {
                  getCurrency(
                    budgetCurrency
                  ).symbol
                }
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  budgetInput
                }
                onChange={(
                  event
                ) =>
                  setBudgetInput(
                    event.target
                      .value
                  )
                }
                placeholder="Enter budget limit"
              />

            </div>

            <div className="budget-input-help">

              Your budget will
              be stored in{" "}

              <strong>
                {budgetCurrency}
              </strong>

              .

            </div>

            <button
              className="primary-button full-button"
              type="submit"
            >
              Save Budget
            </button>

          </form>

        </div>

        <div className="panel budget-large">

          <div
            className="budget-large-ring"
            style={{
              "--progress": `${
                Math.min(
                  Math.max(
                    percentage,
                    0
                  ),
                  100
                )
              }%`,
            }}
          >

            <div>

              <strong>
                {formatNumber(
                  percentage
                )}
                %
              </strong>

              <span>
                used
              </span>

            </div>

          </div>

          <div className="budget-large-info">

            <div>

              <span>
                Budget
              </span>

              <strong>
                {formatMoney(
                  budgetInMainCurrency,
                  currency
                )}
              </strong>

            </div>

            <div>

              <span>
                Spent
              </span>

              <strong>
                {formatMoney(
                  expenses,
                  currency
                )}
              </strong>

            </div>

            <div>

              <span>
                {exceeded
                  ? "Over budget"
                  : "Remaining"}
              </span>

              <strong
                className={
                  exceeded
                    ? "danger-text"
                    : ""
                }
              >
                {formatMoney(
                  exceeded
                    ? overage
                    : remaining,
                  currency
                )}
              </strong>

            </div>

          </div>

        </div>

      </div>

      {exceeded ? (
        <div className="large-warning">

          <div className="warning-icon">
            ⚠️
          </div>

          <div>

            <strong>
              Budget exceeded
            </strong>

            <p>
              You have
              exceeded your
              budget by{" "}

              <strong>
                {formatMoney(
                  overage,
                  currency
                )}
              </strong>

              .
            </p>

          </div>

        </div>
      ) : (
        <div className="large-success">

          <div className="success-icon">
            ✓
          </div>

          <div>

            <strong>
              Budget is on
              track
            </strong>

            <p>
              You still have{" "}

              <strong>
                {formatMoney(
                  remaining,
                  currency
                )}
              </strong>{" "}

              available.
            </p>

          </div>

        </div>
      )}

    </section>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function Settings({
  currency,
  setCurrency,
  currencies,
  profile,
  logout,
}) {
  const email =
    profile?.email ||
    "No email available";

  const initials =
    email
      .split("@")[0]
      .slice(0, 2)
      .toUpperCase();

  const joinedDate =
    profile?.created_at
      ? new Date(
          profile.created_at
        ).toLocaleDateString(
          [],
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }
        )
      : "Not available";

  return (
    <section className="page">

      <div className="page-heading">

        <div>

          <h2>
            Settings
          </h2>

          <p>
            Customize your
            Afri Spender
            experience
          </p>

        </div>

      </div>

      <div className="panel settings-page">

        <div
          className="settings-section"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            padding: "24px",
            marginBottom: "18px",
          }}
        >

          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "#111",
              color: "#fff",
              fontSize: "24px",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div
            style={{
              minWidth: 0,
            }}
          >

            <h3
              style={{
                marginBottom:
                  "6px",
              }}
            >
              Your Profile
            </h3>

            <p
              style={{
                margin: 0,
                wordBreak:
                  "break-word",
              }}
            >
              {email}
            </p>

            <small
              style={{
                display:
                  "block",
                marginTop:
                  "6px",
              }}
            >
              Member since{" "}
              {joinedDate}
            </small>

          </div>

        </div>

        <div className="settings-section">

          <h3>
            Main Currency
          </h3>

          <p>
            This currency is
            used as the main
            display currency.
          </p>

          <div className="currency-grid">

            {currencies.map(
              (item) => (
                <button
                  key={
                    item.code
                  }
                  className={
                    currency ===
                    item.code
                      ? "currency-option active"
                      : "currency-option"
                  }
                  onClick={() =>
                    setCurrency(
                      item.code
                    )
                  }
                >

                  <span className="currency-flag">
                    {item.flag}
                  </span>

                  <div>

                    <strong>
                      {item.code}
                    </strong>

                    <small>
                      {item.name}
                    </small>

                  </div>

                  {currency ===
                    item.code && (
                    <span className="check">
                      ✓
                    </span>
                  )}

                </button>
              )
            )}

          </div>

        </div>

        <div className="settings-section danger-section">

          <h3>
            Account
          </h3>

          <button
            className="logout-settings"
            onClick={
              logout
            }
          >
            Logout
          </button>

        </div>

      </div>

    </section>
  );
}

/* =========================================================
   TRANSACTION MODAL
========================================================= */

function TransactionModal({
  form,
  setForm,
  onSubmit,
  onClose,
  currencies,
  categories,
  addingCustomCategory,
  setAddingCustomCategory,
}) {
  function updateField(
    field,
    value
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={
        onClose
      }
    >

      <div
        className="modal"
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >

        <div className="modal-header">

          <div>

            <h2>
              Add Transaction
            </h2>

            <p>
              Record your
              income or expense
            </p>

          </div>

          <button
            className="close-button"
            onClick={
              onClose
            }
          >
            ×
          </button>

        </div>

        <form
          onSubmit={
            onSubmit
          }
        >

          <label>
            Transaction Title
          </label>

          <input
            className="form-input"
            type="text"
            value={
              form.title
            }
            onChange={(
              event
            ) =>
              updateField(
                "title",
                event.target
                  .value
              )
            }
            placeholder="e.g. Electricity bill"
          />

          <label>
            Amount
          </label>

          <div className="amount-row">

            <div className="modal-currency">

              <select
                value={
                  form.currency
                }
                disabled
              >

                {currencies.map(
                  (item) => (
                    <option
                      key={
                        item.code
                      }
                      value={
                        item.code
                      }
                    >
                      {item.flag}{" "}
                      {item.code}
                    </option>
                  )
                )}

              </select>

            </div>

            <input
              className="form-input amount-input"
              type="number"
              min="0"
              step="0.01"
              value={
                form.amount
              }
              onChange={(
                event
              ) =>
                updateField(
                  "amount",
                  event.target
                    .value
                )
              }
              placeholder="0.00"
            />

          </div>

          <label>
            Category
          </label>

          <select
            className="form-input"
            value={
              addingCustomCategory
                ? "__custom__"
                : form.category
            }
            onChange={(
              event
            ) => {

              if (
                event.target
                  .value ===
                "__custom__"
              ) {

                setAddingCustomCategory(
                  true
                );

              } else {

                setAddingCustomCategory(
                  false
                );

                updateField(
                  "category",
                  event.target
                    .value
                );

              }

            }}
          >

            {categories.map(
              (category) => (
                <option
                  key={
                    category.name
                  }
                  value={
                    category.name
                  }
                >
                  {category.icon}{" "}
                  {category.name}
                </option>
              )
            )}

            <option value="__custom__">
              ✨ Add your own
              category
            </option>

          </select>

          {addingCustomCategory && (
            <div className="custom-category-box">

              <label>
                Custom Category
                Name
              </label>

              <input
                className="form-input"
                type="text"
                value={
                  form.customCategory
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "customCategory",
                    event.target
                      .value
                  )
                }
                placeholder="e.g. Gym"
              />

              <label>
                Category Icon
              </label>

              <input
                className="form-input"
                type="text"
                maxLength="4"
                value={
                  form.customIcon
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "customIcon",
                    event.target
                      .value
                  )
                }
                placeholder="🏋️"
              />

              <button
                type="button"
                className="cancel-custom"
                onClick={() => {

                  setAddingCustomCategory(
                    false
                  );

                  updateField(
                    "customCategory",
                    ""
                  );

                  updateField(
                    "customIcon",
                    "✨"
                  );

                }}
              >
                Use an existing
                category instead
              </button>

            </div>
          )}

          <label>
            Transaction Type
          </label>

          <div className="type-buttons">

            <button
              type="button"
              className={
                form.type ===
                "expense"
                  ? "selected expense-type"
                  : ""
              }
              onClick={() =>
                updateField(
                  "type",
                  "expense"
                )
              }
            >
              ↓ Expense
            </button>

            <button
              type="button"
              className={
                form.type ===
                "income"
                  ? "selected income-type"
                  : ""
              }
              onClick={() =>
                updateField(
                  "type",
                  "income"
                )
              }
            >
              ↑ Income
            </button>

          </div>

          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={
                onClose
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              Add Transaction
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

/* =========================================================
   LOGIN
========================================================= */

function Login({
  onLogin,
  onRegister,
  onGoogleLogin,
  apiError,
}) {
  const [
    mode,
    setMode,
  ] = useState("login");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const isRegister =
    mode === "register";

  function switchMode(
    nextMode
  ) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setSuccessMessage("");
  }

  async function submit(
    event
  ) {
    event.preventDefault();

    setSuccessMessage("");

    if (
      !email.trim() ||
      !password
    ) {
      return;
    }

    if (
      isRegister &&
      password !==
        confirmPassword
    ) {
      return;
    }

    setSubmitting(true);

    try {
      if (isRegister) {

        await onRegister(
          email.trim(),
          password,
          "NGN"
        );

        setMode("login");
        setPassword("");
        setConfirmPassword("");

        setSuccessMessage(
          "Account created successfully. You can now sign in."
        );

      } else {

        await onLogin(
          email.trim(),
          password
        );

      }
    } catch {
      /*
        The parent handler provides
        the actual error message.
      */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="brand login-brand">

          <div className="brand-symbol">
            A
          </div>

          <div>

            <strong>
              AFRI
            </strong>

            <span>
              SPENDER
            </span>

          </div>

        </div>

        <h1>
          {isRegister
            ? "Create your account"
            : "Welcome back"}
        </h1>

        <p>
          {isRegister
            ? "Start managing your money smarter."
            : "Manage your money smarter."}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "8px",
            marginBottom:
              "20px",
            padding: "4px",
            borderRadius:
              "10px",
            background:
              "rgba(255,255,255,0.05)",
          }}
        >

          <button
            type="button"
            onClick={() =>
              switchMode(
                "login"
              )
            }
            style={{
              border: "none",
              borderRadius:
                "8px",
              padding: "10px",
              cursor:
                "pointer",
              background:
                mode ===
                "login"
                  ? "#fff"
                  : "transparent",
              color:
                mode ===
                "login"
                  ? "#111"
                  : "#fff",
              fontWeight: 600,
            }}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() =>
              switchMode(
                "register"
              )
            }
            style={{
              border: "none",
              borderRadius:
                "8px",
              padding: "10px",
              cursor:
                "pointer",
              background:
                mode ===
                "register"
                  ? "#fff"
                  : "transparent",
              color:
                mode ===
                "register"
                  ? "#111"
                  : "#fff",
              fontWeight: 600,
            }}
          >
            Register
          </button>

        </div>

        <button
          type="button"
          onClick={
            onGoogleLogin
          }
          disabled={
            submitting
          }
          style={{
            width: "100%",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            gap: "10px",
            padding:
              "13px",
            marginBottom:
              "18px",
            borderRadius:
              "10px",
            border:
              "1px solid rgba(255,255,255,0.15)",
            background:
              "#fff",
            color:
              "#111",
            fontWeight:
              600,
            cursor:
              "pointer",
          }}
        >

          <span
            style={{
              fontSize:
                "18px",
              fontWeight:
                700,
            }}
          >
            G
          </span>

          {isRegister
            ? "Continue with Google"
            : "Sign in with Google"}

        </button>

        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: "10px",
            marginBottom:
              "18px",
            opacity: 0.6,
          }}
        >

          <div
            style={{
              flex: 1,
              height: "1px",
              background:
                "currentColor",
            }}
          />

          <span>
            OR
          </span>

          <div
            style={{
              flex: 1,
              height: "1px",
              background:
                "currentColor",
            }}
          />

        </div>

        <form
          onSubmit={
            submit
          }
        >

          <label>
            Email
          </label>

          <input
            className="form-input"
            type="email"
            value={
              email
            }
            onChange={(
              event
            ) =>
              setEmail(
                event.target
                  .value
              )
            }
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label>
            Password
          </label>

          <input
            className="form-input"
            type="password"
            value={
              password
            }
            onChange={(
              event
            ) =>
              setPassword(
                event.target
                  .value
              )
            }
            placeholder="••••••••"
            autoComplete={
              isRegister
                ? "new-password"
                : "current-password"
            }
            required
          />

          {isRegister && (
            <>
              <label>
                Confirm Password
              </label>

              <input
                className="form-input"
                type="password"
                value={
                  confirmPassword
                }
                onChange={(
                  event
                ) =>
                  setConfirmPassword(
                    event.target
                      .value
                  )
                }
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />

              {password &&
                confirmPassword &&
                password !==
                  confirmPassword && (
                  <div className="warning-box">
                    Passwords do
                    not match.
                  </div>
                )}

            </>
          )}

          {apiError && (
            <div className="warning-box">
              {apiError}
            </div>
          )}

          {successMessage && (
            <div className="success-box">
              {successMessage}
            </div>
          )}

          <button
            className="primary-button login-button"
            type="submit"
            disabled={
              submitting ||
              (isRegister &&
                password !==
                  confirmPassword)
            }
          >
            {submitting
              ? isRegister
                ? "Creating account..."
                : "Signing in..."
              : isRegister
                ? "Create Account"
                : "Continue"}
          </button>

        </form>

        <p
          style={{
            textAlign:
              "center",
            marginTop:
              "18px",
            fontSize:
              "14px",
          }}
        >
          {isRegister
            ? "Already have an account? "
            : "Don't have an account? "}

          <button
            type="button"
            onClick={() =>
              switchMode(
                isRegister
                  ? "login"
                  : "register"
              )
            }
            style={{
              border:
                "none",
              background:
                "none",
              padding: 0,
              color:
                "inherit",
              textDecoration:
                "underline",
              cursor:
                "pointer",
              fontWeight:
                700,
            }}
          >
            {isRegister
              ? "Login"
              : "Register"}
          </button>

        </p>

      </div>

    </div>
  );
}
