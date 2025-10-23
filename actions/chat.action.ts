"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createOrGetChat(user1Id: string, user2Id: string) {
  try {
    // Check if chat already exists between these two users
    let chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    // If chat doesn't exist, create it
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          user1Id,
          user2Id
        },
        include: {
          user1: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true
            }
          },
          user2: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true
            }
          },
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true
                }
              }
            },
            orderBy: {
              createdAt: "asc"
            }
          }
        }
      });
    }

    return { success: true, chat };
  } catch (error) {
    console.error("Failed to create or get chat:", error);
    return { success: false, error: "Failed to create or get chat" };
  }
}

export async function getChatsForUser(firebaseUid: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ]
      },
      select: {
        id: true,
        user1Id: true,
        user2Id: true,
        user1UnreadCount: true,
        user2UnreadCount: true,
        createdAt: true,
        updatedAt: true,
        user1: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        messages: {
          where: {
            AND: [
              { isDeleted: { not: true } },
              {
                NOT: {
                  deletedForUsers: {
                    has: user.id
                  }
                }
              }
            ]
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return { success: true, chats };
  } catch (error) {
    console.error("Failed to get chats:", error);
    return { success: false, error: "Failed to get chats" };
  }
}

export async function getChatById(chatId: string, firebaseUid: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        messages: {
          where: {
            AND: [
              { isDeleted: { not: true } },
              {
                NOT: {
                  deletedForUsers: {
                    has: user.id
                  }
                }
              }
            ]
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true
              }
            },
            replyTo: {
              select: {
                id: true,
                content: true,
                sender: {
                  select: {
                    id: true,
                    name: true,
                    username: true
                  }
                }
              }
            },
            ...(({
              reactions: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                      image: true
                    }
                  }
                }
              }
            } as any))
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    if (!chat) {
      return { success: false, error: "Chat not found" };
    }

    return { success: true, chat };
  } catch (error) {
    console.error("Failed to get chat:", error);
    return { success: false, error: "Failed to get chat" };
  }
}

export async function sendMessage(chatId: string, content: string, firebaseUid: string, replyToId?: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify user is part of this chat
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ]
      }
    });

    if (!chat) {
      return { success: false, error: "Chat not found or unauthorized" };
    }

    // If replyToId is provided, verify the message exists and is in this chat
    if (replyToId) {
      const replyToMessage = await prisma.message.findFirst({
        where: {
          id: replyToId,
          chatId: chatId
        }
      });

      if (!replyToMessage) {
        return { success: false, error: "Reply message not found" };
      }
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: user.id,
        content,
        replyToId: replyToId || null,
        status: "SENT"
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        }
      }
    });

    // Determine which user is receiving the message
    const receiverId = chat.user1Id === user.id ? chat.user2Id : chat.user1Id;
    const isUser1Receiver = receiverId === chat.user1Id;

    // Update chat's updatedAt timestamp and increment unread count for receiver
    await prisma.chat.update({
      where: { id: chatId },
      data: { 
        updatedAt: new Date(),
        ...(isUser1Receiver ? { user1UnreadCount: { increment: 1 } } : { user2UnreadCount: { increment: 1 } })
      }
    });

    // Mark message as delivered immediately (since it's successfully saved)
    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date()
      }
    });

    revalidatePath("/conversations");
    return { success: true, message: { ...message, status: "DELIVERED", deliveredAt: new Date() } };
  } catch (error) {
    console.error("Failed to send message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

export async function getChatByUserIds(user1Id: string, user2Id: string) {
  try {
    const chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    return { success: true, chat };
  } catch (error) {
    console.error("Failed to get chat by user IDs:", error);
    return { success: false, error: "Failed to get chat" };
  }
}

export async function deleteMessage(messageId: string, firebaseUid: string, deleteForEveryone: boolean = false) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Get the message to verify ownership and chat membership
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        chat: {
          OR: [
            { user1Id: user.id },
            { user2Id: user.id }
          ]
        }
      },
      include: {
        chat: true
      }
    });

    if (!message) {
      return { success: false, error: "Message not found or unauthorized" };
    }

    if (deleteForEveryone) {
      // Only message sender can delete for everyone
      if (message.senderId !== user.id) {
        return { success: false, error: "You can only delete your own messages for everyone" };
      }

      // Check if message is within 1 hour (optional time limit)
      const messageAge = Date.now() - new Date(message.createdAt).getTime();
      if (messageAge > 60 * 60 * 1000) { // 1 hour
        return { success: false, error: "You can only delete messages for everyone within 1 hour" };
      }

      // Completely remove the message from database
      await prisma.message.delete({
        where: { id: messageId }
      });
    } else {
      // Delete for current user only
      const currentDeletedForUsers = message.deletedForUsers || [];
      if (!currentDeletedForUsers.includes(user.id)) {
        await prisma.message.update({
          where: { id: messageId },
          data: {
            deletedForUsers: {
              push: user.id
            }
          }
        });
      }
    }

    revalidatePath(`/conversations/${message.chatId}`);
    return { success: true, messageId, deleteForEveryone };
  } catch (error) {
    console.error("Failed to delete message:", error);
    return { success: false, error: "Failed to delete message" };
  }
}

export async function markMessagesAsRead(chatId: string, firebaseUid: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify user is part of this chat
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ]
      }
    });

    if (!chat) {
      return { success: false, error: "Chat not found or unauthorized" };
    }

    // Mark all unread messages from other users as read
    await prisma.message.updateMany({
      where: {
        chatId: chatId,
        senderId: { not: user.id },
        status: { in: ["SENT", "DELIVERED"] }
      },
      data: {
        status: "READ",
        readAt: new Date()
      }
    });

    // Reset unread count for this user
    const isUser1 = chat.user1Id === user.id;
    await prisma.chat.update({
      where: { id: chatId },
      data: isUser1 ? { user1UnreadCount: 0 } : { user2UnreadCount: 0 }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to mark messages as read:", error);
    return { success: false, error: "Failed to mark messages as read" };
  }
}

export async function deleteChat(chatId: string, firebaseUid: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify user is part of this chat
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ]
      }
    });

    if (!chat) {
      return { success: false, error: "Chat not found or unauthorized" };
    }

    // Delete the chat (messages will be cascade deleted)
    await prisma.chat.delete({
      where: { id: chatId }
    });

    revalidatePath("/conversations");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete chat:", error);
    return { success: false, error: "Failed to delete chat" };
  }
}

export async function addReaction(messageId: string, emoji: string, firebaseUid: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if reaction already exists
    const existingReaction = await (prisma as any).reaction.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId: user.id
        }
      }
    });

    if (existingReaction) {
      // If user is trying to add the same emoji, remove it instead (toggle behavior)
      if (existingReaction.emoji === emoji) {
        await (prisma as any).reaction.delete({
          where: { id: existingReaction.id }
        });
        return { success: true, removed: true, reactionId: existingReaction.id };
      }
      
      // Update existing reaction with new emoji
      const reaction = await (prisma as any).reaction.update({
        where: { id: existingReaction.id },
        data: { emoji },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true
            }
          }
        }
      });
      return { success: true, reaction };
    } else {
      // Create new reaction
      const reaction = await (prisma as any).reaction.create({
        data: {
          messageId,
          userId: user.id,
          emoji
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true
            }
          }
        }
      });
      return { success: true, reaction };
    }
  } catch (error) {
    console.error("Failed to add reaction:", error);
    return { success: false, error: "Failed to add reaction" };
  }
}

export async function removeReaction(reactionId: string, firebaseUid: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify user owns this reaction
    const reaction = await (prisma as any).reaction.findFirst({
      where: {
        id: reactionId,
        userId: user.id
      }
    });

    if (!reaction) {
      return { success: false, error: "Reaction not found or unauthorized" };
    }

    await (prisma as any).reaction.delete({
      where: { id: reactionId }
    });

    return { success: true, reactionId };
  } catch (error) {
    console.error("Failed to remove reaction:", error);
    return { success: false, error: "Failed to remove reaction" };
  }
}

export async function updateUserStatus(firebaseUid: string, isOnline: boolean) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await (prisma as any).user.update({
      where: { id: user.id },
      data: {
        isOnline,
        lastSeen: isOnline ? null : new Date()
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update user status:", error);
    return { success: false, error: "Failed to update user status" };
  }
}

export async function getUserStatus(firebaseUid: string) {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { firebaseId: firebaseUid },
      select: {
        id: true,
        isOnline: true,
        lastSeen: true
      }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, status: user };
  } catch (error) {
    console.error("Failed to get user status:", error);
    return { success: false, error: "Failed to get user status" };
  }
}
