// sockets/notificationHandler.js
// Handles real-time notification delivery to online users.
//
// HOW IT WORKS:
// When a notification is created (e.g. user is @mentioned), the API controller
// saves it to the Notification collection, then emits a socket event to deliver
// it in real time IF the recipient is currently online.
//
// WHY a user-specific room (not just socket.id):
// A user might be logged in from multiple tabs/devices — each has a different
// socket.id. By joining a room named after the user's _id, any notification
// for that user reaches ALL their active sessions simultaneously.
// This is the standard pattern for "notify a specific user" via Socket.io.

const notificationHandler = (io, socket) => {

  // Client emits this immediately after connecting + authenticating
  // (frontend will send userId from their JWT/auth state)
  socket.on("notifications:subscribe", ({ userId }) => {
    // Each user joins a personal room named by their userId
    socket.join(`user:${userId}`);
    socket.data.userId = userId; // store on socket for disconnect cleanup
  });

  socket.on("disconnect", () => {
    // Socket.io auto-removes from rooms on disconnect —
    // no manual cleanup needed here, but we log for debugging
    if (socket.data.userId) {
      // socket has already left user:${userId} room automatically
    }
  });

};

// Utility exported so API controllers can emit notifications to online users
// Usage: emitNotification(io, recipientUserId, notificationObject)
const emitNotification = (io, userId, notification) => {
  io.to(`user:${userId}`).emit("notification:new", notification);
  // If the user is offline (nobody in this room), the emit just silently
  // does nothing — that's fine, they'll see it from the DB on next login.
};

module.exports = notificationHandler;
module.exports.emitNotification = emitNotification;
