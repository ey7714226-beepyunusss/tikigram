import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface AvatarProps {
  profile?: Profile | null;
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  ring?: boolean;
}

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-24 h-24',
};

export default function Avatar({ profile, src, alt, size = 'md', className, ring }: AvatarProps) {
  const imageSrc = src || profile?.avatar_url;
  const fallbackText = (profile?.display_name || profile?.username || alt || '?')[0]?.toUpperCase();
  return (
    <div
      className={cn(
        'rounded-full overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center',
        sizeMap[size],
        ring && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        className
      )}
    >
      {imageSrc ? (
        <img src={imageSrc} alt={alt || profile?.username || ''} className="w-full h-full object-cover" />
      ) : (
        <span className={cn('font-semibold text-muted-foreground', size === 'xs' ? 'text-xs' : 'text-sm')}>
          {fallbackText}
        </span>
      )}
    </div>
  );
}
