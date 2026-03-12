import { useState } from "react";
import { DollarSign, ShoppingCart, ChevronRight, Repeat } from "lucide-react";
import Modal from "./UI/Modal";
import PaymentModal from "./PaymentModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal.jsx";

const RecentTransactions = ({ transactions, onUpdate, onDelete }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (transaction, e) => {
    e.stopPropagation(); // Prevent opening edit modal
    setSelectedTransaction(transaction);
    setDeleteModalOpen(true);
  };

  const handleUpdateSuccess = (updatedPayment) => {
    setEditModalOpen(false);
    setSelectedTransaction(null);
    if (onUpdate) onUpdate(updatedPayment);
  };

  const handleDeleteConfirm = async () => {
    if (selectedTransaction && onDelete) {
      await onDelete(selectedTransaction.id);
    }
    setDeleteModalOpen(false);
    setSelectedTransaction(null);
  };

  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  return (
    <>
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ostatnie transakcje</h3>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Brak transakcji</p>
          ) : (
            transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                onClick={() => handleTransactionClick(transaction)}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? (
                      <DollarSign size={20} className="text-green-600" />
                    ) : (
                      <ShoppingCart size={20} className="text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{transaction.title}</p>
                      {transaction.is_recurring && (
                        <Repeat size={16} className="text-violet-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {transaction.category} • {transaction.member_nickname || 'Użytkownik'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : ''}{formatAmount(transaction.amount)} PLN
                    </p>
                    <p className="text-sm text-gray-500">{transaction.date}</p>
                  </div>
                  <ChevronRight 
                    size={20} 
                    className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" 
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <PaymentModal 
          transaction={selectedTransaction}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleUpdateSuccess}
          onDelete={(e) => handleDeleteClick(selectedTransaction, e)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        transactionTitle={selectedTransaction?.title}
      />
    </>
  );
};

export default RecentTransactions;