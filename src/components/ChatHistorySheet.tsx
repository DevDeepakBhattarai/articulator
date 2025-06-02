"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Video, Calendar, History, Loader } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getChatSessions } from "@/app/_actions/actions";
import { Button } from "./ui/button";

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

interface ChatHistorySheetProps {
  onSelectSession: (sessionId: string) => void;
  currentSessionId?: string | null;
  trigger?: React.ReactNode;
}

export function ChatHistorySheet({
  onSelectSession,
  currentSessionId,
  trigger,
}: ChatHistorySheetProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open]);

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

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    setOpen(false);
  };

  const defaultTrigger = (
    <Button
      size="icon"
      variant={"ghost"}
      className="fixed top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 text-white transition-all duration-200"
    >
      <History className="w-4 h-4" />
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-gray-900/95 backdrop-blur-xl border-white/20">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <History className="w-5 h-5" />
            Chat History
          </SheetTitle>
          <SheetDescription className="text-gray-300">
            View and continue your previous speech analysis sessions
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-400" />
              <span className="ml-2 text-gray-300">Loading sessions...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-300">{error}</p>
              <button
                onClick={loadSessions}
                className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && chatSessions.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-1">No chat sessions yet</p>
              <p className="text-sm opacity-75">
                Upload a video to start your first analysis!
              </p>
            </div>
          )}

          {!loading && !error && chatSessions.length > 0 && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
                    currentSessionId === session.id
                      ? "bg-blue-500/20 border-blue-400/50"
                      : "bg-white/5 hover:bg-white/10 border-white/10"
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
