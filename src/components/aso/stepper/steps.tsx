import { MdLanguage, MdTrendingUp, MdRocket } from 'react-icons/md';
import { LocalizationEditMode } from '@/types/aso';

export type Step = {
  mode: LocalizationEditMode | null;
  title: string;
  description: string;
  icon: JSX.Element;
};

export const steps: Step[] = [
  {
    mode: null,
    title: 'choose-your-action',
    description: 'choose-your-action-description',
    icon: <MdLanguage className="w-8 h-8" />,
  },
  {
    mode: LocalizationEditMode.IMPROVE_ASO,
    title: 'improve-aso',
    description: 'improve-aso-description',
    icon: <MdTrendingUp className="w-8 h-8" />,
  },
  {
    mode: LocalizationEditMode.QUICK_RELEASE,
    title: 'write-release-notes',
    description: 'write-release-notes-description',
    icon: <MdRocket className="w-8 h-8" />,
  },
];
