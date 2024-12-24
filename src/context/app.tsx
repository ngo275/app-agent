import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { localStorageUtil, StorageKey } from '@/lib/utils/storage';
import { useGetApps } from '@/lib/swr/app';
import { App } from '@/types/aso';

interface AppContextProps {
  children: React.ReactNode;
}

export type AppContextType = {
  apps: App[];
  currentApp: App | null;
  isLoading: boolean;
  setCurrentApp: (app: App) => void;
  refresh: () => Promise<void>;
};

const initialState: AppContextType = {
  apps: [],
  currentApp: null,
  isLoading: false,
  setCurrentApp: (app: App) => {},
  refresh: async () => {},
};

const AppContext = createContext<AppContextType>(initialState);

export const AppProvider = ({ children }: AppContextProps): JSX.Element => {
  const [currentApp, setCurrentAppState] = useState<App | null>(null);
  const { apps, loading, refreshApps } = useGetApps();

  const setCurrentApp = useCallback((app: App) => {
    setCurrentAppState(app);
    localStorageUtil.set(StorageKey.SelectedApp, app.id);
  }, []);

  const savedAppId = localStorageUtil.get(StorageKey.SelectedApp, null);

  const value = useMemo(
    () => ({
      apps: apps || [],
      currentApp:
        (apps || []).find((app: App) => app.id === savedAppId) ||
        (apps || [])[0],
      // NOTE: apps === undefined is a workaround for the initial loading state.
      isLoading: loading || apps === undefined,
      setCurrentApp,
      refresh: refreshApps,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apps, currentApp, loading, setCurrentApp, savedAppId, refreshApps]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
