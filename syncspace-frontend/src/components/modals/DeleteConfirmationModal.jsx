import Modal from "../ui/Modal";
import Button from "../ui/Button";
import useUIStore from "../../store/useUIStore";

const DeleteConfirmationModal = ({ isOpen }) => {
  const { closeModal, modalContext } = useUIStore();
  return (
    <Modal isOpen={isOpen} onClose={() => closeModal("deleteConfirm")} title="Confirm Delete" size="sm">
      <div className="flex flex-col gap-4 mt-2">
        <p className="text-sm text-secondary">{modalContext?.message || "Are you sure? This action cannot be undone."}</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => closeModal("deleteConfirm")}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => { modalContext?.onConfirm?.(); closeModal("deleteConfirm"); }}>Delete</Button>
        </div>
      </div>
    </Modal>
  );
};
export default DeleteConfirmationModal;
