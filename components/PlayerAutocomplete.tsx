"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { normalizeForSearch } from "@/lib/normalize";

interface PlayerOption {
  playerId: string;
  name: string;
  imageUrl: string;
  position: string;
  club: string;
  marketValueDisplay: string;
}

interface PlayerAutocompleteProps<T extends PlayerOption> {
  players: T[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (player: T) => void;
  placeholder?: string;
  /** Render trailing content for each suggestion row */
  renderTrailing?: (player: T) => React.ReactNode;
}

export function PlayerAutocomplete<T extends PlayerOption>({
  players,
  value,
  onChange,
  onSelect,
  placeholder = "Search player...",
  renderTrailing,
}: PlayerAutocompleteProps<T>) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    const q = normalizeForSearch(value);
    return players.filter((p) => normalizeForSearch(p.name).includes(q)).slice(0, 10);
  }, [value, players]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInputChange(val: string) {
    onChange(val);
    setHighlightIndex(-1);
    if (!val.trim()) {
      setShowDropdown(false);
      return;
    }
    setShowDropdown(true);
  }

  function handleSelect(player: T) {
    onSelect(player);
    setShowDropdown(false);
    setHighlightIndex(-1);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightIndex]);
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => value.trim() && setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-11"
      />

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-xl bg-elevated border border-border-subtle divide-y divide-border-subtle"
        >
          {suggestions.map((player, i) => (
            <button
              key={player.playerId}
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${i === highlightIndex ? "bg-accent-gold/10" : ""}`}
              onMouseEnter={() => setHighlightIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(player);
              }}
            >
              {player.imageUrl ? (
                <img src={player.imageUrl} alt="" className="w-8 h-8 rounded-md object-cover shrink-0 bg-card" />
              ) : (
                <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold shrink-0 bg-card text-text-muted">
                  {player.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-text-primary">{player.name}</div>
                <div className="text-xs truncate text-text-secondary">
                  {player.position} · {player.club} · {player.marketValueDisplay}
                </div>
              </div>
              {renderTrailing?.(player)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
