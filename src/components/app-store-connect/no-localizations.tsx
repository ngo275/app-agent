import { motion } from 'framer-motion';
import { MdLanguage } from 'react-icons/md';
import { useTranslations } from 'next-intl';

export function NoLocalizations() {
  const t = useTranslations('dashboard.app-store-connect.localization');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 rounded-xl p-8 text-center"
    >
      <MdLanguage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {t('no-localizations-found')}
      </h3>
      <p className="text-gray-500 max-w-md mx-auto">
        {t('localizations-not-configured')}
      </p>
    </motion.div>
  );
}
