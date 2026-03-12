import { useState } from "react";
import { PlusCircle, MinusCircle } from "lucide-react";
import { createSavingsDeposit } from "../services/api";

export default function AddSavingsModal({ 
  goal, 
  accountMembers = [],
  onClose, 
  onSubmit 
}) {
  const [formData, setFormData] = useState({
    transaction_type: 'deposit',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: '',
    account_member_id: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Kwota musi być większa od zera';
    }

    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Data jest wymagana';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);

      const submitData = {
        savings_goal_id: goal.id,
        transaction_type: formData.transaction_type,
        amount: parseFloat(formData.amount),
        transaction_date: formData.transaction_date,
        notes: formData.notes.trim() || null,
        account_member_id: formData.account_member_id ? parseInt(formData.account_member_id) : null
      };

      await createSavingsDeposit(submitData);
      onSubmit();
    } catch (error) {
      console.error('Error adding savings:', error);
      alert(error.message || 'Nie udało się dodać transakcji');
    } finally {
      setSubmitting(false);
    }
  };

  const isDeposit = formData.transaction_type === 'deposit';

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isDeposit ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isDeposit ? (
            <PlusCircle className="text-green-600" size={24} />
          ) : (
            <MinusCircle className="text-red-600" size={24} />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isDeposit ? 'Dodaj wpłatę' : 'Dodaj wypłatę'}
          </h2>
          <p className="text-sm text-gray-500">
            Cel: <span className="font-medium">{goal.name}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Typ transakcji
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'deposit' }))}
              className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                isDeposit
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <PlusCircle className="inline mr-2" size={18} />
              Wpłata
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, transaction_type: 'withdrawal' }))}
              className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                !isDeposit
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MinusCircle className="inline mr-2" size={18} />
              Wypłata
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kwota (PLN) *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              errors.amount ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
          )}
        </div>

        {/* Transaction Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data transakcji *
          </label>
          <input
            type="date"
            name="transaction_date"
            value={formData.transaction_date}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              errors.transaction_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.transaction_date && (
            <p className="mt-1 text-sm text-red-600">{errors.transaction_date}</p>
          )}
        </div>

        {/* Account Member */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Osoba (opcjonalnie)
          </label>
          <select
            name="account_member_id"
            value={formData.account_member_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Domyślne (Ty)</option>
            {accountMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.nickname}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Kto dokonał tej transakcji?
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notatki (opcjonalnie)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Dodatkowe informacje..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
        </div>

        {/* Summary */}
        <div className={`p-4 rounded-lg border-2 ${
          isDeposit 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Aktualny stan:
            </span>
            <span className="text-lg font-bold text-gray-900">
              {goal.current_amount.toFixed(2)} PLN
            </span>
          </div>
          {formData.amount && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-300">
              <span className="text-sm font-medium text-gray-700">
                Po transakcji:
              </span>
              <span className={`text-lg font-bold ${
                isDeposit ? 'text-green-600' : 'text-red-600'
              }`}>
                {(isDeposit 
                  ? goal.current_amount + parseFloat(formData.amount || 0)
                  : goal.current_amount - parseFloat(formData.amount || 0)
                ).toFixed(2)} PLN
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`flex-1 px-4 py-3 rounded-lg text-white font-medium transition ${
              isDeposit
                ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
                : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
            } disabled:cursor-not-allowed`}
          >
            {submitting ? 'Zapisywanie...' : (isDeposit ? 'Dodaj wpłatę' : 'Dodaj wypłatę')}
          </button>
        </div>
      </form>
    </div>
  );
}