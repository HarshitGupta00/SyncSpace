// components/modals/ExportDocumentModal.jsx
import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import useUIStore from "../../store/useUIStore";
import { FileText, File, Code, Download } from "lucide-react";
import toast from "react-hot-toast";

const FORMATS = [
  { id: "pdf",      icon: FileText, label: "PDF",      desc: "Best for sharing and printing"        },
  { id: "docx",     icon: File,     label: "Word (.docx)", desc: "Editable in Microsoft Word"       },
  { id: "markdown", icon: Code,     label: "Markdown",  desc: "Plain text with formatting"          },
];

const ExportDocumentModal = ({ isOpen }) => {
  const { closeModal } = useUIStore();
  const [selected, setSelected] = useState("pdf");
  const [loading, setLoading]   = useState(false);

  const handleExport = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    toast.success(`Exported as ${selected.toUpperCase()}!`);
    closeModal("exportDocument");
  };

  return (
    <Modal isOpen={isOpen} onClose={() => closeModal("exportDocument")}
      title="Export document" description="Download this document in your preferred format" size="sm">
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col gap-2">
          {FORMATS.map(({ id, icon: Icon, label, desc }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                selected === id
                  ? "border-primary bg-app ring-2 ring-primary/10"
                  : "border-border hover:bg-app"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                selected === id ? "bg-primary" : "bg-app border border-border"
              }`}>
                <Icon size={16} className={selected === id ? "text-white" : "text-secondary"} />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">{label}</p>
                <p className="text-xs text-tertiary">{desc}</p>
              </div>
              {selected === id && (
                <div className="ml-auto w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={() => closeModal("exportDocument")}>Cancel</Button>
          <Button className="flex-1" loading={loading} onClick={handleExport} icon={Download}>
            Export
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportDocumentModal;
