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
        'relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer',
        'transition-all duration-200 group',
        isSelected
          ? 'bg-gradient-to-r from-accent/20 via-accent/15 to-accent/20 border border-accent/40 shadow-lg shadow-accent/10'
          : 'hover:bg-gradient-to-r hover:from-secondary/60 hover:via-secondary/40 hover:to-secondary/60 border border-transparent hover:border-accent/20 hover:shadow-md'
      )}
    >
      {icon && (
        <span className="text-lg flex-shrink-0 w-6 text-center">{icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-foreground text-sm font-medium truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-muted-foreground text-xs truncate">{subtitle}</div>
        )}
      </div>
      {accessory && <div className="flex-shrink-0">{accessory}</div>}
    </div>
  );
}
