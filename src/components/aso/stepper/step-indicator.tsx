import { motion } from 'framer-motion';
import { MdCheck } from 'react-icons/md';
import { cn } from '@/lib/utils';
import { Step } from './steps';

interface StepIndicatorProps {
  steps: Step[];
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;
}

export function StepIndicator({
  steps,
  currentStepIndex,
  setCurrentStepIndex,
}: StepIndicatorProps) {
  return (
    <motion.div
      className="flex items-center justify-center space-x-2 mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentStepIndex(index)}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer',
              index === currentStepIndex &&
                'bg-blue-500 text-white ring-4 ring-blue-100',
              index < currentStepIndex && 'bg-green-500 text-white',
              index > currentStepIndex &&
                'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            {index < currentStepIndex ? (
              <MdCheck className="w-5 h-5" />
            ) : (
              <span className="font-medium">{index + 1}</span>
            )}
          </motion.button>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-16 h-0.5 mx-2 transition-colors',
                index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </motion.div>
  );
}
