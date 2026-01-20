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

/**
 * Delete user account and all associated content from both Supabase and Firebase
 */
export async function deleteUserAccount(firebaseUid: string) {
    try {
        const userId = await getDbUserId(firebaseUid);

        if (!userId) {
            return { success: false, error: "User not found" };
        }

        // Step 1: Delete user and all associated data from Supabase
        // Cascading deletes will handle related data due to schema relationships
        await prisma.user.delete({
            where: { id: userId },
        });

        // Step 2: Delete user from Firebase Authentication via API route
        try {
            console.log("📧 Attempting to delete Firebase user:", firebaseUid);

            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
            const deleteResponse = await fetch(`${baseUrl}/api/auth/delete-firebase-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firebaseUid,
                }),
            });

            if (!deleteResponse.ok) {
                const error = await deleteResponse.json();
                console.warn("⚠️ Warning: Could not delete Firebase user. User deleted from Supabase.");
                console.warn("Firebase deletion error:", error);
            } else {
                console.log("✅ Firebase user deleted successfully");
            }
        } catch (firebaseError) {
            console.warn("⚠️ Warning: Could not delete Firebase user. User deleted from Supabase but may remain in Firebase.");
            console.warn("Firebase deletion error:", firebaseError);
            // Don't fail the entire operation if Firebase deletion fails
            // The user is already deleted from Supabase, so they can't access the account
        }

        revalidatePath("/");
        revalidatePath("/profile");
        revalidatePath("/explore");
        revalidatePath("/conversations");

        return { success: true, message: "Account deleted successfully" };
    } catch (error) {
        console.error("Error in deleteUserAccount:", error);
        return { success: false, error: "Failed to delete account. Please try again." };
    }
}
