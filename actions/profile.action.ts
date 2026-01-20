"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action";

// Get profile by username
export async function getProfileByUsername(username: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        firebaseId: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        location: true,
        website: true,
        designation: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });
    return user;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw new Error("Failed to fetch profile");
  }
}

// Get current user's profile by Firebase ID
// Get current user's profile by Firebase ID
export async function getCurrentUserProfile(firebaseId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId },
      select: {
        id: true,
        firebaseId: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        location: true,
        website: true,
        designation: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });
    return user;
  } catch (error) {
    console.error("Error fetching current user profile:", error);
    throw new Error("Failed to fetch current user profile");
  }
}

// Get posts by user
export async function getUserPosts(userId: string) {
  try {
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
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
            username: true,
            image: true,
            designation: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                designation: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                    designation: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        likes: { select: { userId: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return posts;
  } catch (error) {
    console.error("Error fetching user posts:", error);
    throw new Error("Failed to fetch user posts");
  }
}

// Get posts liked by user
export async function getUserLikedPosts(userId: string) {
  try {
    const likedPosts = await prisma.post.findMany({
      where: {
        likes: { some: { userId } },
      },
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
            username: true,
            image: true,
            designation: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                designation: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                    designation: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        likes: { select: { userId: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return likedPosts;
  } catch (error) {
    console.error("Error fetching liked posts:", error);
    throw new Error("Failed to fetch liked posts");
  }
}

// Update profile (expects firebaseUid and formData)
export async function updateProfile(firebaseUid: string, formData: FormData) {
  try {
    const userId = await getDbUserId(firebaseUid);
    if (!userId) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    const website = formData.get("website") as string;
    const designation = formData.get("designation") as string;
    const image = formData.get("image") as string;

    // Build update data object
    const updateData: any = { name, bio, location, website };

    // Only include image if it's provided
    if (image !== null && image !== undefined) {
      updateData.image = image;
    }

    // Only include designation if it's provided and valid
    if (designation && ["STUDENT", "TEACHER", "WORKING_PROFESSIONAL"].includes(designation)) {
      updateData.designation = designation;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/profile");
    return { success: true, user };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

// Check if current user is following another user
export async function isFollowing(targetUserId: string, firebaseUid: string) {
  try {
    const currentUserId = await getDbUserId(firebaseUid);
    if (!currentUserId) return false;

    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    return !!follow;
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}

// Get user profile with follow status
export async function getUserProfile(username: string, currentUserId?: string | null) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        designation: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    if (!user) return null;

    let isFollowing = false;
    if (currentUserId) {
      const follow = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return {
      ...user,
      isFollowing,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new Error("Failed to fetch user profile");
  }
}

// Toggle follow/unfollow
export async function toggleFollow(targetUserId: string, currentUserId: string) {
  try {
    if (targetUserId === currentUserId) {
      return { success: false, error: "Cannot follow yourself" };
    }

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });

      revalidatePath("/explore");
      revalidatePath("/profile");
      return { success: true, action: "unfollowed" };
    } else {
      // Follow
      await prisma.follows.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          creatorId: currentUserId,
          type: "FOLLOW",
        },
      });

      revalidatePath("/explore");
      revalidatePath("/profile");
      return { success: true, action: "followed" };
    }
  } catch (error) {
    console.error("Error toggling follow:", error);
    return { success: false, error: "Failed to update follow status" };
  }
}