// components/modals/CreateTeamModal.jsx
import { useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import useUIStore from "../../store/useUIStore";
import { teamService } from "../../services";
import toast from "react-hot-toast";

const CreateTeamModal = ({ isOpen }) => {
  const { closeModal } = useUIStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await teamService.createTeam({ name, description });
      toast.success("Team created!");
      closeModal("createTeam");
      setName(""); setDescription("");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create team");
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => closeModal("createTeam")} title="Create Team" description="Start a new workspace for your team">
      <div className="flex flex-col gap-4 mt-2">
        <Input label="Team name" placeholder="e.g. Product Team" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Description (optional)" placeholder="What does this team work on?" value={description} onChange={e => setDescription(e.target.value)} />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={() => closeModal("createTeam")}>Cancel</Button>
          <Button className="flex-1" loading={loading} onClick={handleSubmit}>Create Team</Button>
        </div>
      </div>
    </Modal>
  );
};
export default CreateTeamModal;
