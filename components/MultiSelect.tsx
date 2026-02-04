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
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  maxSelections,
  searchable = true,
  groups,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Filter options based on search
  const filteredOptions = search
    ? options.filter((opt) =>
        opt.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // Get grouped filtered options if provided
  const getGroupedOptions = (): OptionGroup[] | null => {
    if (!groups) return null;
    const result: OptionGroup[] = [];
    for (const group of groups) {
      const filtered = group.options.filter((opt) =>
        search ? opt.toLowerCase().includes(search.toLowerCase()) : true
      );
      if (filtered.length > 0) {
        result.push({ label: group.label, options: filtered });
      }
    }
    return result.length > 0 ? result : null;
  };

  const groupedFiltered = groups ? getGroupedOptions() : null;

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      if (maxSelections && selected.length >= maxSelections) {
        return;
      }
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: string) => {
    onChange(selected.filter((s) => s !== option));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-paper-200 bg-white px-4 py-2.5 text-left transition-all hover:border-paper-300 focus:border-paper-400 focus:outline-none focus:ring-2 focus:ring-paper-200"
      >
        <span className="truncate text-paper-600">
          {selected.length === 0
            ? placeholder
            : `${selected.length} selected`}
        </span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-paper-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.slice(0, 5).map((option) => (
            <span
              key={option}
              className="inline-flex items-center gap-1 rounded-md bg-paper-100 px-2 py-0.5 text-xs font-medium text-paper-700"
            >
              {option.length > 25 ? option.substring(0, 25) + "…" : option}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(option);
                }}
                className="ml-0.5 rounded-full p-0.5 hover:bg-paper-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selected.length > 5 && (
            <span className="text-xs text-paper-500">
              +{selected.length - 5} more
            </span>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-paper-500 hover:text-paper-700"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-hidden rounded-lg border border-paper-200 bg-white shadow-lg animate-scale-in">
          {/* Search input */}
          {searchable && (
            <div className="sticky top-0 border-b border-paper-100 bg-white p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-paper-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-md border-0 bg-paper-50 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-paper-200"
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto p-1">
            {groupedFiltered
              ? // Grouped options
                groupedFiltered.map((group) => (
                  <div key={group.label} className="mb-2">
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-paper-400">
                      {group.label}
                    </div>
                    {group.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleOption(option)}
                        disabled={
                          maxSelections !== undefined &&
                          selected.length >= maxSelections &&
                          !selected.includes(option)
                        }
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          selected.includes(option)
                            ? "bg-paper-100 text-paper-900"
                            : "text-paper-700 hover:bg-paper-50"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <span className="truncate">{option}</span>
                        {selected.includes(option) && (
                          <Check className="h-4 w-4 shrink-0 text-paper-600" />
                        )}
                      </button>
                    ))}
                  </div>
                ))
              : // Flat options
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    disabled={
                      maxSelections !== undefined &&
                      selected.length >= maxSelections &&
                      !selected.includes(option)
                    }
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      selected.includes(option)
                        ? "bg-paper-100 text-paper-900"
                        : "text-paper-700 hover:bg-paper-50"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <span className="truncate">{option}</span>
                    {selected.includes(option) && (
                      <Check className="h-4 w-4 shrink-0 text-paper-600" />
                    )}
                  </button>
                ))}

            {filteredOptions.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-paper-500">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
