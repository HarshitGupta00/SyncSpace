// hooks/usePresence.js
// Manages presence (who's online) for a specific document/whiteboard room.
// Used in both DocumentEditorPage and WhiteboardEditorPage.

import { useEffect, useState, useRef } from "react";
import socket from "../lib/socket";
import useAuthStore from "../store/useAuthStore";
import { getCursorColor } from "../utils";

const usePresence = (roomId) => {
  const { user } = useAuthStore();
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!roomId || !user) return;

    const userPayload = {
      _id:    user._id,
      name:   user.name,
      avatar: user.avatar,
      color:  getCursorColor(user._id),
    };

    // Join the room
    socket.emit("presence:join", { roomId, user: userPayload });

    // Listen for presence updates from server
    socket.on("presence:update", (users) => {
      // Exclude ourselves from the visible list
      setOnlineUsers(users.filter(u => u._id !== user._id));
    });

    return () => {
      socket.emit("presence:leave", { roomId });
      socket.off("presence:update");
    };
  }, [roomId, user]);

  return { onlineUsers };
};

export default usePresence;
