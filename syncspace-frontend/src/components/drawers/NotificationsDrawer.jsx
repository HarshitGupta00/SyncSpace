// components/drawers/NotificationsDrawer.jsx
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell } from "lucide-react";
import { drawerVariants, overlayVariants } from "../../styles/animations";
import useUIStore from "../../store/useUIStore";

const NotificationsDrawer = ({ isOpen }) => {
  const { closeDrawer } = useUIStore();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div variants={overlayVariants} initial="hidden" animate="visible" exit="exit"
            onClick={() => closeDrawer("notifications")}
            className="fixed inset-0 bg-black/20 z-40" />
          <motion.div variants={drawerVariants} initial="hidden" animate="visible" exit="exit"
            className="fixed top-0 right-0 h-screen w-96 bg-surface border-l border-border z-50 flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-primary flex items-center gap-2"><Bell size={16}/>Notifications</h2>
              <button onClick={() => closeDrawer("notifications")} className="p-1.5 rounded-lg hover:bg-app text-tertiary hover:text-primary transition-colors"><X size={16}/></button>
            </div>
            <div className="flex-1 flex items-center justify-center text-secondary text-sm">No notifications yet</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
export default NotificationsDrawer;
