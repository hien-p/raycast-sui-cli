import { clsx } from 'clsx';

interface CommandItemProps {
  icon?: string;
  title: string;
  subtitle?: string;
  accessory?: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
}

export function CommandItem({
  icon,
  title,
  subtitle,
  accessory,
  isSelected,
  onClick,
}: CommandItemProps) {
  return (
    <div
      onClick={onClick}
      data-selected={isSelected}
      className={clsx(
        'relative flex items-center gap-2 px-3 py-2 cursor-pointer',
        'transition-all duration-150 group font-mono',
        isSelected
          ? 'bg-white/5 border-l-2 border-l-[#4da2ff]'
          : 'border-l-2 border-l-transparent hover:bg-white/[0.02] hover:border-l-white/20'
      )}
    >
      {/* Terminal selection indicator */}
      <span className={clsx(
        'text-xs font-bold transition-opacity w-3 flex-shrink-0',
        isSelected ? 'text-[#4da2ff] opacity-100' : 'opacity-0'
      )}>
        &gt;
      </span>

      {icon && (
        <span className={clsx(
          'text-base flex-shrink-0 w-5 text-center transition-transform',
          isSelected && 'scale-110'
        )}>
          {icon}
        </span>
      )}

      <div className="flex-1 min-w-0">
        <div className={clsx(
          'text-sm truncate transition-colors',
          isSelected ? 'text-white' : 'text-white/70 group-hover:text-white/90'
        )}>
          {title}
        </div>
        {subtitle && (
          <div className={clsx(
            'text-xs truncate',
            isSelected ? 'text-white/50' : 'text-white/30'
          )}>
            {subtitle}
          </div>
        )}
      </div>

      {accessory && <div className="flex-shrink-0">{accessory}</div>}

      {/* Keyboard shortcut hint on selection */}
      {isSelected && !accessory && (
        <kbd className="flex-shrink-0 px-1.5 py-0.5 text-[10px] bg-white/5 text-white/40 rounded border border-white/10">
          enter
        </kbd>
      )}
    </div>
  );
}
