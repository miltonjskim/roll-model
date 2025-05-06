'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleExpand = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      // 확장 후 입력 필드에 포커스
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else if (!searchQuery.trim()) {
      setIsExpanded(false);
    } else {
      handleSearch();
    }
  };

  // 컴포넌트 마운트 시 처음으로 인풋에 포커스
  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  return (
    <div className="relative w-fit">
      <div className={`relative flex items-center justify-center rounded-full bg-black transition-all duration-300 ease-in-out ${isExpanded ? 'h-12 w-56' : 'h-12 w-12'} flex-row-reverse`}>
        <div className={`transition-all duration-300 ease-in-out ${isExpanded ? '' : 'pr-2'}`} onClick={toggleExpand}>
          <svg viewBox="0 0 512 512" height="1.3em" xmlns="http://www.w3.org/2000/svg" className="cursor-pointer fill-white">
            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"></path>
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="검색..."
          className={`h-full border-none bg-transparent pl-3 text-white transition-all duration-300 ease-in-out outline-none ${isExpanded ? 'w-44' : 'h-0 w-0'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};
