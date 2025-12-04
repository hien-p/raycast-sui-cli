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
        'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer',
        'transition-colors duration-75',
        isSelected ? 'bg-accent/10' : 'hover:bg-background-hover'
      )}
    >
      {icon && (
        <span className="text-lg flex-shrink-0 w-6 text-center">{icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-text-primary text-sm font-medium truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-text-secondary text-xs truncate">{subtitle}</div>
        )}
      </div>
      {accessory && <div className="flex-shrink-0">{accessory}</div>}
    </div>
  );
}
