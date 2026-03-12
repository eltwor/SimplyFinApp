import { AlertTriangle } from "lucide-react";
import Modal from "./UI/Modal";

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, transactionTitle }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Usuń transakcję
        </h3>
        
        <p className="text-gray-600 mb-6">
          Czy na pewno chcesz usunąć transakcję <strong>"{transactionTitle}"</strong>?
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Uwaga:</strong> Ta akcja jest nieodwracalna. Transakcja zostanie usunięta z historii i wszystkich statystyk.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Anuluj
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
          >
            Usuń transakcję
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;