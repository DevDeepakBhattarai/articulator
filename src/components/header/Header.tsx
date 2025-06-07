import React from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatHistorySheet } from "../ChatHistorySheet";
import { ModeToggle } from "../ui/theme-toggle";

const Header = () => {
  return (
    <header className="border-b bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and App Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-primary text-primary-foreground rounded-lg font-bold text-sm">
            A
          </div>
          <h1 className="text-xl font-semibold text-foreground">Articulator</h1>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Chat History Button */}
          <ModeToggle />

          <ChatHistorySheet />

          {/* User Avatar */}
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;
