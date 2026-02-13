"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import type { OptionGroup } from "@/lib/types";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  searchable?: boolean;
  groups?: OptionGroup[];
}

export function MultiSelect({
  options, selected, onChange,
  placeholder = "Select options...",
  maxSelections, searchable = true, groups,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const filteredOptions = search
    ? options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()))
    : options;

  const getGroupedOptions = (): OptionGroup[] | null => {
    if (!groups) return null;
    const result: OptionGroup[] = [];
    for (const group of groups) {
      const filtered = group.options.filter((opt) =>
        search ? opt.toLowerCase().includes(search.toLowerCase()) : true
      );
      if (filtered.length > 0) result.push({ label: group.label, options: filtered });
    }
    return result.length > 0 ? result : null;
  };

  const groupedFiltered = groups ? getGroupedOptions() : null;

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      if (maxSelections && selected.length >= maxSelections) return;
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: string) => onChange(selected.filter((s) => s !== option));
  const clearAll = () => onChange([]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left transition-all"
        style={{
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-card)",
          color: selected.length === 0 ? "var(--ink-faint)" : "var(--ink-soft)",
        }}
      >
        <span className="truncate">
          {selected.length === 0 ? placeholder : `${selected.length} selected`}
        </span>
        <ChevronDown className={`ml-2 h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "var(--ink-faint)" }} />
      </button>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.slice(0, 5).map((option) => (
            <span key={option} className="tag tag-interest">
              {option.length > 25 ? option.substring(0, 25) + "…" : option}
              <button type="button" onClick={(e) => { e.stopPropagation(); removeOption(option); }}
                className="ml-0.5 rounded-full p-0.5 hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selected.length > 5 && (
            <span className="text-xs" style={{ color: "var(--ink-faint)" }}>+{selected.length - 5} more</span>
          )}
          <button type="button" onClick={clearAll} className="text-xs hover:opacity-70" style={{ color: "var(--ink-faint)" }}>
            Clear all
          </button>
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-hidden rounded-xl animate-scale-in"
          style={{
            border: "var(--glass-border)",
            background: "var(--bg-card-hover)",
            backdropFilter: "blur(var(--glass-blur))",
            WebkitBackdropFilter: "blur(var(--glass-blur))",
            boxShadow: "var(--glass-shadow-elevated)",
          }}>
          {searchable && (
            <div className="sticky top-0 p-2" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-card-hover)" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--ink-faint)" }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-lg border-0 py-2 pl-9 pr-4 text-sm"
                  style={{ background: "var(--bg-glass)", color: "var(--ink)" }}
                />
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto p-1">
            {groupedFiltered
              ? groupedFiltered.map((group) => (
                  <div key={group.label} className="mb-2">
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>
                      {group.label}
                    </div>
                    {group.options.map((option) => (
                      <button
                        key={option} type="button"
                        onClick={() => toggleOption(option)}
                        disabled={maxSelections !== undefined && selected.length >= maxSelections && !selected.includes(option)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          color: selected.includes(option) ? "var(--burgundy)" : "var(--ink-soft)",
                          background: selected.includes(option) ? "var(--burgundy-wash)" : "transparent",
                        }}
                      >
                        <span className="truncate">{option}</span>
                        {selected.includes(option) && <Check className="h-4 w-4 shrink-0" style={{ color: "var(--burgundy)" }} />}
                      </button>
                    ))}
                  </div>
                ))
              : filteredOptions.map((option) => (
                  <button
                    key={option} type="button"
                    onClick={() => toggleOption(option)}
                    disabled={maxSelections !== undefined && selected.length >= maxSelections && !selected.includes(option)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      color: selected.includes(option) ? "var(--burgundy)" : "var(--ink-soft)",
                      background: selected.includes(option) ? "var(--burgundy-wash)" : "transparent",
                    }}
                  >
                    <span className="truncate">{option}</span>
                    {selected.includes(option) && <Check className="h-4 w-4 shrink-0" style={{ color: "var(--burgundy)" }} />}
                  </button>
                ))
            }
            {filteredOptions.length === 0 && (
              <div className="px-3 py-4 text-center text-sm" style={{ color: "var(--ink-muted)" }}>No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
