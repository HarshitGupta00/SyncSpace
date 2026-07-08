import { useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import useUIStore from "../../store/useUIStore";
import toast from "react-hot-toast";

const CreateProjectModal = ({ isOpen }) => {
  const { closeModal } = useUIStore();
  const [name, setName] = useState("");
  return (
    <Modal isOpen={isOpen} onClose={() => closeModal("createProject")} title="Create Project">
      <div className="flex flex-col gap-4 mt-2">
        <Input label="Project name" placeholder="e.g. Marketing Campaign" value={name} onChange={e => setName(e.target.value)} />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={() => closeModal("createProject")}>Cancel</Button>
          <Button className="flex-1" onClick={() => { toast.success("Project created!"); closeModal("createProject"); setName(""); }}>Create</Button>
        </div>
      </div>
    </Modal>
  );
};
export default CreateProjectModal;
