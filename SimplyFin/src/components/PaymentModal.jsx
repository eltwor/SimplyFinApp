import { useState, useEffect } from "react";
import { createPayment, updatePayment, getAccountMembers, getCurrentUser, getAccountTypes } from "../services/api";
import { TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import { useDataRefresh } from "../contexts/DataRefreshContext";

const PaymentModal = ({ transaction = null, initialType = null, onClose, onSubmit, onDelete }) => {
  const { triggerRefresh } = useDataRefresh();

  const isEditMode = !!transaction;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [accountMembers, setAccountMembers] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedType, setSelectedType] = useState(initialType || transaction?.type || "expense");
  const [isRecurring, setIsRecurring] = useState(transaction?.is_recurring || false);

  const expenseCategories = [
    "mieszkanie",
    "jedzenie",
    "praca",
    "rozrywka",
    "transport",
    "inne"
  ];

  const incomeCategories = [
    "praca",
    "zlecenie",
    "dodatkowe"
  ];

  const categories = selectedType === "expense" ? expenseCategories : incomeCategories;

  useEffect(() => {
    fetchData();
    if (transaction) {
      setSelectedType(transaction.type);
      setIsRecurring(transaction.is_recurring || false);
    }
  }, [transaction]);

  const fetchData = async () => {
    try {
      const [user, members, types] = await Promise.all([
        getCurrentUser(),
        getAccountMembers(),
        getAccountTypes()
      ]);
      
      setCurrentUser(user);
      const activeMembers = members.filter(m => m.is_active);
      setAccountMembers(activeMembers);
      const activeTypes = types.filter(t => t.is_active);
      setAccountTypes(activeTypes);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Get form values directly from refs or state
    const titleInput = document.querySelector('input[name="title"]');
    const categorySelect = document.querySelector('select[name="category"]');
    const amountInput = document.querySelector('input[name="amount"]');
    const dateInput = document.querySelector('input[name="payment_date"]');
    const memberSelect = document.querySelector('select[name="account_member_id"]');
    const accountTypeSelect = document.querySelector('select[name="account_type"]');
    const frequencySelect = document.querySelector('select[name="recurring_frequency"]');

    let amount = parseFloat(amountInput?.value || 0);
    if (selectedType === "expense" && amount > 0) {
      amount = -Math.abs(amount);
    } else if (selectedType === "income" && amount < 0) {
      amount = Math.abs(amount);
    }

    const payload = {
      title: (titleInput?.value || "").trim(),
      category: (categorySelect?.value || "").trim(),
      amount: amount,
      payment_type: selectedType,
      payment_date: dateInput?.value,
      account_member_id: memberSelect?.value && memberSelect.value !== "default" 
        ? parseInt(memberSelect.value) 
        : null,
      account_type: accountTypeSelect?.value || "default",
      is_recurring: isRecurring,
      recurring_frequency: isRecurring ? frequencySelect?.value : null,
    };

    // Validation
    if (!payload.title) {
      setError("Wpisz tytuł płatności.");
      return;
    }
    if (!payload.category) {
      setError("Wybierz kategorię.");
      return;
    }
    if (isNaN(payload.amount) || payload.amount === 0) {
      setError("Podaj poprawną kwotę (niezerową).");
      return;
    }
    if (!payload.payment_date) {
      setError("Wybierz datę płatności.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      let result;
      if (isEditMode) {
        result = await updatePayment(transaction.id, payload);
      } else {
        result = await createPayment(payload);
      }
      console.log("Payment saved:", result);
      triggerRefresh('payments');

      if (onSubmit) onSubmit(result);
      if (onClose) onClose();
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} payment:`, err);
      setError(`Błąd podczas ${isEditMode ? 'aktualizacji' : 'dodawania'} płatności.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showMemberDropdown = accountMembers.length > 0;

  // Parse date from DD-MM-YYYY to YYYY-MM-DD for input
  const parseDate = (dateStr) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  // Get absolute value for display in edit mode
  const getAbsoluteAmount = (amount) => {
    return Math.abs(parseFloat(amount || 0));
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? "Edytuj płatność" : "Dodaj płatność"}
        </h3>
        {isEditMode && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Usuń transakcję"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setSelectedType("expense")}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
            selectedType === "expense"
              ? "bg-white text-red-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <TrendingDown size={20} />
          Wydatek
        </button>
        <button
          type="button"
          onClick={() => setSelectedType("income")}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
            selectedType === "income"
              ? "bg-white text-green-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <TrendingUp size={20} />
          Przychód
        </button>
      </div>

      {/* Form Fields - Responsive Grid */}
      <div className="space-y-4 mb-6">
        {/* Title - Full Width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tytuł
          </label>
          <input
            name="title"
            type="text"
            defaultValue={transaction?.title || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent"
            placeholder={selectedType === "expense" ? "np. Czynsz" : "np. Wynagrodzenie"}
            required
          />
        </div>

        {/* Category and Amount - Side by Side on Large Screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategoria
            </label>
            <select
              name="category"
              defaultValue={transaction?.category || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent"
              required
            >
              <option value="" disabled>Wybierz kategorię</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kwota (PLN)
            </label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={transaction ? getAbsoluteAmount(transaction.amount) : ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Person and Account Type - Side by Side on Large Screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Osoba
            </label>
            {showMemberDropdown ? (
              <select
                name="account_member_id"
                defaultValue={transaction?.account_member_id || "default"}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent"
              >
                <option value="default">
                  {currentUser?.nickname || "Ty"} (domyślne)
                </option>
                {accountMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.nickname}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed">
                {currentUser?.nickname || "Ty"} (brak innych osób na koncie)
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konto
            </label>
            <select
              name="account_type"
              defaultValue={transaction?.account_type || "default"}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent"
            >
              {accountTypes.map((type) => (
                <option key={type.id || type.name} value={type.name}>
                  {type.name === 'default' ? 'Domyślne' : type.name === 'cash' ? 'Gotówka' : type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date - Full Width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data płatności
          </label>
          <input
            name="payment_date"
            type="date"
            defaultValue={transaction ? parseDate(transaction.date) : ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent"
            required
          />
        </div>

        {/* Recurring Payment Option */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Płatność cykliczna
            </label>
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isRecurring ? "bg-violet-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isRecurring ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          
          {isRecurring && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Częstotliwość
              </label>
              <select
                name="recurring_frequency"
                defaultValue={transaction?.recurring_frequency || "monthly"}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent"
              >
                <option value="daily">Codziennie</option>
                <option value="weekly">Co tydzień</option>
                <option value="monthly">Co miesiąc</option>
                <option value="yearly">Co rok</option>
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
          disabled={isSubmitting}
        >
          Anuluj
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 px-4 py-3 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? (isEditMode ? "Zapisywanie..." : "Dodawanie...") 
            : (isEditMode ? "Zapisz zmiany" : "Dodaj")}
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;