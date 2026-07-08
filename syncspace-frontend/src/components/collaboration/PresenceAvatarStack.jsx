// components/collaboration/PresenceAvatarStack.jsx
// Shows avatars of users currently online in a document/whiteboard.
// Used in editor top bars.

import { motion, AnimatePresence } from "framer-motion";
import Avatar from "../ui/Avatar";
import { getCursorColor } from "../../utils";

const PresenceAvatarStack = ({ users = [], max = 5 }) => {
  const visible  = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center" title={`${users.length} collaborator(s) online`}>
      <AnimatePresence>
        {visible.map((user, i) => (
          <motion.div
            key={user._id || user.name || i}
            initial={{ opacity: 0, scale: 0.5, x: 10 }}
            animate={{ opacity: 1, scale: 1,   x: 0  }}
            exit={{    opacity: 0, scale: 0.5, x: 10  }}
            transition={{ duration: 0.2 }}
            className="-ml-2 first:ml-0"
            style={{ zIndex: visible.length - i }}
          >
            <div
              className="w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-2xs font-bold text-white flex-shrink-0"
              style={{ background: user.color || getCursorColor(user._id || user.name || "") }}
              title={user.name}
            >
              {user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                : (user.name || "?")[0].toUpperCase()
              }
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {overflow > 0 && (
        <div className="-ml-2 w-7 h-7 rounded-full border-2 border-surface bg-app flex items-center justify-center text-2xs font-semibold text-secondary">
          +{overflow}
        </div>
      )}

      {users.length > 0 && (
        <span className="ml-2 text-xs text-tertiary hidden sm:block">
          {users.length} online
        </span>
      )}
    </div>
  );
};

export default PresenceAvatarStack;
