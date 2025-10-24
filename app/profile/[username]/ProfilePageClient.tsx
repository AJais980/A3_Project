"use client";

import { getProfileByUsername, getUserPosts, updateProfile } from "@/actions/profile.action";
import { toggleFollow } from "@/actions/user.action";
import { getUserStats } from "@/actions/badge.action";
import { createOrGetChat } from "@/actions/chat.action";
import { getDbUserId } from "@/actions/user.action";
import DesignationBadge from "@/components/DesignationBadge";
import PostCard from "@/components/PostCard";
import { BadgeList, BadgeProgress } from "@/components/BadgeDisplay";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input-copy";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarIcon,
  EditIcon,
  FileTextIcon,
  LinkIcon,
  MapPinIcon,
  MessageCircleIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

type User = Awaited<ReturnType<typeof getProfileByUsername>>;
type Posts = Awaited<ReturnType<typeof getUserPosts>>;
type BadgeStats = Awaited<ReturnType<typeof getUserStats>>;

interface ProfilePageClientProps {
  user: NonNullable<User>;
  posts: Posts;
  isFollowing: boolean;
  badgeStats: BadgeStats;
}

function ProfilePageClient({
  isFollowing: initialIsFollowing,
  posts,
  user,
  badgeStats,
}: ProfilePageClientProps) {
  const { user: currentUser, loading } = useAuth();
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentUserDbId, setCurrentUserDbId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
    designation: user.designation || "",
  });

  // Fetch current user's database ID
  useEffect(() => {
    const fetchCurrentUserDbId = async () => {
      if (currentUser) {
        const dbId = await getDbUserId(currentUser.uid);
        setCurrentUserDbId(dbId);
      }
    };
    fetchCurrentUserDbId();
  }, [currentUser]);

  const handleEditSubmit = async () => {
    if (!currentUser) return;
    const formData = new FormData();
    Object.entries(editForm).forEach(([key, value]) => {
      formData.append(key, value);
    });
    const result = await updateProfile(currentUser.uid, formData);
    if (result.success) {
      setShowEditDialog(false);
      toast.success("Profile updated successfully");
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return;
    try {
      setIsUpdatingFollow(true);
      await toggleFollow(user.id, currentUser.uid);
      setIsFollowing(!isFollowing);
    } catch (error) {
      toast.error("Failed to update follow status");
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  const handleChatClick = async () => {
    if (!currentUser || isChatLoading) return;

    setIsChatLoading(true);
    try {
      // Get current user's database ID
      const currentDbUserId = await getDbUserId(currentUser.uid);

      if (!currentDbUserId) {
        toast.error("Unable to identify current user.");
        return;
      }

      // Prevent chatting with oneself
      if (currentDbUserId === user.id) {
        toast.error("You cannot chat with yourself.");
        return;
      }

      // Call the server action to create or get the chat
      const result = await createOrGetChat(currentDbUserId, user.id);

      if (result.success && result.chat) {
        router.push(`/conversations/${result.chat.id}`);
      } else {
        toast.error(result.error || "Failed to start chat.");
      }
    } catch (error) {
      console.error("Error initiating chat:", error);
      toast.error("An unexpected error occurred while starting chat.");
    } finally {
      setIsChatLoading(false);
    }
  };

  // Only allow access if signed in
  if (loading) return null;
  if (!currentUser) {
    if (typeof window !== "undefined") {
      window.location.href = "/signin";
    }
    return null;
  }

  // Compare Firebase UID with the user's firebaseId from database
  const isOwnProfile = currentUser?.uid === user.firebaseId;

  const formattedDate = format(new Date(user.createdAt), "MMMM yyyy");

  return (
    <div className="bg-gray-950 border border-gray-900 rounded-2xl space-y-6 mt-[17vh] mb-[5vh] mx-1 sm:mx-4 overflow-hidden max-w-[100vw]">
      <div className="max-w-[calc(100vw-1rem)] sm:max-w-4xl mx-auto p-4 sm:p-6 space-y-6 overflow-hidden">
        {/* Profile Card - Separate Box */}
        <Card className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-indigo-900/30 border border-purple-500/20 shadow-2xl backdrop-blur-sm">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <Avatar className="w-24 h-24 border-4 border-purple-400/40 shadow-lg ring-2 ring-purple-500/20">
                  <AvatarImage src={user.image ?? "/avatar.png"} />
                </Avatar>
                <div className="mt-4 w-full">
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 break-words">
                    {user.name ?? user.username}
                  </h1>
                  <div className="flex items-center justify-center lg:justify-start mb-3 flex-wrap">
                    <p className="text-gray-400 break-all">@{user.username}</p>
                    {user.designation && (
                      <DesignationBadge
                        designation={user.designation as 'STUDENT' | 'TEACHER' | 'WORKING_PROFESSIONAL'}
                        size="md"
                        className="ml-2 mt-1 sm:mt-0"
                        userBadges={badgeStats.badges}
                        showBadges={true}
                      />
                    )}
                  </div>

                  {/* Badge Stats Display */}
                  {badgeStats.badges.length > 0 && (
                    <div className="mb-4 text-center lg:text-left">
                      <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
                        <span className="text-sm font-medium text-purple-300">Achievements</span>
                        <span className="text-xs text-gray-400">
                          {badgeStats.averageRating.toFixed(1)}⭐ ({badgeStats.totalRatings} ratings)
                        </span>
                      </div>
                      <BadgeList
                        badges={badgeStats.badges}
                        size="sm"
                        showNames={true}
                        maxDisplay={5}
                        className="justify-center lg:justify-start"
                      />
                    </div>
                  )}
                  {user.bio && (
                    <p className="text-gray-300 text-sm leading-relaxed max-w-full break-words">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats and Actions */}
              <div className="flex-1 mt-6 lg:mt-0">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  <div className="text-center p-3 bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-lg border border-purple-500/30 backdrop-blur-sm">
                    <div className="text-xl font-bold text-white mb-1">
                      {user._count.posts.toLocaleString()}
                    </div>
                    <div className="text-xs text-purple-200">Posts</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 rounded-lg border border-indigo-500/30 backdrop-blur-sm">
                    <div className="text-xl font-bold text-white mb-1">
                      {user._count.followers.toLocaleString()}
                    </div>
                    <div className="text-xs text-indigo-200">Followers</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 rounded-lg border border-emerald-500/30 backdrop-blur-sm">
                    <div className="text-xl font-bold text-white mb-1">
                      {user._count.following.toLocaleString()}
                    </div>
                    <div className="text-xs text-emerald-200">Following</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-amber-900/40 to-amber-800/20 rounded-lg border border-amber-500/30 backdrop-blur-sm">
                    <div className="text-xl font-bold text-white mb-1">
                      {badgeStats.badgeCount}
                    </div>
                    <div className="text-xs text-amber-200">Badges</div>
                  </div>
                </div>

                {/* Action Button */}
                {isOwnProfile ? (
                  <Button
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all mb-4 text-sm sm:text-base"
                    onClick={() => setShowEditDialog(true)}
                  >
                    <EditIcon className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2 mb-4">
                    <Button
                      className={`flex-1 sm:flex-initial sm:w-auto px-4 sm:px-6 py-2 font-semibold rounded-lg transition-all text-sm sm:text-base ${isFollowing
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                        }`}
                      onClick={handleFollow}
                      disabled={isUpdatingFollow}
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                    <Button
                      onClick={handleChatClick}
                      disabled={isChatLoading}
                      className="flex-1 sm:flex-initial sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-sm sm:text-base"
                    >
                      {isChatLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Starting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <MessageCircleIcon className="w-4 h-4" />
                          <span>Chat</span>
                        </div>
                      )}
                    </Button>
                  </div>
                )}

                {/* Additional Info */}
                <div className="space-y-2">
                  {user.location && (
                    <div className="flex items-center text-gray-300 text-sm">
                      <MapPinIcon className="w-4 h-4 mr-2 text-purple-400 flex-shrink-0" />
                      <span className="break-words">{user.location}</span>
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center text-gray-300 text-sm">
                      <LinkIcon className="w-4 h-4 mr-2 text-purple-400 flex-shrink-0" />
                      <a
                        href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                        className="hover:text-purple-400 transition-colors hover:underline break-all"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {user.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center text-gray-300 text-sm">
                    <CalendarIcon className="w-4 h-4 mr-2 text-purple-400" />
                    <span>Joined {formattedDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badge Progress Section - Only show for own profile */}
        {isOwnProfile && (
          <Card className="bg-gradient-to-br from-gray-900/95 via-purple-900/10 to-indigo-900/20 border border-purple-500/20 shadow-2xl backdrop-blur-md ring-1 ring-purple-500/10">
            <CardContent className="p-3 sm:p-6">
              <BadgeProgress
                userBadges={badgeStats.badges}
                averageRating={badgeStats.averageRating}
                totalRatings={badgeStats.totalRatings}
              />
            </CardContent>
          </Card>
        )}

        {/* Posts Section - Separate Box */}
        <Card className="bg-gradient-to-br from-gray-900/95 via-slate-800/90 to-zinc-900/95 border border-gray-700/50 shadow-2xl backdrop-blur-md ring-1 ring-white/5">
          <CardContent className="p-3 sm:p-6">
            {/* Posts Header */}
            <div className="flex items-center justify-center space-x-3 pb-4 border-b border-gradient-to-r from-gray-700/50 via-gray-600/30 to-gray-700/50 mb-6 relative">
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-500/50 to-transparent"></div>
              <FileTextIcon className="w-5 h-5 text-gray-300" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Posts</h2>
              <span className="text-gray-400">({user._count.posts})</span>
            </div>

            {/* Posts Content with Better Mobile Width */}
            <div className="w-full sm:max-w-2xl mx-auto p-2 sm:px-0 overflow-hidden">
              {posts.length > 0 ? (
                <div className="space-y-6 overflow-hidden">
                  {posts.map((post) => (
                    <div key={post.id} className="w-full max-w-[calc(100vw-1rem)] sm:max-w-none mx-auto overflow-hidden">
                      <PostCard post={post} dbUserId={currentUserDbId} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                    <FileTextIcon className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No posts yet</h3>
                  <p className="text-gray-500 text-sm">
                    {isOwnProfile ? "Share your first post to get started!" : "This user hasn't posted anything yet."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  name="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="min-h-[100px]"
                  placeholder="Tell us about yourself"
                />
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <select
                  name="designation"
                  value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select your designation</option>
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="WORKING_PROFESSIONAL">Working Professional</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  name="location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Where are you based?"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  name="website"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="Your personal website"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleEditSubmit}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
export default ProfilePageClient;
