"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPost(
  content: string,
  fileUrl: string,
  firebaseUid: string,
  fileType?: string,
  fileName?: string,
  fileExtension?: string
) {
  try {
    console.log("Server: Creating post for user with Firebase UID:", firebaseUid);

    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      console.error("Server: User not found in database");
      return { success: false, error: "User not found in database. Please try signing out and signing in again." };
    }

    const post = await prisma.post.create({
      data: {
        content,
        fileUrl,
        fileType,
        fileName,
        fileExtension,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
            designation: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Revalidate both home and explore pages
    revalidatePath("/explore");

    return { success: true, post };
  } catch (error) {
    console.error("Failed to create post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

interface GetPostsOptions {
  searchQuery?: string;
  fileType?: 'all' | 'pdf' | 'code' | 'image';
  username?: string;
  sortBy?: 'latest' | 'mostLiked' | 'mostCommented';
}

export async function getPosts(options?: GetPostsOptions) {
  try {
    const {
      searchQuery = '',
      fileType = 'all',
      username = '',
      sortBy = 'latest'
    } = options || {};

    console.log('getPosts called with options:', { searchQuery, fileType, username, sortBy });

    // Build the where clause with AND logic
    const whereClause: any = {
      AND: []
    };

    // Search by content
    if (searchQuery) {
      whereClause.AND.push({
        content: { contains: searchQuery, mode: 'insensitive' }
      });
    }

    // Filter by file type using the fileType field in database
    if (fileType !== 'all') {
      whereClause.AND.push({
        fileType: fileType
      });
    }

    // Filter by username
    if (username) {
      whereClause.AND.push({
        author: {
          username: { contains: username, mode: 'insensitive' }
        }
      });
    }

    // If no filters, remove the AND clause
    if (whereClause.AND.length === 0) {
      delete whereClause.AND;
    }

    console.log('Final whereClause:', JSON.stringify(whereClause, null, 2));

    // Build orderBy clause
    let orderByClause: any = { createdAt: 'desc' }; // Default: latest first

    if (sortBy === 'mostLiked') {
      orderByClause = { likes: { _count: 'desc' } };
    } else if (sortBy === 'mostCommented') {
      orderByClause = { comments: { _count: 'desc' } };
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy: orderByClause,
      select: {
        id: true,
        content: true,
        fileUrl: true,
        fileType: true,
        fileName: true,
        fileExtension: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
            designation: true,
          },
        },
        comments: {
          where: {
            parentId: null, // Only get top-level comments
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                name: true,
                designation: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    image: true,
                    name: true,
                    designation: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    console.log(`Found ${posts.length} posts matching filters`);
    if (posts.length > 0) {
      console.log('Sample post fileTypes:', posts.slice(0, 3).map(p => ({ id: p.id, fileType: p.fileType })));
    }

    return posts;
  } catch (error) {
    console.log("Error in getPosts", error);
    throw new Error("Failed to fetch posts");
  }
}

export async function toggleLike(postId: string, firebaseUid: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const userId = user.id;

    // check if like exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    if (existingLike) {
      // unlike
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } else {
      // like and create notification (only if liking someone else's post)
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            postId,
          },
        }),
        ...(post.authorId !== userId
          ? [
            prisma.notification.create({
              data: {
                type: "LIKE",
                userId: post.authorId, // recipient (post author)
                creatorId: userId, // person who liked
                postId,
              },
            }),
          ]
          : []),
      ]);
    }

    revalidatePath("/explore");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function createComment(
  postId: string,
  content: string,
  firebaseUid: string,
  parentId?: string // Optional parent comment ID for replies
) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const userId = user.id;
    if (!content) throw new Error("Content is required");

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    // If parentId is provided, verify the parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });

      if (!parentComment) {
        return { success: false, error: "Parent comment not found" };
      }
    }

    // Create comment and notification in a transaction
    const [comment] = await prisma.$transaction(async (tx) => {
      // Create comment first
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId: userId,
          postId,
          parentId, // Set parent comment if replying
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              image: true,
              name: true,
              designation: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  image: true,
                  name: true,
                  designation: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      // Create notification if commenting on someone else's post or reply
      const notifyUserId = parentId
        ? (await tx.comment.findUnique({ where: { id: parentId }, select: { authorId: true } }))?.authorId
        : post.authorId;

      if (notifyUserId && notifyUserId !== userId) {
        await tx.notification.create({
          data: {
            type: "COMMENT",
            userId: notifyUserId,
            creatorId: userId,
            postId,
            commentId: newComment.id,
          },
        });
      }

      return [newComment];
    });

    revalidatePath(`/explore`);
    return { success: true, comment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: "Failed to create comment" };
  }
}

export async function deletePost(postId: string, firebaseUid: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const userId = user.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");
    if (post.authorId !== userId) throw new Error("Unauthorized - no delete permission");

    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath("/explore"); // purge the cache
    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}

// Delete comment (only by comment author)
export async function deleteComment(commentId: string, firebaseUid: string) {
  try {
    console.log("Server: Deleting comment with ID:", commentId);

    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      console.error("Server: User not found in database");
      return { success: false, error: "User not found in database. Please try signing out and signing in again." };
    }

    // Check if the comment exists and if the user is the author
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, postId: true }
    });

    if (!comment) {
      return { success: false, error: "Comment not found" };
    }

    if (comment.authorId !== user.id) {
      return { success: false, error: "You can only delete your own comments" };
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    revalidatePath("/explore"); // purge the cache
    return { success: true, postId: comment.postId };
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return { success: false, error: "Failed to delete comment" };
  }
}

export async function rateComment(commentId: string, rating: number, firebaseUid: string) {
  try {
    console.log("Server: Rating comment:", commentId, "with rating:", rating);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUid }
    });

    if (!user) {
      console.error("Server: User not found in database");
      return { success: false, error: "User not found in database" };
    }

    // Find the comment and check if user is the post author
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: {
            authorId: true,
          },
        },
        author: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!comment) {
      return { success: false, error: "Comment not found" };
    }

    // Check if the user is the post author
    if (comment.post.authorId !== user.id) {
      return { success: false, error: "Only the post author can rate comments" };
    }

    // Validate rating is between 1-5
    if (rating < 1 || rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5" };
    }

    // Update the comment with the rating
    await prisma.comment.update({
      where: { id: commentId },
      data: { rating },
    });

    // Update badges for the comment author (after Prisma is regenerated)
    try {
      // Import dynamically to avoid build issues before migration
      const { updateUserBadges } = await import("@/actions/badge.action");
      await updateUserBadges(comment.author.id);
    } catch (error) {
      console.log("Badge update will be available after migration:", error);
    }

    revalidatePath("/explore"); // purge the cache
    return { success: true };
  } catch (error) {
    console.error("Failed to rate comment:", error);
    return { success: false, error: "Failed to rate comment" };
  }
}
