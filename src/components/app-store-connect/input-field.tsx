'use client';

import { motion } from 'framer-motion';

interface InputFieldProps<T> {
  label: string;
  field: keyof T;
  value: string | null;
  originalValue: string | null;
  onChange: (field: keyof T, value: string) => void;
  multiline?: boolean;
}

export function InputField<T>({
  label,
  field,
  value,
  originalValue,
  onChange,
  multiline = false,
}: InputFieldProps<T>) {
  const hasChanged = originalValue !== value;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
            ${hasChanged ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
          value={value || ''}
          onChange={(e) => onChange(field, e.target.value)}
          rows={4}
        />
      ) : (
        <input
          type="text"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
            ${hasChanged ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
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
