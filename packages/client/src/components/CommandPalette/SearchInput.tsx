import { forwardRef, useState } from 'react';
import { clsx } from 'clsx';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, placeholder = 'Type a command or search...', className }, ref) => {
    const [isFocused, setIsFocused] = useState(true);

    return (
      <div className={clsx(
        'flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/20',
        className
      )}>
        {/* Terminal prompt prefix */}
        <span className="text-[#4da2ff] font-mono text-sm font-bold select-none flex-shrink-0" aria-hidden="true">
          sui&gt;
        </span>

        <div className="flex-1 relative flex items-center">
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-white/30 caret-transparent"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            role="combobox"
            aria-label="Search commands"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="command-list"
          />

          {/* Blinking cursor */}
          <span
            className={clsx(
              'absolute font-mono text-[#4da2ff] pointer-events-none transition-opacity',
              isFocused ? 'animate-pulse' : 'opacity-0'
            )}
            style={{
              left: `${value.length * 0.55}em`,
              animationDuration: '1s'
            }}
          >
            _
          </span>
        </div>

        {/* Clear button styled as terminal command */}
        {value && (
          <button
            onClick={() => onChange('')}
            className="px-2 py-0.5 text-xs font-mono text-white/40 hover:text-white/70 hover:bg-white/5 rounded transition-colors"
            title="Clear (Esc)"
            aria-label="Clear search"
          >
            [clear]
          </button>
        )}

        {/* Keyboard hint */}
        {!value && (
          <div className="flex items-center gap-1.5 text-white/20 text-xs font-mono">
            <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-white/40 text-[10px]">↑↓</kbd>
            <span>navigate</span>
          </div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
