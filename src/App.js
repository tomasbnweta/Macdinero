import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  X,
  PieChart,
  List,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Tag,
  Repeat,
  Archive,
  AlertTriangle,
  PiggyBank,
  Target,
} from "lucide-react";

const DEFAULT_CATEGORIES = [
  "Comida",
  "Transporte",
  "Cuentas y Servicios",
  "Ocio",
  "Salud",
  "Educación",
  "Ropa",
  "Hogar",
  "Ahorro",
  "Otros gastos",
];

const CATEGORY_COLORS = {
  Comida: "#f59e0b",
  Transporte: "#3b82f6",
  "Cuentas y Servicios": "#ef4444",
  Ocio: "#8b5cf6",
  Salud: "#10b981",
  Educación: "#6366f1",
  Ropa: "#ec4899",
  Hogar: "#14b8a6",
  Ahorro: "#eab308",
  Otros: "#64748b",
};

const CATEGORY_EMOJIS = {
  Comida: "🍔",
  Transporte: "🚌",
  "Cuentas y Servicios": "💡",
  Ocio: "🍿",
  Salud: "💊",
  Educación: "📚",
  Ropa: "👕",
  Hogar: "🏠",
  Ahorro: "💰",
  "Otros gastos": "📦",
  Otros: "📦",
};

const getCategoryColor = (category) => {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const getLocalDateString = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("personal_finance_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [fixedExpenses, setFixedExpenses] = useState(() => {
    const saved = localStorage.getItem("personal_finance_fixed");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [savings, setSavings] = useState(() => {
    const saved = localStorage.getItem("personal_finance_savings");
    if (saved) {
      try {
        return Number(saved);
      } catch (e) {
        return 0;
      }
    }
    return 0;
  });

  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem("personal_finance_budgets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed).length > 0) return parsed;
      } catch (e) {}
    }
    return {};
  });

  const [viewMode, setViewMode] = useState("list");
  const [timeFilter, setTimeFilter] = useState("today");
  const [typeFilter, setTypeFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickAdd, setIsQuickAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");

  const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
  const [fixedName, setFixedName] = useState("");
  const [fixedAmount, setFixedAmount] = useState("");
  const [fixedCategory, setFixedCategory] = useState(DEFAULT_CATEGORIES[2]);
  const [fixedBillingDay, setFixedBillingDay] = useState("1");

  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState("");
  const [savingsAction, setSavingsAction] = useState("deposit");
  const [savingsError, setSavingsError] = useState("");

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  const [isCloseMonthModalOpen, setIsCloseMonthModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isPastDateModalOpen, setIsPastDateModalOpen] = useState(false);
  const [pendingFixed, setPendingFixed] = useState(null);

  const getPreviousMonthStr = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  };

  const getCurrentMonthStr = () => {
    return new Date().toISOString().slice(0, 7);
  };

  useEffect(() => {
    if (fixedExpenses.length === 0) return;

    const d = new Date();
    const currentMonthStr = getCurrentMonthStr();
    const currentDay = d.getDate();
    const todayDateStr = d.toISOString().split("T")[0];

    let updatedFixed = false;
    let newTransactions = [];

    const nextFixed = fixedExpenses.map((fe) => {
      const lastProcessed = fe.lastProcessedMonth || "2000-01";

      if (lastProcessed !== currentMonthStr && currentDay >= fe.billingDay) {
        updatedFixed = true;
        newTransactions.push({
          id: `auto_fixed_${currentMonthStr}_${fe.id}`,
          type: "expense",
          amount: fe.amount,
          date: todayDateStr,
          category: fe.category,
          description: `${fe.name} (Gasto Fijo)`,
        });
        return { ...fe, lastProcessedMonth: currentMonthStr };
      }
      return fe;
    });

    if (updatedFixed) {
      setFixedExpenses(nextFixed);
      setTransactions((prev) => {
        const uniqueNew = newTransactions.filter(
          (nt) => !prev.some((pt) => pt.id === nt.id)
        );
        if (uniqueNew.length === 0) return prev;
        return [...uniqueNew, ...prev].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
      });
    }
  }, [fixedExpenses]);

  useEffect(() => {
    localStorage.setItem("personal_finance_data", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(
      "personal_finance_fixed",
      JSON.stringify(fixedExpenses)
    );
  }, [fixedExpenses]);

  useEffect(() => {
    localStorage.setItem("personal_finance_savings", savings.toString());
  }, [savings]);

  useEffect(() => {
    localStorage.setItem("personal_finance_budgets", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.body.style.backgroundColor = "#030712";
    document.documentElement.style.backgroundColor = "#030712";

    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.name = "theme-color";
      document.getElementsByTagName("head")[0].appendChild(metaThemeColor);
    }
    metaThemeColor.content = "#030712";
  }, []);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let savingsDepositsThisMonth = 0;
    let savingsWithdrawalsThisMonth = 0;
    const categoryTotals = {};

    transactions.forEach((t) => {
      if (t.type === "income") {
        income += t.amount;
      } else if (t.type === "expense") {
        expense += t.amount;
        categoryTotals[t.category] =
          (categoryTotals[t.category] || 0) + t.amount;
      } else if (t.type === "savings_deposit") {
        savingsDepositsThisMonth += t.amount;
      } else if (t.type === "savings_withdraw") {
        savingsWithdrawalsThisMonth += t.amount;
      }
    });

    const balance =
      income - expense - savingsDepositsThisMonth + savingsWithdrawalsThisMonth;

    const chartData = Object.entries(categoryTotals)
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        color: getCategoryColor(cat),
      }))
      .sort((a, b) => b.amount - a.amount);

    return { income, expense, balance, chartData };
  }, [transactions]);

  const allCategoriesForBudget = useMemo(() => {
    const cats = new Set([
      ...DEFAULT_CATEGORIES,
      ...stats.chartData.map((c) => c.category),
    ]);
    cats.delete("Ahorro");
    cats.delete("Ingreso");
    return Array.from(cats);
  }, [stats.chartData]);

  const unbudgetedCategories = allCategoriesForBudget.filter(
    (c) => budgets[c] === undefined
  );

  const filteredTransactions = useMemo(() => {
    const today = new Date();
    const todayStr = getLocalDateString(today);

    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    const weekAgoStr = getLocalDateString(weekAgo);

    const monthAgo = new Date();
    monthAgo.setMonth(today.getMonth() - 1);
    const monthAgoStr = getLocalDateString(monthAgo);

    return transactions.filter((t) => {
      // Ocultar las transacciones de ahorro
      if (t.type === "savings_deposit" || t.type === "savings_withdraw")
        return false;

      let timeMatch = true;
      if (timeFilter === "today") timeMatch = t.date === todayStr;
      else if (timeFilter === "week") timeMatch = t.date >= weekAgoStr;
      else if (timeFilter === "month") timeMatch = t.date >= monthAgoStr;

      let typeMatch = true;
      if (typeFilter === "income") typeMatch = t.type === "income";
      else if (typeFilter === "expense") typeMatch = t.type === "expense";

      return timeMatch && typeMatch;
    });
  }, [transactions, timeFilter, typeFilter]);

  const handleOpenModal = (t = null) => {
    setIsQuickAdd(false);
    if (t) {
      setEditingId(t.id);
      setType(t.type);
      setAmount(t.amount.toString());
      setDate(t.date);
      setDescription(t.description);

      if (t.type === "expense") {
        if (DEFAULT_CATEGORIES.includes(t.category)) {
          setCategory(t.category);
          setCustomCategory("");
        } else {
          setCategory("Otros gastos");
          setCustomCategory(t.category);
        }
      } else {
        setCategory("Ingreso");
      }
    } else {
      setEditingId(null);
      setType("expense");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setCategory(DEFAULT_CATEGORIES[0]);
      setCustomCategory("");
      setDescription("");
    }
    setIsModalOpen(true);
  };

  const handleQuickAdd = (
    quickCategory,
    defaultDesc = "",
    transactionType = "expense"
  ) => {
    setEditingId(null);
    setType(transactionType);
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory(quickCategory);
    setDescription(defaultDesc);
    setIsQuickAdd(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setEditingId(null);
      setIsQuickAdd(false);
    }, 200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    let finalCategory = type === "income" ? "Ingreso" : category;

    if (!isQuickAdd && type === "expense" && category === "Otros gastos") {
      finalCategory =
        customCategory.trim() !== "" ? customCategory.trim() : "Gasto Vario";
    }

    const newTransaction = {
      id: editingId || Date.now().toString(),
      type,
      amount: Number(amount),
      date,
      category: finalCategory,
      description: description.trim(),
    };

    if (editingId) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === editingId ? newTransaction : t))
      );
    } else {
      setTransactions((prev) =>
        [newTransaction, ...prev].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        )
      );
    }

    handleCloseModal();
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "transaction") {
      setTransactions((prev) => prev.filter((t) => t.id !== itemToDelete.id));
    } else if (itemToDelete.type === "fixed") {
      setFixedExpenses((prev) => prev.filter((f) => f.id !== itemToDelete.id));
    }

    setItemToDelete(null);
  };

  const handleOpenBudgetModal = (cat) => {
    if (!cat && unbudgetedCategories.length > 0) {
      setBudgetCategory(unbudgetedCategories[0]);
      setBudgetAmount("");
    } else {
      setBudgetCategory(cat);
      setBudgetAmount(budgets[cat] ? budgets[cat].toString() : "");
    }
    setIsBudgetModalOpen(true);
  };

  const handleSubmitBudget = (e) => {
    e.preventDefault();
    const amt = Number(budgetAmount);
    if (!budgetCategory) return;

    setBudgets((prev) => ({ ...prev, [budgetCategory]: amt }));
    setIsBudgetModalOpen(false);
  };

  const handleOpenFixedModal = () => {
    setFixedName("");
    setFixedAmount("");
    setFixedCategory(DEFAULT_CATEGORIES[2]);
    setFixedBillingDay("1");
    setIsFixedModalOpen(true);
  };

  const handleSubmitFixed = (e) => {
    e.preventDefault();
    if (!fixedAmount || !fixedName || !fixedBillingDay) return;

    const todayDay = new Date().getDate();
    const bDay = Number(fixedBillingDay);

    if (bDay < todayDay) {
      setPendingFixed({
        id: Date.now().toString(),
        name: fixedName,
        amount: Number(fixedAmount),
        category: fixedCategory,
        billingDay: bDay,
      });
      setIsFixedModalOpen(false);
      setIsPastDateModalOpen(true);
    } else {
      const newFixed = {
        id: Date.now().toString(),
        name: fixedName,
        amount: Number(fixedAmount),
        category: fixedCategory,
        billingDay: bDay,
        lastProcessedMonth: getPreviousMonthStr(),
      };
      setFixedExpenses((prev) => [...prev, newFixed]);
      setIsFixedModalOpen(false);
    }
  };

  const handlePastDateChoice = (choice) => {
    if (!pendingFixed) return;
    const newFixed = {
      ...pendingFixed,
      lastProcessedMonth:
        choice === "today" ? getPreviousMonthStr() : getCurrentMonthStr(),
    };
    setFixedExpenses((prev) => [...prev, newFixed]);
    setIsPastDateModalOpen(false);
    setPendingFixed(null);
  };

  const handleCloseMonth = (carryOver = false) => {
    exportCSV();

    let initialTransactions = [];

    if (carryOver && stats.balance !== 0) {
      initialTransactions.push({
        id: Date.now().toString() + "_carry",
        type: stats.balance >= 0 ? "income" : "expense",
        amount: Math.abs(stats.balance),
        date: new Date().toISOString().split("T")[0],
        category: stats.balance >= 0 ? "Ingreso" : "Otros gastos",
        description: "Saldo del mes anterior",
      });
    }

    setTransactions(initialTransactions);
    setIsCloseMonthModalOpen(false);
  };

  const handleSavingsSubmit = (e) => {
    e.preventDefault();
    const amt = Number(savingsAmount);
    if (!amt || amt <= 0) return;

    if (savingsAction === "deposit") {
      if (amt > stats.balance) {
        setSavingsError(
          "No tienes suficiente saldo disponible para ahorrar este monto."
        );
        return;
      }
      const newTransaction = {
        id: `savings_dep_${Date.now()}`,
        type: "savings_deposit",
        amount: amt,
        date: new Date().toISOString().split("T")[0],
        category: "Ahorro",
        description: "Transferencia a fondo de ahorro",
      };
      setTransactions((prev) =>
        [newTransaction, ...prev].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        )
      );
      setSavings((prev) => prev + amt);
    } else {
      if (amt > savings) {
        setSavingsError(
          "No puedes retirar más dinero del que tienes ahorrado."
        );
        return;
      }
      const newTransaction = {
        id: `savings_wit_${Date.now()}`,
        type: "savings_withdraw",
        amount: amt,
        date: new Date().toISOString().split("T")[0],
        category: "Ahorro",
        description: "Retiro de fondo de ahorro",
      };
      setTransactions((prev) =>
        [newTransaction, ...prev].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        )
      );
      setSavings((prev) => prev - amt);
    }
    setSavingsError("");
    setIsSavingsModalOpen(false);
    setSavingsAmount("");
  };

  const exportCSV = () => {
    if (
      transactions.length === 0 &&
      fixedExpenses.length === 0 &&
      savings === 0 &&
      Object.keys(budgets).length === 0
    )
      return;

    const headers = ["Fecha", "Tipo", "Categoría", "Descripción", "Monto"];

    const tRows = transactions.map((t) => {
      let typeStr = "Gasto";
      if (t.type === "income") typeStr = "Ingreso";
      else if (t.type === "savings_deposit") typeStr = "Depósito Ahorro";
      else if (t.type === "savings_withdraw") typeStr = "Retiro Ahorro";

      return [t.date, typeStr, t.category, t.description || "", t.amount];
    });

    const fRows = fixedExpenses.map((f) => [
      f.billingDay.toString(),
      "[SYS] Fijo",
      f.category,
      f.name,
      f.amount,
    ]);

    const sRow = ["-", "[SYS] Ahorro", "-", "-", savings];

    const bRows = Object.entries(budgets).map(([cat, limit]) => [
      "-",
      "[SYS] Presupuesto",
      cat,
      "-",
      limit,
    ]);

    const allRows = [...tRows, ...fRows, sRow, ...bRows];

    let csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      allRows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Mis_Gastos_Respaldo_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(val);
  };

  const formatCompactCurrency = (val) => {
    if (val === 0) return "0";
    if (val >= 1000000)
      return (val / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (val >= 1000) return (val / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return val.toString();
  };

  const DonutChart = ({ data, total }) => {
    let cumulativePercent = 0;
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <PieChart size={48} className="mb-2 opacity-50" />
          <p>No hay gastos aún</p>
        </div>
      );
    }

    return (
      <div className="relative flex justify-center items-center h-64 w-full">
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full transform -rotate-90 drop-shadow-md"
        >
          {data.map((slice) => {
            const percent = (slice.amount / total) * 100;
            const strokeDasharray = `${percent} ${100 - percent}`;
            const strokeDashoffset = -cumulativePercent;
            cumulativePercent += percent;
            return (
              <circle
                key={slice.category}
                r="15.9155"
                cx="20"
                cy="20"
                fill="transparent"
                stroke={slice.color}
                strokeWidth="4"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-in-out hover:stroke-[5px]"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full pointer-events-none text-center">
          <span className="text-sm text-gray-500">Total Gastos</span>
          <span className="text-xl font-bold text-gray-800 dark:text-white">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    );
  };

  const todayDateForAvg = new Date();
  const totalDaysInMonth = new Date(
    todayDateForAvg.getFullYear(),
    todayDateForAvg.getMonth() + 1,
    0
  ).getDate();

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden transition-colors duration-300 dark bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="px-4 py-5 sm:px-6 md:px-8 max-w-4xl mx-auto flex justify-between items-center bg-gray-900 shadow-sm rounded-b-3xl relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 text-white p-2 rounded-xl">
            <DollarSign size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            MacDinero
          </h1>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => {
              setSavingsAmount("");
              setIsSavingsModalOpen(true);
            }}
            className="p-2 text-amber-500 hover:text-amber-400 bg-gray-800 rounded-full transition-colors flex items-center gap-1.5 px-3"
            title="Fondo de Ahorro"
          >
            <PiggyBank size={20} />
            <span className="text-sm font-bold">{formatCurrency(savings)}</span>
          </button>

          <button
            onClick={() => setIsCloseMonthModalOpen(true)}
            className="p-2 text-gray-400 hover:text-indigo-400 bg-gray-800 rounded-full transition-colors"
            title="Cerrar Mes"
          >
            <Archive size={20} />
          </button>
          <button
            onClick={exportCSV}
            className="p-2 text-gray-400 hover:text-gray-200 bg-gray-800 rounded-full transition-colors"
            title="Exportar CSV"
          >
            <Download size={20} />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-4xl mx-auto space-y-6 pb-24">
        {/* Dashboard Cards (Ahora Interactivas) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setTypeFilter("all")}
            className={`bg-gray-900 p-5 rounded-3xl shadow-sm border ${
              typeFilter === "all"
                ? "border-indigo-500/50 ring-1 ring-indigo-500/50"
                : "border-gray-800"
            } flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-gray-800/80`}
            title="Ver todos los movimientos"
          >
            <span className="text-sm font-medium text-gray-400 mb-1">
              Disponible
            </span>
            <span
              className={`text-3xl font-bold ${
                stats.balance >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {formatCurrency(stats.balance)}
            </span>
          </div>
          <div
            onClick={() =>
              setTypeFilter((prev) => (prev === "income" ? "all" : "income"))
            }
            className={`bg-gray-900 p-5 rounded-3xl shadow-sm border ${
              typeFilter === "income"
                ? "border-emerald-500/50 ring-1 ring-emerald-500/50"
                : "border-gray-800"
            } flex justify-between items-center sm:flex-col sm:justify-center cursor-pointer transition-all hover:bg-gray-800/80`}
            title="Filtrar solo ingresos"
          >
            <div className="flex items-center gap-2 sm:mb-2 text-emerald-400">
              <ArrowUpCircle size={20} />
              <span className="text-sm font-medium text-gray-400">
                Ingresos
              </span>
            </div>
            <span className="text-xl font-bold text-white">
              {formatCurrency(stats.income)}
            </span>
          </div>
          <div
            onClick={() =>
              setTypeFilter((prev) => (prev === "expense" ? "all" : "expense"))
            }
            className={`bg-gray-900 p-5 rounded-3xl shadow-sm border ${
              typeFilter === "expense"
                ? "border-rose-500/50 ring-1 ring-rose-500/50"
                : "border-gray-800"
            } flex justify-between items-center sm:flex-col sm:justify-center cursor-pointer transition-all hover:bg-gray-800/80`}
            title="Filtrar solo gastos"
          >
            <div className="flex items-center gap-2 sm:mb-2 text-rose-400">
              <ArrowDownCircle size={20} />
              <span className="text-sm font-medium text-gray-400">Gastos</span>
            </div>
            <span className="text-xl font-bold text-white">
              {formatCurrency(stats.expense)}
            </span>
          </div>
        </div>

        {/* View Toggles */}
        <div className="flex justify-center my-4 sm:my-6">
          <div className="bg-gray-800 p-1 rounded-full flex gap-1 overflow-x-auto max-w-full scrollbar-hide">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-1.5 sm:px-6 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-gray-700 shadow-sm text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <List size={14} className="sm:w-4 sm:h-4" /> Movimientos
            </button>
            <button
              onClick={() => setViewMode("chart")}
              className={`px-4 py-1.5 sm:px-6 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-all ${
                viewMode === "chart"
                  ? "bg-gray-700 shadow-sm text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <PieChart size={14} className="sm:w-4 sm:h-4" /> Resumen
            </button>
            <button
              onClick={() => setViewMode("fixed")}
              className={`px-4 py-1.5 sm:px-6 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-all ${
                viewMode === "fixed"
                  ? "bg-gray-700 shadow-sm text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Repeat size={14} className="sm:w-4 sm:h-4" /> Fijos
            </button>
          </div>
        </div>

        {/* --- PRESUPUESTOS (TARJETA SEPARADA) --- */}
        {viewMode === "list" && (
          <div className="bg-gray-900 rounded-3xl shadow-sm border border-gray-800 overflow-hidden mb-6">
            <div className="p-5 bg-gray-900/40">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2 text-gray-400">
                  <Target size={18} className="text-indigo-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Presupuestos
                  </h3>
                </div>
                {/* Apartado con la suma total de los presupuestos */}
                <div className="text-xs bg-gray-800/60 px-2.5 py-1 rounded-lg border border-gray-700/50 flex items-center shadow-inner">
                  <span className="text-indigo-400 font-bold">
                    {formatCurrency(
                      Object.values(budgets).reduce((sum, val) => sum + val, 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x items-end">
                {Object.entries(budgets).map(([cat, limit]) => {
                  const spentFromTransactions =
                    stats.chartData.find((c) => c.category === cat)?.amount ||
                    0;
                  const currentMonthStr = getCurrentMonthStr();

                  const pendingFixedAmount = fixedExpenses
                    .filter(
                      (f) =>
                        f.category === cat &&
                        f.lastProcessedMonth !== currentMonthStr
                    )
                    .reduce((sum, f) => sum + f.amount, 0);

                  const spent = spentFromTransactions + pendingFixedAmount;

                  let percentage = 0;
                  let barColor = "bg-emerald-500/90";

                  if (limit > 0) {
                    percentage = Math.min(100, (spent / limit) * 100);
                    if (percentage >= 100) barColor = "bg-rose-500/90";
                    else if (percentage >= 80) barColor = "bg-amber-500/90";
                  } else {
                    percentage = spent > 0 ? 100 : 0;
                    barColor = "bg-indigo-500/40";
                  }

                  return (
                    <div
                      key={cat}
                      onClick={() => handleOpenBudgetModal(cat)}
                      className="snap-start shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="relative w-16 h-36 bg-gray-800/80 rounded-[2rem] overflow-hidden border border-gray-700/50 group-hover:border-indigo-500/80 transition-all shadow-inner">
                        <div
                          className={`absolute bottom-0 w-full transition-all duration-700 ease-out ${barColor}`}
                          style={{ height: `${percentage}%` }}
                        ></div>

                        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center justify-center pointer-events-none drop-shadow-md">
                          <span className="text-2xl mb-1">
                            {CATEGORY_EMOJIS[cat] || "🏷️"}
                          </span>
                          <span className="text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded-md backdrop-blur-sm tracking-wider">
                            {formatCompactCurrency(spent)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center mt-0.5">
                        <span className="text-[10px] text-gray-300 font-medium truncate w-16 text-center leading-tight">
                          {cat}
                        </span>
                        {limit > 0 && (
                          <span className="text-[9px] text-indigo-400/90 font-bold truncate w-16 text-center leading-tight">
                            {formatCompactCurrency(limit)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div
                  onClick={() => handleOpenBudgetModal("")}
                  className="snap-start shrink-0 flex flex-col items-center justify-center gap-2 cursor-pointer group h-[168px]"
                >
                  <div className="w-16 h-36 border-2 border-dashed border-gray-700 rounded-[2rem] flex items-center justify-center group-hover:border-indigo-500 group-hover:bg-indigo-500/10 transition-colors bg-gray-800/30">
                    <Plus
                      size={24}
                      className="text-gray-500 group-hover:text-indigo-400"
                    />
                  </div>
                  <span className="text-[10px] text-transparent">Add</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-gray-900 rounded-3xl shadow-sm border border-gray-800 overflow-hidden min-h-[400px]">
          {viewMode === "list" && (
            <>
              {/* --- REGISTRO RÁPIDO --- */}
              <div className="p-4 border-b border-gray-800 bg-gray-900">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x items-center">
                  <button
                    onClick={() => handleQuickAdd("Ingreso", "", "income")}
                    className="snap-start shrink-0 flex items-center gap-2 bg-emerald-900/20 px-4 py-2.5 rounded-2xl shadow-sm border border-emerald-800/30 hover:border-emerald-500 hover:bg-emerald-900/40 transition-colors"
                  >
                    <span className="text-xl">💵</span>{" "}
                    <span className="text-sm font-medium text-emerald-400">
                      Ingreso
                    </span>
                  </button>
                  <div className="w-px h-8 bg-gray-800 self-center shrink-0 mx-1 rounded-full"></div>
                  <button
                    onClick={() => handleQuickAdd("Comida")}
                    className="snap-start shrink-0 flex items-center gap-2 bg-gray-800 px-4 py-2.5 rounded-2xl shadow-sm border border-gray-700 hover:border-amber-400 transition-colors"
                  >
                    <span className="text-xl">🍔</span>{" "}
                    <span className="text-sm font-medium text-gray-200">
                      Comida
                    </span>
                  </button>
                  <button
                    onClick={() => handleQuickAdd("Transporte")}
                    className="snap-start shrink-0 flex items-center gap-2 bg-gray-800 px-4 py-2.5 rounded-2xl shadow-sm border border-gray-700 hover:border-blue-400 transition-colors"
                  >
                    <span className="text-xl">🚌</span>{" "}
                    <span className="text-sm font-medium text-gray-200">
                      Transporte
                    </span>
                  </button>
                  <button
                    onClick={() => handleQuickAdd("Ocio", "Café")}
                    className="snap-start shrink-0 flex items-center gap-2 bg-gray-800 px-4 py-2.5 rounded-2xl shadow-sm border border-gray-700 hover:border-purple-400 transition-colors"
                  >
                    <span className="text-xl">☕</span>{" "}
                    <span className="text-sm font-medium text-gray-200">
                      Café
                    </span>
                  </button>
                  <button
                    onClick={() => handleQuickAdd("Hogar", "Supermercado")}
                    className="snap-start shrink-0 flex items-center gap-2 bg-gray-800 px-4 py-2.5 rounded-2xl shadow-sm border border-gray-700 hover:border-teal-400 transition-colors"
                  >
                    <span className="text-xl">🛒</span>{" "}
                    <span className="text-sm font-medium text-gray-200">
                      Súper
                    </span>
                  </button>
                </div>
              </div>

              {/* --- FILTRO DE TIEMPO --- */}
              <div className="px-4 py-3 border-b border-gray-800 flex gap-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setTimeFilter("today")}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    timeFilter === "today"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setTimeFilter("week")}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    timeFilter === "week"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  Últimos 7 días
                </button>
                <button
                  onClick={() => setTimeFilter("month")}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    timeFilter === "month"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  Último mes
                </button>
                <button
                  onClick={() => setTimeFilter("all")}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    timeFilter === "all"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  Todos
                </button>
              </div>

              {/* --- LISTA DE MOVIMIENTOS --- */}
              <div className="divide-y divide-gray-800">
                {filteredTransactions.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center">
                    <List size={32} className="text-gray-600 mb-4" />
                    <p className="text-gray-400">
                      No tienes movimientos en este periodo.
                    </p>
                  </div>
                ) : (
                  filteredTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 hover:bg-gray-800/50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor:
                              t.type === "income"
                                ? "#10b98120"
                                : `${getCategoryColor(t.category)}20`,
                            color:
                              t.type === "income"
                                ? "#10b981"
                                : getCategoryColor(t.category),
                          }}
                        >
                          {t.type === "income" ? (
                            <ArrowUpCircle size={20} />
                          ) : (
                            <ArrowDownCircle size={20} />
                          )}
                        </div>
                        <div className="truncate pr-4">
                          <p className="font-medium text-white truncate">
                            {t.category}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{t.date}</span>
                            {t.description && (
                              <>
                                <span className="opacity-50">•</span>
                                <span className="truncate">
                                  {t.description}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span
                          className={`font-semibold ${
                            t.type === "income"
                              ? "text-emerald-500"
                              : "text-white"
                          }`}
                        >
                          {t.type === "income" ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </span>
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenModal(t)}
                            className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30 rounded-lg"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() =>
                              setItemToDelete({ id: t.id, type: "transaction" })
                            }
                            className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-900/30 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* --- VISTA DE RESUMEN CON PROMEDIOS DIARIOS --- */}
          {viewMode === "chart" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-6 text-center text-white">
                Desglose de Gastos
              </h2>
              <DonutChart data={stats.chartData} total={stats.expense} />

              <div className="mt-8 space-y-4">
                <div className="flex justify-between items-end px-1 mb-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Por Categoría
                  </h3>
                  <span className="text-xs text-gray-500">
                    Promedio en base a {totalDaysInMonth} días
                  </span>
                </div>

                {stats.chartData.map((item) => (
                  <div
                    key={item.category}
                    className="bg-gray-800/40 p-4 rounded-2xl border border-gray-800 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-200">
                          {CATEGORY_EMOJIS[item.category] || "🏷️"}{" "}
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">
                          {((item.amount / stats.expense) * 100).toFixed(1)}%
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-700/50">
                      <span className="text-gray-500">Gasto diario:</span>
                      <span className="font-medium text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">
                        {formatCurrency(
                          Math.round(item.amount / totalDaysInMonth)
                        )}{" "}
                        / día
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === "fixed" && (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Gastos Recurrentes
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Se registran automáticamente cada mes en su fecha.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleOpenFixedModal}
                    className="flex items-center justify-center gap-2 bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/60 px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    <Plus size={18} /> Añadir Fijo
                  </button>
                </div>
              </div>

              {fixedExpenses.length === 0 ? (
                <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
                  <Repeat size={32} className="mx-auto opacity-30 mb-3" />
                  <p className="text-gray-400">
                    No tienes gastos fijos configurados.
                  </p>
                  <p className="text-sm mt-1">
                    Añade aquí suscripciones, arriendo, seguros...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fixedExpenses.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between bg-gray-800/50 p-4 rounded-2xl border border-gray-800"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${getCategoryColor(
                              f.category
                            )}20`,
                            color: getCategoryColor(f.category),
                          }}
                        >
                          <Tag size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{f.name}</p>
                          <p className="text-xs text-gray-400">
                            {f.category} • Día {f.billingDay || 1}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-rose-500">
                          -{formatCurrency(f.amount)}
                        </span>
                        <button
                          onClick={() =>
                            setItemToDelete({ id: f.id, type: "fixed" })
                          }
                          className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      {viewMode !== "fixed" && (
        <button
          onClick={() => handleOpenModal()}
          className="fixed bottom-12 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all transform hover:scale-105 z-40"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Modal Confirmación de Eliminación */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 w-full max-w-sm mx-auto rounded-3xl shadow-2xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-4 text-rose-500">
              <AlertTriangle size={28} />
              <h3 className="text-xl font-bold text-white">
                Confirmar eliminación
              </h3>
            </div>
            <p className="text-gray-400 mb-6 text-sm">
              ¿Estás seguro de que deseas eliminar este registro? Esta acción no
              se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Popup for Add/Edit Normal & Quick */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 w-full max-w-md mx-auto rounded-3xl shadow-2xl transform transition-all border border-gray-800 my-8">
            <div className="flex justify-between items-center p-5 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">
                {isQuickAdd
                  ? type === "income"
                    ? "Nuevo Ingreso"
                    : `Añadir a ${category}`
                  : editingId
                  ? "Editar Registro"
                  : "Nuevo Registro"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:bg-gray-800 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {!isQuickAdd && (
                <div className="flex p-1 bg-gray-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg ${
                      type === "expense"
                        ? "bg-gray-700 text-rose-500 shadow-sm"
                        : "text-gray-400"
                    }`}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg ${
                      type === "income"
                        ? "bg-gray-700 text-emerald-500 shadow-sm"
                        : "text-gray-400"
                    }`}
                  >
                    Ingreso
                  </button>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Monto
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-lg">$</span>
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full min-w-0 max-w-full pl-8 pr-3 py-3 bg-gray-800 border-0 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 text-lg font-semibold"
                    placeholder="0"
                    autoFocus={isQuickAdd}
                  />
                </div>
              </div>

              {!isQuickAdd && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Fecha
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Calendar size={18} />
                      </div>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="block w-full min-w-0 max-w-full pl-10 pr-3 py-3 bg-gray-800 border-0 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 appearance-none m-0 box-border"
                      />
                    </div>
                  </div>

                  {type === "expense" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Categoría
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Tag size={18} />
                          </div>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="block w-full min-w-0 max-w-full pl-10 pr-3 py-3 bg-gray-800 border-0 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 appearance-none box-border"
                          >
                            {DEFAULT_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {category === "Otros gastos" && (
                        <div>
                          <input
                            type="text"
                            required={category === "Otros gastos"}
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            placeholder="Ej: Regalo, Mascota..."
                            className="block w-full min-w-0 max-w-full px-4 py-3 bg-indigo-900/20 border border-indigo-800/50 rounded-xl text-sm box-border text-white"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full min-w-0 max-w-full px-4 py-3 bg-gray-800 border-0 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 box-border"
                  placeholder={
                    isQuickAdd
                      ? `Anotación sobre el gasto en ${category}...`
                      : "Detalles..."
                  }
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Guardar {type === "expense" ? "Gasto" : "Ingreso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Gastos Fijos */}
      {isFixedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 w-full max-w-md mx-auto rounded-3xl shadow-2xl transform border border-gray-800">
            <div className="flex justify-between items-center p-5 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Nuevo Gasto Fijo</h3>
              <button
                onClick={() => setIsFixedModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-800 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitFixed} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nombre / Identificador
                </label>
                <input
                  type="text"
                  required
                  value={fixedName}
                  onChange={(e) => setFixedName(e.target.value)}
                  placeholder="Ej: Pago Auto, Netflix, Spotify..."
                  className="block w-full min-w-0 max-w-full px-4 py-3 bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 box-border text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Monto Mensual
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                    className="block w-full min-w-0 max-w-full pl-8 pr-3 py-3 bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 box-border text-white"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Día de cobro (1-31)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    max="31"
                    step="1"
                    value={fixedBillingDay}
                    onChange={(e) => setFixedBillingDay(e.target.value)}
                    className="block w-full min-w-0 max-w-full pl-10 pr-3 py-3 bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 box-border text-white"
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Categoría
                </label>
                <select
                  value={fixedCategory}
                  onChange={(e) => setFixedCategory(e.target.value)}
                  className="block w-full min-w-0 max-w-full px-4 py-3 bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none box-border text-white"
                >
                  {DEFAULT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
                >
                  Guardar Gasto Fijo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Decisión Fecha Pasada */}
      {isPastDateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 w-full max-w-md mx-auto rounded-3xl shadow-2xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <Calendar size={28} />
              <h3 className="text-xl font-bold text-white">
                El día de cobro ya pasó
              </h3>
            </div>
            <p className="text-gray-400 mb-6 text-sm">
              El día de cobro que ingresaste ({pendingFixed?.billingDay}) ya
              pasó en este mes. ¿Deseas descontar este gasto hoy mismo o empezar
              a cobrarlo desde el próximo mes?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handlePastDateChoice("today")}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Registrar descuento Hoy
              </button>
              <button
                onClick={() => handlePastDateChoice("next_month")}
                className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
              >
                Cobrar desde el Próximo Mes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar Presupuesto */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 w-full max-w-sm mx-auto rounded-3xl shadow-2xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Target size={24} />
                <h3 className="text-xl font-bold text-white">
                  {budgetCategory && budgets[budgetCategory]
                    ? "Editar Presupuesto"
                    : "Nuevo Presupuesto"}
                </h3>
              </div>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-800 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitBudget}>
              {!budgetCategory || !budgets[budgetCategory] ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Selecciona la Categoría
                  </label>
                  <select
                    value={budgetCategory}
                    onChange={(e) => setBudgetCategory(e.target.value)}
                    className="block w-full px-4 py-3 bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none text-white mb-4"
                  >
                    {unbudgetedCategories.length === 0 && (
                      <option value="" disabled>
                        Todas asignadas
                      </option>
                    )}
                    {unbudgetedCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-gray-400 mb-4 text-sm">
                  Define el límite mensual para{" "}
                  <strong className="text-white">{budgetCategory}</strong>.
                </p>
              )}

              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="block w-full min-w-0 max-w-full pl-8 pr-3 py-3 bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 box-border text-white text-lg font-semibold"
                  placeholder="0"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                {budgetCategory && budgets[budgetCategory] !== undefined && (
                  <button
                    type="button"
                    onClick={() => {
                      const newBudgets = { ...budgets };
                      delete newBudgets[budgetCategory];
                      setBudgets(newBudgets);
                      setIsBudgetModalOpen(false);
                    }}
                    className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-colors flex items-center justify-center"
                    title="Eliminar de la vista principal"
                  >
                    <Trash2 size={24} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!budgetCategory}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Cerrar Mes */}
      {isCloseMonthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 w-full max-w-md mx-auto rounded-3xl shadow-2xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <AlertTriangle size={28} />
              <h3 className="text-xl font-bold text-white">Cerrar el Mes</h3>
            </div>
            <p className="text-gray-400 mb-6 text-sm">
              Estás a punto de finalizar el mes actual. Se descargará un
              respaldo automático y se limpiará tu lista de movimientos.{" "}
              <strong>
                Tus gastos fijos y presupuestos se mantendrán intactos.
              </strong>
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleCloseMonth(true)}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Traspasar saldo ({formatCurrency(stats.balance)}) y Reiniciar
              </button>
              <button
                onClick={() => handleCloseMonth(false)}
                className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
              >
                Reiniciar desde cero ($0)
              </button>
              <button
                onClick={() => setIsCloseMonthModalOpen(false)}
                className="w-full py-3 px-4 text-gray-400 hover:text-gray-300 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ahorro */}
      {isSavingsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-900 w-full max-w-md mx-auto rounded-3xl shadow-2xl transform border border-gray-800 my-8">
            <div className="flex justify-between items-center p-5 border-b border-gray-800">
              <div className="flex items-center gap-2 text-amber-500">
                <PiggyBank size={24} />
                <h3 className="text-xl font-bold text-white">
                  Fondo de Ahorro
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsSavingsModalOpen(false);
                  setSavingsError("");
                }}
                className="p-2 text-gray-400 hover:bg-gray-800 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 bg-gray-800/30 text-center border-b border-gray-800">
              <span className="text-sm font-medium text-gray-400 mb-1 block">
                Ahorro Total Acumulado
              </span>
              <span className="text-4xl font-bold text-amber-400">
                {formatCurrency(savings)}
              </span>
            </div>

            <form onSubmit={handleSavingsSubmit} className="p-5 space-y-4">
              <div className="flex p-1 bg-gray-800 rounded-xl mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setSavingsAction("deposit");
                    setSavingsError("");
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg ${
                    savingsAction === "deposit"
                      ? "bg-gray-700 text-emerald-400 shadow-sm"
                      : "text-gray-400"
                  }`}
                >
                  Guardar Dinero
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSavingsAction("withdraw");
                    setSavingsError("");
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg ${
                    savingsAction === "withdraw"
                      ? "bg-gray-700 text-rose-400 shadow-sm"
                      : "text-gray-400"
                  }`}
                >
                  Retirar Dinero
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Monto a {savingsAction === "deposit" ? "guardar" : "retirar"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    max={
                      savingsAction === "withdraw"
                        ? Math.max(savings, 1)
                        : undefined
                    }
                    step="1"
                    value={savingsAmount}
                    onChange={(e) => {
                      setSavingsAmount(e.target.value);
                      setSavingsError("");
                    }}
                    className="block w-full min-w-0 max-w-full pl-8 pr-3 py-3 bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 box-border text-white text-lg font-semibold"
                    placeholder="0"
                    autoFocus
                  />
                </div>
                {savingsError ? (
                  <p className="text-sm text-rose-500 mt-2 font-medium">
                    {savingsError}
                  </p>
                ) : (
                  <>
                    {savingsAction === "deposit" && (
                      <p className="text-xs text-gray-500 mt-2">
                        Este monto se transferirá a tus ahorros y ya no
                        aparecerá en tu lista de movimientos.
                      </p>
                    )}
                    {savingsAction === "withdraw" && (
                      <p className="text-xs text-gray-500 mt-2">
                        Este monto regresará a tu saldo disponible desde tus
                        ahorros.
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className={`w-full py-3 px-4 text-white font-semibold rounded-xl transition-colors ${
                    savingsAction === "deposit"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  Confirmar {savingsAction === "deposit" ? "Ahorro" : "Retiro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
