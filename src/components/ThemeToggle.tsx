import React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
}

export function ThemeToggle({
  isDark,
  onToggle,
  size = "md",
}: ThemeToggleProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-6 w-6";
  const buttonSize = size === "sm" ? "h-6 w-6" : "h-10 w-10";
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${buttonSize} p-0 hover:bg-transparent cursor-pointer relative transition-all duration-200`}
      aria-label={
        isDark ? "Switch to light mode" : "Switch to dark mode"
      }
      style={{
        filter: isHovered
          ? "drop-shadow(0 0 8px rgba(74, 209, 154, 0.15))"
          : "none",
      }}
    >
      {isDark ? (
        <Sun
          className={`${iconSize} transition-colors`}
          style={{ color: "#F8F9F7" }}
        />
      ) : (
        <Moon
          className={`${iconSize} transition-colors`}
          style={{ color: "#1D4E33" }}
        />
      )}
    </Button>
  );
}
