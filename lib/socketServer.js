const { Server } = require('socket.io');

// Store active users and their socket connections
const activeUsers = new Map(); // Map<userId, socketId>
const userSockets = new Map(); // Map<userId, Set<socketId>> for multiple connections
const userChatRooms = new Map(); // Map<userId, Set<chatId>> to track which chats users are viewing
const userLastSeen = new Map(); // Map<userId, Date> to track last seen timestamps

// Global Socket.IO instance
let io = null;

function initializeSocketIO(httpServer) {
	if (io) {
		console.log('Socket.IO already initialized');
		return io;
	}

	io = new Server(httpServer, {
		cors: {
			origin: process.env.NODE_ENV === 'production'
				? process.env.NEXT_PUBLIC_APP_URL || false
				: ['http://localhost:3000'],
			methods: ['GET', 'POST']
		},
		path: '/socket.io',
		addTrailingSlash: false,
	});

	io.on('connection', (socket) => {
		console.log('✅ Socket.IO: User connected:', socket.id);

		// Handle user joining
		socket.on('join', (userId) => {
			console.log(`✅ Socket.IO: User ${userId} joined with socket ${socket.id}`);
			activeUsers.set(userId, socket.id);
			socket.userId = userId;

			// Track multiple connections per user
			if (!userSockets.has(userId)) {
				userSockets.set(userId, new Set());
			}
			userSockets.get(userId).add(socket.id);

			// Join user to their personal room
			socket.join(`user_${userId}`);
			console.log(`📌 User ${userId} joined personal room: user_${userId}`);

			// Clear last seen when user comes online
			userLastSeen.delete(userId);

			// Broadcast user is online to all connected clients
			console.log(`📡 Broadcasting: User ${userId} is now ONLINE`);
			io.emit('user_status_changed', { userId, isOnline: true, lastSeen: null });
		});

		// Handle joining chat rooms
		socket.on('join_chat', (data) => {
			const { chatId, userId } = data;
			console.log(`Socket ${socket.id} (user: ${userId}) joined chat ${chatId}`);
			socket.join(`chat_${chatId}`);
			socket.currentChatId = chatId;

			// Track which chat this user is viewing
			if (socket.userId) {
				if (!userChatRooms.has(socket.userId)) {
					userChatRooms.set(socket.userId, new Set());
				}
				userChatRooms.get(socket.userId).add(chatId);
			}
		});

		// Handle leaving chat rooms
		socket.on('leave_chat', (chatId) => {
			console.log(`Socket ${socket.id} left chat ${chatId}`);
			socket.leave(`chat_${chatId}`);
			socket.currentChatId = null;

			// Remove from tracking
			if (socket.userId && userChatRooms.has(socket.userId)) {
				userChatRooms.get(socket.userId).delete(chatId);
			}
		});

		// Handle new messages
		socket.on('new_message', (data) => {
			console.log('Broadcasting new message to chat:', data.chatId, 'recipientId:', data.recipientId);
			// Broadcast to all users in the chat room except sender
			socket.to(`chat_${data.chatId}`).emit('message_received', data.message);

			// Also notify the recipient user's personal room for sidebar updates
			// The recipient's userId should be included in the data
			if (data.recipientId) {
				console.log(`📬 Notifying user_${data.recipientId} about new message`);
				io.to(`user_${data.recipientId}`).emit('message_received', data.message);
				io.to(`user_${data.recipientId}`).emit('unread_count_updated', {
					chatId: data.chatId
				});
			}
		});

		// Handle message deletions
		socket.on('delete_message', (data) => {
			console.log('Broadcasting message deletion to chat:', data.chatId);
			// Broadcast to all users in the chat room except sender
			socket.to(`chat_${data.chatId}`).emit('message_deleted', {
				messageId: data.messageId,
				deleteForEveryone: data.deleteForEveryone
			});
		});

		// Handle typing indicators
		socket.on('typing_start', (data) => {
			socket.to(`chat_${data.chatId}`).emit('user_typing', {
				userId: data.userId,
				username: data.username
			});
		});

		socket.on('typing_stop', (data) => {
			socket.to(`chat_${data.chatId}`).emit('user_stopped_typing', {
				userId: data.userId,
				username: data.username
			});
		});

		// Handle message read receipts
		socket.on('messages_read', (data) => {
			console.log('Broadcasting messages read:', data);
			// Broadcast to all users in the chat room
			socket.to(`chat_${data.chatId}`).emit('messages_marked_read', {
				chatId: data.chatId,
				userId: data.userId,
				messageIds: data.messageIds
			});

			// Broadcast unread count update to the user's personal room
			io.to(`user_${data.userId}`).emit('unread_count_updated', {
				chatId: data.chatId
			});
		});

		// Handle emoji reactions
		socket.on('add_reaction', (data) => {
			console.log('Broadcasting reaction:', data);
			socket.to(`chat_${data.chatId}`).emit('reaction_added', {
				messageId: data.messageId,
				reaction: data.reaction
			});
		});

		socket.on('remove_reaction', (data) => {
			console.log('Broadcasting reaction removal:', data);
			socket.to(`chat_${data.chatId}`).emit('reaction_removed', {
				messageId: data.messageId,
				reactionId: data.reactionId,
				userId: data.userId
			});
		});

		// Handle user status requests
		socket.on('request_user_status', (data) => {
			const { userIds } = data;
			console.log(`🔍 Status request for users:`, userIds);
			const statuses = {};
			userIds.forEach((userId) => {
				const isOnline = userSockets.has(userId) && userSockets.get(userId).size > 0;
				statuses[userId] = {
					isOnline,
					lastSeen: isOnline ? null : userLastSeen.get(userId) || null,
					userId
				};
				console.log(`  - User ${userId}: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
			});
			socket.emit('user_statuses', statuses);
		});

		// Handle disconnection
		socket.on('disconnect', () => {
			console.log('User disconnected:', socket.id);
			if (socket.userId) {
				// Remove this socket from user's connections
				if (userSockets.has(socket.userId)) {
					userSockets.get(socket.userId).delete(socket.id);

					// If user has no more connections, mark as offline
					if (userSockets.get(socket.userId).size === 0) {
						userSockets.delete(socket.userId);
						activeUsers.delete(socket.userId);

						const lastSeen = new Date();
						userLastSeen.set(socket.userId, lastSeen);

						// Broadcast user is offline to all connected clients
						console.log(`📡 Broadcasting: User ${socket.userId} is now OFFLINE`);
						io.emit('user_status_changed', {
							userId: socket.userId,
							isOnline: false,
							lastSeen
						});
					}
				}

				// Clean up chat room tracking
				if (userChatRooms.has(socket.userId)) {
					userChatRooms.delete(socket.userId);
				}
			}
		});
	});

	console.log('✅ Socket.IO server initialized');
	return io;
}

function getIO() {
	if (!io) {
		throw new Error('Socket.IO not initialized');
	}
	return io;
}

module.exports = { initializeSocketIO, getIO };
