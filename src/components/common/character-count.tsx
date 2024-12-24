import { cn } from '@/lib/utils';

interface CharacterCountProps {
  current: number;
  limit: number;
}

export default function CharacterCount({
  current,
  limit,
}: CharacterCountProps) {
  const percentage = (current / limit) * 100;
  const isOverLimit = percentage > 100;
  const isOptimal = percentage >= 90 && percentage <= 100;
  const isNearLimit = percentage >= 75 && percentage < 90;

  return (
    <span
      className={cn(
        'text-xs',
        isOverLimit && 'text-red-500 dark:text-red-400',
        isOptimal && 'text-green-500 dark:text-green-400',
        isNearLimit && 'text-yellow-500 dark:text-yellow-400',
        !isOverLimit && !isOptimal && !isNearLimit && 'text-muted-foreground'
      )}
    >
      {current}/{limit}
      {isOptimal && (
        <span className="ml-1" title="Optimal length">
          ✨
        </span>
      )}
    </span>
  );
}
