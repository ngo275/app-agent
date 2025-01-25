import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiSearch } from 'react-icons/fi';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Competitor } from '@/types/aso';
import { searchCompetitors } from '@/lib/swr/aso';
import { useTeam } from '@/context/team';
import { LocaleCode } from '@/lib/utils/locale';
import { cn } from '@/lib/utils';
import { AppStoreApp } from '@/types/app-store';
import { toast } from 'react-hot-toast';

interface CompetitorListProps {
  appId: string;
  locale: LocaleCode;
  competitors: Competitor[];
  onAdd: (app: Partial<AppStoreApp>) => Promise<void>;
  onDelete: (appId: string) => Promise<void>;
  isLoading?: boolean;
}

export default function CompetitorList({
  appId,
  locale,
  competitors,
  onAdd,
  onDelete,
  isLoading = false,
}: CompetitorListProps) {
  const t = useTranslations('aso');
  const teamInfo = useTeam();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Partial<AppStoreApp>[]>(
    []
  );
  const [isSearching, setIsSearching] = useState(false);
  const [addingCompetitorId, setAddingCompetitorId] = useState<string | null>(
    null
  );
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !searchTerm.trim() ||
      isLoading ||
      isSearching ||
      !teamInfo?.currentTeam?.id
    )
      return;

    try {
      setIsSearching(true);
      const results = await searchCompetitors(
        teamInfo.currentTeam?.id || '',
        appId,
        locale,
        searchTerm.trim(),
        'APPSTORE',
        'IOS'
      );
      setSearchResults(results);
    } catch (error) {
      toast.error(t('failed-to-search-competitors'));
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setSearchTerm('');
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        clearSearch();
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        clearSearch();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleAddCompetitor = async (competitor: Partial<AppStoreApp>) => {
    if (!competitor.id) return;
    if (competitors.some((c) => c.competitorId === competitor.id)) {
      toast.success(t('competitor-already-added'));
      return;
    }

    try {
      setAddingCompetitorId(competitor.id);
      await onAdd(competitor);
      // clearSearch();
      toast.success(t('competitor-added-successfully'));
    } catch (error) {
      toast.error(t('failed-to-add-competitor'));
    } finally {
      setAddingCompetitorId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative" ref={searchRef}>
        <form onSubmit={handleSearch} className="flex gap-2 p-1">
          <Input
            placeholder={t('search-more-competitors')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading || isSearching}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                clearSearch();
              }
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || isSearching || !searchTerm.trim()}
            variant="secondary"
          >
            <FiSearch className="h-4 w-4 mr-2" />
            {t('search')}
          </Button>
        </form>

        {searchResults.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg">
            <div className="p-2 max-h-[300px] overflow-y-auto">
              <div className="space-y-1">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleAddCompetitor(result)}
                    disabled={isLoading || addingCompetitorId === result.id}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors',
                      'text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                      (isLoading || addingCompetitorId === result.id) &&
                        'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {result.icon && (
                      <Image
                        src={result.icon}
                        alt={result.title || ''}
                        width={32}
                        height={32}
                        className="rounded-lg flex-shrink-0"
                        unoptimized
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{result.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {t('reviews', {
                          reviews: result.reviews?.toLocaleString() || 0,
                        })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {addingCompetitorId === result.id ? (
                        <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <FiPlus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {competitors.map((competitor) => (
              <motion.div
                key={competitor.competitorId}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div className="flex items-center justify-between gap-4 p-3 bg-card rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {competitor.iconUrl && (
                      <Image
                        src={competitor.iconUrl}
                        alt={competitor.title}
                        width={40}
                        height={40}
                        className="rounded-lg"
                        unoptimized
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {competitor.title}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {t('reviews', {
                          reviews: competitor.reviews.toLocaleString(),
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(competitor.id)}
                      disabled={isLoading}
                    >
                      <FiX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {competitors.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              {t('no-competitors-yet')}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
