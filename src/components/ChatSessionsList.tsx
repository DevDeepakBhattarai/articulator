"use client";

import { getChatSessions } from "@/app/_actions/actions";
import { MessageCircle, Video, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

interface ChatSession {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  video: {
    id: string;
    fileName: string;
    uploadedAt: Date;
  };
  _count: {
    messages: number;
  };
}

interface ChatSessionsListProps {
  onSelectSession: (sessionId: string) => void;
  currentSessionId?: string | null;
}

export function ChatSessionsList({
  onSelectSession,
  currentSessionId,
}: ChatSessionsListProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const result = await getChatSessions();

        if (result.success) {
          setChatSessions(result.chatSessions || []);
          setError(null);
        } else {
          setError(result.error || "Failed to load sessions");
        }
      } catch (err) {
        setError("Failed to load sessions");
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-gray-300 text-center">
        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
        <p className="text-sm">Loading chat sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-300">
        Failed to load chat sessions: {error}
      </div>
    );
  }

  if (chatSessions.length === 0) {
    return (
      <div className="p-4 text-gray-300 text-center">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No chat sessions yet.</p>
        <p className="text-xs opacity-75">
          Upload a video to start your first chat!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-white px-4 pb-2">
        Chat History
      </h3>
      {chatSessions.map((session: ChatSession) => (
        <div
          key={session.id}
          onClick={() => onSelectSession(session.id)}
          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mx-2 ${
            currentSessionId === session.id
              ? "bg-blue-500/30 border border-blue-400/50"
              : "bg-white/5 hover:bg-white/10 border border-transparent"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg flex-shrink-0">
              <Video className="w-4 h-4 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm truncate">
                {session.title || `Session ${session.id.slice(-6)}`}
              </h4>

              <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{session._count.messages} messages</span>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-1 truncate">
                {session.video.fileName}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
