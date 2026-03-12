import { useState } from "react";
import { ChevronRight, ChevronLeft, Repeat, Wallet, Banknote } from "lucide-react";
import Modal from "./UI/Modal.jsx";
import PaymentModal from "./PaymentModal.jsx";
import ConfirmDeleteModal from "./ConfirmDeleteModal.jsx";

const IncomeTable = ({ income, onUpdate, onDelete, accountMembers, currentUser }) => {
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;

  const handleIncomeClick = (income) => {
    setSelectedIncome(income);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (income, e) => {
    e.stopPropagation();
    setSelectedIncome(income);
    setDeleteModalOpen(true);
  };

  const handleUpdateSuccess = (updatedPayment) => {
    setEditModalOpen(false);
    setSelectedIncome(null);
    if (onUpdate) onUpdate(updatedPayment);
  };

  const handleDeleteConfirm = async () => {
    if (selectedIncome && onDelete) {
      await onDelete(selectedIncome.id);
    }
    setDeleteModalOpen(false);
    setSelectedIncome(null);
  };

  const getCategoryColor = (category) => {
    const colors = {
      praca: 'bg-blue-100 text-blue-700',
      zlecenie: 'bg-green-100 text-green-700',
      dodatkowe: 'bg-purple-100 text-purple-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getRecurringLabel = (frequency) => {
    const labels = {
      daily: 'Codziennie',
      weekly: 'Co tydzień',
      monthly: 'Co miesiąc',
      yearly: 'Co rok'
    };
    return labels[frequency] || frequency;
  };

  const getAccountTypeLabel = (accountType) => {
    const labels = {
      default: 'Domyślne',
      cash: 'Gotówka'
    };
    return labels[accountType] || accountType;
  };

  const getAccountTypeIcon = (accountType) => {
    return accountType === 'cash' ? <Banknote size={14} /> : <Wallet size={14} />;
  };

  // Format income for PaymentModal
  const formatIncomeForModal = (income) => {
    if (!income) return null;
    
    return {
      id: income.id,
      title: income.title,
      category: income.category,
      amount: income.amount,
      date: income.date,
      type: 'income',
      account_member_id: income.account_member_id,
      account_type: income.account_type || 'default',
      is_recurring: income.is_recurring || false,
      recurring_frequency: income.recurring_frequency
    };
  };

  // Pagination calculations
  const totalPages = Math.ceil(income.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIncome = income.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tytuł
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Osoba
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Konto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cykl
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kwota
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currentIncome.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                  Brak dochodów do wyświetlenia
                </td>
              </tr>
            ) : (
              currentIncome.map((incomeItem) => (
                <tr 
                  key={incomeItem.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => handleIncomeClick(incomeItem)}
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{incomeItem.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(incomeItem.category)}`}>
                      {incomeItem.category.charAt(0).toUpperCase() + incomeItem.category.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {incomeItem.member_nickname ? incomeItem.member_nickname.split(' ').map(n => n[0]).join('').substring(0, 2) : 'U'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-700">
                        {incomeItem.member_nickname || currentUser?.nickname || 'Użytkownik'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      {getAccountTypeIcon(incomeItem.account_type)}
                      <span className="text-xs">
                        {getAccountTypeLabel(incomeItem.account_type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {incomeItem.date}
                  </td>
                  <td className="px-6 py-4">
                    {incomeItem.is_recurring ? (
                      <div className="flex items-center gap-1.5 text-violet-600">
                        <Repeat size={16} className="flex-shrink-0" />
                        <span className="text-xs font-medium">
                          {getRecurringLabel(incomeItem.recurring_frequency)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Jednorazowy</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-green-600">
                      +{incomeItem.amount.toFixed(2)} PLN
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight 
                      size={20} 
                      className="text-gray-400 group-hover:text-gray-600 transition-colors" 
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Pokazuję {startIndex + 1}-{Math.min(endIndex, income.length)} z {income.length} dochodów
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(1)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    currentPage === 1
                      ? 'bg-violet-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  1
                </button>

                {currentPage > 3 && totalPages > 4 && (
                  <span className="px-2 text-gray-400">...</span>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return page !== 1 && page !== totalPages;
                    if (currentPage <= 3) return page > 1 && page < 6 && page !== totalPages;
                    if (currentPage >= totalPages - 2) return page > totalPages - 5 && page < totalPages;
                    return page >= currentPage - 1 && page <= currentPage + 1;
                  })
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        currentPage === page
                          ? 'bg-violet-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                {currentPage < totalPages - 2 && totalPages > 4 && (
                  <span className="px-2 text-gray-400">...</span>
                )}

                {totalPages > 1 && (
                  <button
                    onClick={() => goToPage(totalPages)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      currentPage === totalPages
                        ? 'bg-violet-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {totalPages}
                  </button>
                )}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <PaymentModal 
          transaction={formatIncomeForModal(selectedIncome)}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleUpdateSuccess}
          onDelete={(e) => handleDeleteClick(selectedIncome, e)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        transactionTitle={selectedIncome?.title}
      />
    </>
  );
};

export default IncomeTable;