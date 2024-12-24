'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface InputFieldProps<T> {
  label: string;
  field: keyof T;
  value: string | null;
  originalValue: string | null;
  onChange: (field: keyof T, value: string) => void;
  multiline?: boolean;
}

export default function InputField<T>({
  label,
  field,
  value,
  originalValue,
  onChange,
  multiline = false,
}: InputFieldProps<T>) {
  const hasChanged = originalValue !== value;

  return (
    <div className="relative space-y-2">
      <Label>{label}</Label>
      {multiline ? (
        <Textarea
          className={cn(hasChanged && 'border-yellow-400 bg-yellow-50')}
          value={value || ''}
          onChange={(e) => onChange(field, e.target.value)}
          rows={4}
        />
      ) : (
        <Input
          type="text"
          className={cn(hasChanged && 'border-yellow-400 bg-yellow-50')}
          value={value || ''}
          onChange={(e) => onChange(field, e.target.value)}
        />
      )}
      {hasChanged && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute right-2 top-8 h-2 w-2 rounded-full bg-yellow-400"
        />
      )}
    </div>
  );
}
