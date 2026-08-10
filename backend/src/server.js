import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import { validateEnv } from "./config/env.js";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5000;

// ─── Create HTTP server & Socket.io ──────────────────────────────────────────
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ─── Socket.io Event Handlers ─────────────────────────────────────────────────
io.on("connection", (socket) => {
  // Join a specific chat thread room
  socket.on("join_thread", (threadId) => {
    if (threadId) {
      socket.join(String(threadId));
    }
  });

  // Leave a thread room (e.g., when switching conversations)
  socket.on("leave_thread", (threadId) => {
    if (threadId) {
      socket.leave(String(threadId));
    }
  });

  // Send a message — save to DB and broadcast to room
  socket.on("send_message", async ({ threadId, message, senderType, senderId }) => {
    if (!threadId || !message) return;

    try {
      const VendorChatMessage = mongoose.model("VendorChatMessage");
      const VendorChatThread = mongoose.model("VendorChatThread");

      // Save message to database (matches VendorChatMessage schema)
      const savedMessage = await VendorChatMessage.create({
        threadId: String(threadId),
        message: String(message).trim(),
        senderType: senderType || "user",
        senderId: senderId || "",
      });

      // Update thread's last message and timestamp
      const isVendorSender = senderType === "vendor";
      const threadUpdate = {
        $set: { lastMessage: String(message).trim(), lastActivity: new Date() },
      };
      // Increment unread count for the OTHER party
      if (isVendorSender) {
        threadUpdate.$inc = { customerUnreadCount: 1 };
      } else {
        threadUpdate.$inc = { unreadCount: 1 };
      }
      await VendorChatThread.findByIdAndUpdate(threadId, threadUpdate, { new: true });

      // Broadcast new message to everyone in the thread room
      io.to(String(threadId)).emit("new_message", {
        _id: savedMessage._id,
        threadId: String(threadId),
        message: savedMessage.message,
        senderType: savedMessage.senderType,
        senderId: savedMessage.senderId,
        createdAt: savedMessage.createdAt,
      });
    } catch (err) {
      socket.emit("message_error", { threadId, error: "Failed to save message." });
    }
  });

  // Typing indicator — broadcast to others in the room
  socket.on("typing", ({ threadId, role }) => {
    if (threadId) {
      socket.to(String(threadId)).emit("user_typing", { role: role || "user" });
    }
  });

  // Stop typing indicator
  socket.on("stop_typing", ({ threadId }) => {
    if (threadId) {
      socket.to(String(threadId)).emit("user_stop_typing");
    }
  });

  // Mark messages as read (by the party viewing — vendor or user)
  socket.on("mark_read", async ({ threadId, readerType }) => {
    if (!threadId) return;
    try {
      const VendorChatThread = mongoose.model("VendorChatThread");
      const resetField = readerType === "vendor" ? { unreadCount: 0 } : { customerUnreadCount: 0 };
      await VendorChatThread.findByIdAndUpdate(threadId, { $set: resetField });
      // Notify others in the room that messages were read
      socket.to(String(threadId)).emit("messages_read", { threadId, readerType });
    } catch {
      // silent — non-critical
    }
  });

  socket.on("disconnect", () => {
    // cleanup handled automatically by socket.io
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    validateEnv();
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`🚀 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔌 Socket.io ready`);
    });
  } catch (error) {
    console.error("📦 Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();

