import { io } from 'socket.io-client';
import { API_BASE_URL } from './constants';

// Derive socket server URL: strip /api suffix if present, fallback to localhost in dev
const rawBase = API_BASE_URL || 'http://localhost:5000';
const SOCKET_URL = rawBase.replace(/\/api\/?$/, '') || 'http://localhost:5000';

/**
 * Singleton Socket.io client.
 * Usage:
 *   import socket from '@/shared/utils/socket';
 *   socket.connect();
 *   socket.emit('join_thread', threadId);
 *   socket.on('new_message', handler);
 *   socket.disconnect();  // on component unmount
 */
const socket = io(SOCKET_URL, {
  autoConnect: false,        // We connect manually when a chat page mounts
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

export default socket;
