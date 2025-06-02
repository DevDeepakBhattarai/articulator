"use server";

import { db } from "@/lib/prisma";

export async function getChatSessions() {
  try {
    const chatSessions = await db.chatSession.findMany({
      include: {
        video: true,
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return { success: true, chatSessions };
  } catch (error) {
    console.error("Error loading chat sessions:", error);
    return { success: false, error: "Failed to load chat sessions" };
  }
}

export async function getChatHistory(chatSessionId: string) {
  try {
    const chatSession = await db.chatSession.findUnique({
      where: { id: chatSessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        video: true,
      },
    });

    if (!chatSession) {
      return { success: false, error: "Chat session not found" };
    }

    // Transform messages to match AI SDK format
    const messages = chatSession.messages.map(
      (msg: {
        id: string;
        role: string;
        content: string;
        createdAt: Date;
      }) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: msg.createdAt,
      })
    );

    return {
      success: true,
      chatSession: {
        id: chatSession.id,
        title: chatSession.title,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
        video: chatSession.video,
      },
      messages,
    };
  } catch (error) {
    console.error("Error loading chat history:", error);
    return { success: false, error: "Failed to load chat history" };
  }
}
