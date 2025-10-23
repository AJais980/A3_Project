import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { user1Id, user2Id } = await req.json();

    if (!user1Id || !user2Id) {
      return NextResponse.json({ error: "Both user IDs are required" }, { status: 400 });
    }

    // Ensure ordering (to satisfy unique constraint user1Id + user2Id)
    const [first, second] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    let chat = await prisma.chat.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: first,
          user2Id: second,
        },
      },
      include: { user1: true, user2: true },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          user1Id: first,
          user2Id: second,
        },
        include: { user1: true, user2: true },
      });
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error creating/fetching chat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
