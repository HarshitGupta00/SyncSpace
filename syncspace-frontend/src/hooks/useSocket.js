// hooks/useSocket.js
// Manages the Socket.io connection lifecycle tied to auth state.
// Connects on login, disconnects on logout.
//
// NOTE: Yjs real-time sync is handled separately via y-websocket in the
// editor pages — this hook only manages the Socket.io connection for
// presence, notifications, and lightweight events.

import { useEffect } from "react";
import socket from "../lib/socket";
import useAuthStore from "../store/useAuthStore";

const useSocket = () => {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      socket.connect();
      // Subscribe to personal notification room (user-specific socket room)
      socket.emit("notifications:subscribe", { userId: user._id });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  return socket;
};

export default useSocket;
