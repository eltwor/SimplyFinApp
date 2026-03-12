import React, { useEffect, useRef } from "react";

const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const clickHandler = (e) => {
      if (!modalRef.current || !isOpen) return;
      if (!modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", clickHandler);
    }

    return () => document.removeEventListener("mousedown", clickHandler);
  }, [isOpen, onClose]);

  // Close on ESC key
  useEffect(() => {
    const keyHandler = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", keyHandler);
    }

    return () => document.removeEventListener("keydown", keyHandler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        ref={modalRef}
        className="w-full max-w-[570px] rounded-2xl bg-white px-8 py-12 text-center dark:bg-dark-2 md:px-[70px] md:py-[60px]"
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;