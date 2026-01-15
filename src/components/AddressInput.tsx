'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type AddressSelection = {
  address: string;
  apn?: string;
  lat?: number;
  lon?: number;
};

type AutocompleteResult = {
  address: string;
  apn: string;
  lat: number;
  lon: number;
};

type AddressInputProps = {
  onSubmit: (selection: AddressSelection) => void;
  isLoading?: boolean;
  error?: string | null;
};

export function AddressInput({ onSubmit, isLoading, error }: AddressInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedAddress, setSelectedAddress] = useState<AutocompleteResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const skipNextSearchRef = useRef(false);

  // Debounced fetch for autocomplete - non-blocking
  const fetchSuggestions = useCallback(async (query: string) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `/api/autocomplete?q=${encodeURIComponent(query)}`,
        { signal: abortControllerRef.current.signal }
      );
      const data = await response.json();
      setSuggestions(data.results || []);
      setShowDropdown(true);
      setSelectedIndex(-1);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Autocomplete error:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    // Skip search if we just selected an address (prevents race condition)
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    if (inputValue.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // If user has a selected address that matches input, don't search
    if (selectedAddress && inputValue === selectedAddress.address) {
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 200);

    return () => clearTimeout(debounceTimer);
  }, [inputValue, selectedAddress, fetchSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSelectedAddress(null); // Clear selection when user types
  };

  const handleSelectSuggestion = (suggestion: AutocompleteResult) => {
    // Cancel any pending request and skip next search effect
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    skipNextSearchRef.current = true;

    setInputValue(suggestion.address);
    setSelectedAddress(suggestion);
    setSuggestions([]);
    setShowDropdown(false);
    setIsLoadingSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        if (showDropdown && suggestions.length > 0) {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        }
        break;
      case 'ArrowUp':
        if (showDropdown && suggestions.length > 0) {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        }
        break;
      case 'Enter':
        if (showDropdown && selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        // Otherwise, let form submit naturally with current text
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Close dropdown on submit
    setShowDropdown(false);

    // If we have a selected address with APN/coords, use those
    if (selectedAddress) {
      onSubmit({
        address: selectedAddress.address,
        apn: selectedAddress.apn,
        lat: selectedAddress.lat,
        lon: selectedAddress.lon,
      });
    } else {
      // Fallback to just the address string (will use geocoding)
      onSubmit({ address: inputValue.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                id="address"
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => inputValue.length >= 3 && setShowDropdown(true)}
                placeholder="Start typing an address..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-white"
                disabled={isLoading}
                autoComplete="off"
              />
              {isLoadingSuggestions && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              )}

              {/* Dropdown - hide if we have a verified selection */}
              {showDropdown && !(selectedAddress && inputValue === selectedAddress.address) && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                  {isLoadingSuggestions && suggestions.length === 0 && (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      Searching...
                    </div>
                  )}
                  {!isLoadingSuggestions && suggestions.length === 0 && (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      No matches found. Press Enter to search anyway.
                    </div>
                  )}
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.apn}-${index}`}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 ${
                        index === selectedIndex ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">{suggestion.address}</div>
                      <div className="text-sm text-gray-500">APN: {suggestion.apn}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>

        {selectedAddress && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Address verified - APN: {selectedAddress.apn}
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
