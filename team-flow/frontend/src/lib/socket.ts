import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let taskSocket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: { token: token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '') },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const getTaskSocket = (token?: string): Socket => {
  if (!taskSocket) {
    taskSocket = io(`${process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'}/tasks`, {
      auth: { token: token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '') },
      transports: ['websocket', 'polling'],
    });
  }
  return taskSocket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  if (taskSocket) {
    taskSocket.disconnect();
    taskSocket = null;
  }
};
