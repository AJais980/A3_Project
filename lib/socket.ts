"use client";

import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

let socket: typeof Socket | null = null;

export const getSocket = (): typeof Socket => {
	if (!socket) {
		// Determine the socket URL based on environment
		const socketUrl = process.env.NODE_ENV === 'production'
			? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
			: 'http://localhost:3000';

		socket = io(socketUrl, {
			path: '/socket.io',
			autoConnect: false,
			transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 5,
		});
	}
	return socket;
};

export const connectSocket = (userId: string) => {
	const socketInstance = getSocket();
	if (!socketInstance.connected) {
		socketInstance.connect();
		socketInstance.emit('join', userId);
	}
	return socketInstance;
};

export const disconnectSocket = () => {
	if (socket && socket.connected) {
		socket.disconnect();
	}
};
