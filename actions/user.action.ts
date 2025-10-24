"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function syncUser(
  firebaseId: string,
  email: string,
  displayName: string | null,
  photoURL: string | null
) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        firebaseId,
      },
    });

    if (existingUser) return existingUser;

    const dbUser = await prisma.user.create({
      data: {
        firebaseId,
        name: displayName || "",
        username: email?.split("@")[0] || `user_${firebaseId}`,
        email: email || "",
        image: photoURL,
      },
    });

    return dbUser;
  } catch (error) {
    console.error("Error in syncUser", error);
  }
}

export async function getUserByFirebaseId(firebaseId: string) {
  return prisma.user.findUnique({
    where: {
      firebaseId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
}

export async function getDbUserId(firebaseUid: string) {
  try {
    if (!firebaseUid) return null;

    const user = await getUserByFirebaseId(firebaseUid);
    if (!user) return null;

    return user.id;
  } catch (error) {
    console.error("Error in getDbUserId:", error);
    return null;
  }
}

export async function getRandomUsers(firebaseUid: string) {
  try {
    const userId = await getDbUserId(firebaseUid);

    if (!userId) return [];

    // get 3 random users exclude ourselves & users that we already follow
    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: 3,
    });

    return randomUsers;
  } catch (error) {
    console.error("Error fetching random users", error);
    return [];
  }
}

export async function toggleFollow(targetUserId: string, firebaseUid: string) {
  try {
    const userId = await getDbUserId(firebaseUid);

    if (!userId) return { success: false, error: "User not found" };

    if (userId === targetUserId) throw new Error("You cannot follow yourself");

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
    } else {
      // follow
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId,
          },
        }),

        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId, // user being followed
            creatorId: userId, // user following
          },
        }),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error in toggleFollow", error);
    return { success: false, error: "Error toggling follow" };
  }
}
