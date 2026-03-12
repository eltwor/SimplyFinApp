import { useState } from "react";
import { Plus, Edit2, Trash2, History, CheckCircle, Calendar, Building2, User } from "lucide-react";
import Modal from "./UI/Modal";
import AddSavingsModal from "./AddSavingsModal";
import CreateGoalModal from "./CreateGoalModal";
import TransactionHistoryModal from "./TransactionHistoryModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { deleteSavingsGoal, updateSavingsGoal } from "../services/api";

export default function SavingsGoalCard({ 
  goal, 
  accountMembers, 
  savingsAccounts,
  currentUser,
  onUpdate, 
  onDelete 
}) {
  const [addSavingsOpen, setAddSavingsOpen] = useState(false);
  const [editGoalOpen, setEditGoalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const getMemberName = (memberId) => {
    if (!memberId) return currentUser?.nickname || 'Ty';
    const member = accountMembers.find(m => m.id === memberId);
    return member?.nickname || 'Nieznany';
  };

  const getAccountName = (accountId) => {
    if (!accountId) return null;
    const account = savingsAccounts.find(a => a.id === accountId);
    return account?.name || 'Nieznane konto';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const daysUntilDeadline = () => {
    if (!goal.deadline) return null;
    const deadline = new Date(goal.deadline);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleToggleComplete = async () => {
    try {
      await updateSavingsGoal(goal.id, {
        is_completed: !goal.is_completed
      });
      onUpdate();
    } catch (error) {
      console.error('Error toggling completion:', error);
      alert('Nie udało się zaktualizować statusu celu');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSavingsGoal(goal.id);
      setDeleteModalOpen(false);
      onDelete();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Nie udało się usunąć celu');
    }
  };

  const handleSavingsAdded = () => {
    setAddSavingsOpen(false);
    onUpdate();
  };

  const handleGoalUpdated = () => {
    setEditGoalOpen(false);
    onUpdate();
  };

  const progressPercentage = Math.min(100, goal.progress_percentage);
  const daysLeft = daysUntilDeadline();
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isNearDeadline = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

  return (
    <>
      <div className={`bg-white rounded-xl border-2 shadow-sm transition-all hover:shadow-md ${
        goal.is_completed 
          ? 'border-green-500' 
          : progressPercentage >= 100 
            ? 'border-violet-500' 
            : 'border-gray-200'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 flex-1">{goal.name}</h3>
            {goal.is_completed && (
              <CheckCircle className="text-green-500 flex-shrink-0 ml-2" size={24} />
            )}
          </div>

          {/* Meta Information */}
          <div className="space-y-2 text-sm text-gray-600">
            {goal.account_member_id && (
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>{getMemberName(goal.account_member_id)}</span>
              </div>
            )}
            {goal.savings_account_id && (
              <div className="flex items-center gap-2">
                <Building2 size={16} />
                <span>{getAccountName(goal.savings_account_id)}</span>
              </div>
            )}
            {goal.deadline && (
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span className={
                  isOverdue 
                    ? 'text-red-600 font-medium' 
                    : isNearDeadline 
                      ? 'text-orange-600 font-medium' 
                      : ''
                }>
                  {formatDate(goal.deadline)}
                  {daysLeft !== null && (
                    <span className="ml-1">
                      ({isOverdue ? `${Math.abs(daysLeft)} dni po terminie` : `${daysLeft} dni pozostało`})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {goal.notes && (
            <p className="mt-3 text-sm text-gray-500 italic">
              {goal.notes}
            </p>
          )}
        </div>

        {/* Progress Section */}
        <div className="p-6">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold text-gray-900">
              {goal.current_amount.toFixed(2)} PLN
            </span>
            <span className="text-sm text-gray-500">
              z {parseFloat(goal.target_amount).toFixed(2)} PLN
            </span>
          </div>

          <div className="relative w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all ${
                goal.is_completed 
                  ? 'bg-green-500' 
                  : progressPercentage >= 100 
                    ? 'bg-violet-600' 
                    : 'bg-violet-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p className="text-sm text-gray-600 text-right">
            {progressPercentage.toFixed(1)}% ukończone
          </p>

          {progressPercentage >= 100 && !goal.is_completed && (
            <div className="mt-4 bg-violet-50 border border-violet-200 rounded-lg p-3">
              <p className="text-sm text-violet-800 font-medium">
                🎉 Gratulacje! Osiągnąłeś swój cel!
              </p>
              <button
                onClick={handleToggleComplete}
                className="mt-2 text-sm text-violet-600 hover:text-violet-700 font-medium underline"
              >
                Oznacz jako ukończony
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2">
          <button
            onClick={() => setAddSavingsOpen(true)}
            disabled={goal.is_completed}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus size={16} />
            <span>Dodaj</span>
          </button>

          <button
            onClick={() => setHistoryOpen(true)}
            className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-700 transition-colors"
            title="Historia transakcji"
          >
            <History size={16} />
          </button>

          <button
            onClick={() => setEditGoalOpen(true)}
            className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-700 transition-colors"
            title="Edytuj cel"
          >
            <Edit2 size={16} />
          </button>

          <button
            onClick={() => setDeleteModalOpen(true)}
            className="px-4 py-2 bg-white hover:bg-red-50 border border-gray-300 hover:border-red-300 rounded-lg text-red-600 transition-colors"
            title="Usuń cel"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Completion Toggle for Completed Goals */}
        {goal.is_completed && (
          <div className="p-4 bg-green-50 border-t border-green-200">
            <button
              onClick={handleToggleComplete}
              className="w-full text-sm text-green-700 hover:text-green-800 font-medium"
            >
              Oznacz jako nieukończony
            </button>
          </div>
        )}
      </div>

      {/* Add Savings Modal */}
      <Modal isOpen={addSavingsOpen} onClose={() => setAddSavingsOpen(false)}>
        <AddSavingsModal
          goal={goal}
          accountMembers={accountMembers}
          onClose={() => setAddSavingsOpen(false)}
          onSubmit={handleSavingsAdded}
        />
      </Modal>

      {/* Edit Goal Modal */}
      <Modal isOpen={editGoalOpen} onClose={() => setEditGoalOpen(false)}>
        <CreateGoalModal
          goal={goal}
          accountMembers={accountMembers}
          savingsAccounts={savingsAccounts}
          onClose={() => setEditGoalOpen(false)}
          onSubmit={handleGoalUpdated}
        />
      </Modal>

      {/* Transaction History Modal */}
      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)}>
        <TransactionHistoryModal
          goal={goal}
          accountMembers={accountMembers}
          currentUser={currentUser}
          onClose={() => setHistoryOpen(false)}
          onUpdate={onUpdate}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        transactionTitle={goal.name}
      />
    </>
  );
}