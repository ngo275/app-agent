import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import CharacterCount from '@/components/common/character-count';

interface LocalizationFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  multiline?: boolean;
  characterLimit?: number;
  hasChanged?: boolean;
  originalValue?: string | null;
}

export default function LocalizationField({
  label,
  value,
  onChange,
  multiline = false,
  characterLimit,
  hasChanged = false,
  originalValue,
}: LocalizationFieldProps) {
  const currentLength = (value || '').length;

  // Determine rows based on character limit
  const getRows = () => {
    if (!characterLimit) return 4; // default
    if (characterLimit <= 170) return 2; // promotional text
    if (characterLimit >= 4000) return 8; // description
    return 4; // other cases
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <div className="flex items-center space-x-2">
          {characterLimit && (
            <CharacterCount current={currentLength} limit={characterLimit} />
          )}
          {hasChanged && originalValue && (
            <span className="text-xs text-muted-foreground">
              Current: {originalValue.slice(0, 30)}
              {originalValue.length > 30 ? '...' : ''}
            </span>
          )}
        </div>
      </div>
      {multiline ? (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={hasChanged ? 'border-yellow-400 bg-yellow-50' : ''}
          rows={getRows()}
        />
      ) : (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={hasChanged ? 'border-yellow-400 bg-yellow-50' : ''}
        />
      )}
    </div>
  );
}
