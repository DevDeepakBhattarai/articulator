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
import { getChatSessions, getChatHistory } from "@/app/_actions/actions";
import { Button } from "./ui/button";
import { useArticulatorStore } from "@/states/useArticulatorStore";

interface ChatSession {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  video: {
    id: string;
    fileName: string;
    uploadedAt: Date;
    filePath?: string;
  };
  _count: {
    messages: number;
  };
}

// Create a custom event type for video loading
export interface VideoLoadEvent extends CustomEvent {
  detail: {
    videoPath: string;
    sessionId: string;
  };
}

// Declare the event for TypeScript
declare global {
  interface WindowEventMap {
    "articulator:load-video": VideoLoadEvent;
  }
}

export function ChatHistorySheet() {
  const {
    currentChatSessionId,
    setMessages,
    setCurrentChatSessionId,
    setShowChat,
  } = useArticulatorStore();
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

  const handleSelectSession = async (sessionId: string) => {
    const result = await getChatHistory(sessionId);

    if (result.success) {
      setCurrentChatSessionId(sessionId);
      setMessages(result.messages || []);

      // Load the associated video if available by dispatching an event
      if (result.chatSession?.video?.filePath) {
        const videoPath = result.chatSession.video.filePath;

        // Dispatch custom event for video handling
        const videoEvent = new CustomEvent("articulator:load-video", {
          detail: {
            videoPath,
            sessionId,
          },
        });

        window.dispatchEvent(videoEvent);
      }
      setShowChat(true);
    } else {
      console.error("Failed to load chat history:", result.error);
    }

    setOpen(false);
  };

  const defaultTrigger = (
    <Button
      size="icon"
      variant={"ghost"}
      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 text-white transition-all duration-200"
    >
      <History className="w-4 h-4" />
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{defaultTrigger}</SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-background/95 backdrop-blur-xl border-border">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center gap-2">
            <History className="w-5 h-5" />
            Chat History
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            View and continue your previous speech analysis sessions
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Loading sessions...
              </span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive">{error}</p>
              <button
                onClick={loadSessions}
                className="mt-2 text-sm text-destructive hover:text-destructive/80 underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && chatSessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-1">No chat sessions yet</p>
              <p className="text-sm opacity-75">
                Upload a video to start your first analysis!
              </p>
            </div>
          )}

          {!loading && !error && chatSessions.length > 0 && (
            <div className="space-y-2 max-h-full overflow-y-auto p-2">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
                    currentChatSessionId === session.id
                      ? "bg-primary/20 border-primary/50"
                      : "bg-muted hover:bg-muted/80 border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-r from-primary to-secondary rounded-lg flex-shrink-0">
                      <Video className="w-4 h-4 text-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-foreground font-medium text-sm truncate">
                        {session.title || `Session ${session.id.slice(-6)}`}
                      </h4>

                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
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

                      <p className="text-xs text-muted-foreground mt-1 truncate">
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
