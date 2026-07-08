// components/ui/Modal.jsx
// Base modal wrapper — all 14 modals use this as their container.
// Handles: backdrop, enter/exit animations, close on overlay click, close on Escape

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { modalVariants, overlayVariants } from "../../styles/animations";

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",       // sm | md | lg | xl
  hideHeader = false,
  closeOnOverlay = true,
}) => {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeOnOverlay ? onClose : undefined}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
          />

          {/* Modal panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className={`
                w-full ${sizes[size]} bg-surface rounded-2xl shadow-modal
                border border-border flex flex-col max-h-[90vh]
              `}
            >
              {/* Header */}
              {!hideHeader && (
                <div className="flex items-start justify-between p-6 pb-4 flex-shrink-0">
                  <div>
                    {title && (
                      <h2 className="text-lg font-semibold text-primary">{title}</h2>
                    )}
                    {description && (
                      <p className="text-sm text-secondary mt-0.5">{description}</p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-tertiary hover:text-primary hover:bg-app transition-colors ml-4 flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Content — scrollable */}
              <div className="overflow-y-auto flex-1 px-6 pb-6">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
