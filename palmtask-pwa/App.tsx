
import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import BottomNav from './components/BottomNav';
import { ViewType, Task, NonBuyer, TaskSkuMap, ProductImage, ImageMap, Consultant } from './types';
import { 
  saveTasksToDB, getTasksFromDB, 
  saveNonBuyersToDB, getNonBuyersFromDB,
  saveSkuMapToDB, getSkuMapFromDB,
  saveProductImagesToDB, getProductImagesFromDB,
  saveConsultantsToDB, getConsultantsFromDB
} from './db';

// Lazy Load Views to reduce initial bundle size
const LoginView = lazy(() => import('./views/LoginView'));
const HomeView = lazy(() => import('./views/HomeView'));
const TasksView = lazy(() => import('./views/TasksView'));
const TaskDetailView = lazy(() => import('./views/TaskDetailView'));
const PerformanceView = lazy(() => import('./views/PerformanceView'));
const NonBuyersView = lazy(() => import('./views/NonBuyersView'));
const ProfileView = lazy(() => import('./views/ProfileView'));

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8fNDpYBDVzD5I6fU1PHKTyIL13-Rebtkk03TknNutnS-6O49QI2nzm8OHsXtKtE1Kuyw3ULlzXXXJ/pub?output=csv';
const NON_BUYERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8fNDpYBDVzD5I6fU1PHKTyIL13-Rebtkk03TknNutnS-6O49QI2nzm8OHsXtKtE1Kuyw3ULlzXXXJ/pub?gid=1974384197&single=true&output=csv';
const SKU_MAP_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8fNDpYBDVzD5I6fU1PHKTyIL13-Rebtkk03TknNutnS-6O49QI2nzm8OHsXtKtE1Kuyw3ULlzXXXJ/pub?gid=52566647&single=true&output=csv';
const PRODUCT_IMG_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8fNDpYBDVzD5I6fU1PHKTyIL13-Rebtkk03TknNutnS-6O49QI2nzm8OHsXtKtE1Kuyw3ULlzXXXJ/pub?gid=746952367&single=true&output=csv';
// URL Atualizada com o GID correto da aba de Consultores (1774643875)
const CONSULTANTS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8fNDpYBDVzD5I6fU1PHKTyIL13-Rebtkk03TknNutnS-6O49QI2nzm8OHsXtKtE1Kuyw3ULlzXXXJ/pub?gid=1774643875&single=true&output=csv';

const SECTOR_KEY = 'palmtask_user_sector';
const LAST_SYNC_KEY = 'palmtask_last_sync';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ViewType>(ViewType.HOME);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  
  const [allNonBuyers, setAllNonBuyers] = useState<NonBuyer[]>([]);
  const [filteredNonBuyers, setFilteredNonBuyers] = useState<NonBuyer[]>([]);

  // Raw Data
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  // Optimized Lookup Map
  const [imageMap, setImageMap] = useState<ImageMap>({});

  // Consultants
  const [allConsultants, setAllConsultants] = useState<Consultant[]>([]);

  const [userSector, setUserSector] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [isSyncing, setIsSyncing] = useState<boolean>(false); 
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');

    const savedSector = localStorage.getItem(SECTOR_KEY);
    const savedSync = localStorage.getItem(LAST_SYNC_KEY);
    
    if (savedSync) setLastSyncTime(savedSync);

    loadFromLocalDB().then((hasData) => {
        if (savedSector) {
            setUserSector(savedSector);
            setIsLoggedIn(true);
        }
    });

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- OPTIMIZATION: Build Image Map once ---
  const buildOptimizedImageMap = (images: ProductImage[]) => {
      const map: ImageMap = {};
      images.forEach(img => {
          map[img.id] = img.imageUrl;
          map[img.normalizedName] = img.imageUrl;
      });
      setImageMap(map);
  };

  const loadFromLocalDB = async () => {
    try {
      setIsLoading(true);
      const [tasks, nonBuyers, cachedSkuMap, cachedImgs, cachedConsultants] = await Promise.all([
        getTasksFromDB(),
        getNonBuyersFromDB(),
        getSkuMapFromDB(),
        getProductImagesFromDB(),
        getConsultantsFromDB()
      ]);

      if (tasks.length > 0) {
          setAllTasks(tasks);
          processTasksInMemory(tasks, nonBuyers, cachedSkuMap);
      }
      if (nonBuyers.length > 0) setAllNonBuyers(nonBuyers);
      if (cachedImgs.length > 0) {
          setProductImages(cachedImgs);
          buildOptimizedImageMap(cachedImgs);
      }
      if (cachedConsultants.length > 0) {
          setAllConsultants(cachedConsultants);
      }
      
      setIsLoading(false);
      return tasks.length > 0;
    } catch (e) {
      console.error('Failed to load cached data', e);
      setIsLoading(false);
      return false;
    }
  };

  // --- CSV Parsers ---
  const parseGenericCSV = (csvText: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentVal = '';
    let inQuote = false;
    const len = csvText.length;
    
    for (let i = 0; i < len; i++) {
      const char = csvText[i];
      
      if (char === '"') {
        if (inQuote && csvText[i+1] === '"') {
          currentVal += '"';
          i++; 
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        currentRow.push(currentVal);
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuote) {
        if (char === '\r' && csvText[i+1] === '\n') i++; 
        currentRow.push(currentVal);
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentRow.length > 0) {
      currentRow.push(currentVal);
      rows.push(currentRow);
    }
    return rows;
  };

  const parseTaskCSV = (csvText: string): Task[] => {
    const rows = parseGenericCSV(csvText);
    return rows.slice(1).map((values, index) => {
      const coinsValue = parseInt(values[10]?.trim()) || 0;
      const mixStr = values[5]?.trim() || ''; 
      let boughtCount = 0;
      let mixTotal = 0;
      
      if (mixStr.indexOf('/') > -1) {
          const parts = mixStr.split('/');
          boughtCount = parseInt(parts[0]) || 0;
          mixTotal = parseInt(parts[1]) || 0;
      }
      const missingVal = parseInt(values[6]?.trim()) || 0;

      return {
        id: values[8]?.trim() || String(index), 
        title: values[3]?.trim() || 'PDV Desconhecido', 
        status: 'ACTIVE',
        dueTime: values[0]?.trim() || 'Hoje', 
        description: values[7]?.trim() || '', 
        sectorCode: values[1]?.trim() || '', 
        pdvCode: values[2]?.trim() || '', 
        pdvName: values[3]?.trim() || 'PDV Desconhecido',
        cluster: values[4]?.trim() || 'Outros',
        coins: coinsValue, 
        category: values[11]?.trim() || 'Geral', 
        subject: values[12]?.trim() || 'Outros', 
        operation: values[9]?.trim() || 'Geral', 
        hashId: values[8]?.trim() || '',
        flagScore: values[13]?.trim() || 'Não',
        priority: coinsValue >= 100 ? 'HIGH' : 'NORMAL',
        boughtCount: boughtCount,
        mixTotal: mixTotal,
        missingCount: missingVal
      };
    });
  };

  const parseNonBuyersCSV = (csvText: string): NonBuyer[] => {
    const rows = parseGenericCSV(csvText);
    const result: NonBuyer[] = [];
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        if (values.length >= 3) {
            const pdvCode = values[1]?.trim();
            if (pdvCode) {
                result.push({
                    sector: values[0]?.trim(),
                    pdvCode: pdvCode,
                    fantasyName: values[2]?.trim(),
                    lastVisit: values[3]?.trim(),
                    normalizedCode: pdvCode.replace(/[.\s]/g, '') 
                });
            }
        }
    }
    return result;
  };

  const parseSkuMapCSV = (csvText: string): TaskSkuMap[] => {
    const rows = parseGenericCSV(csvText);
    const result: TaskSkuMap[] = [];
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        if (values.length >= 2) {
            const hashId = values[0]?.trim();
            const skusString = values[1]?.trim();
            if (hashId && skusString) {
                const skuList = skusString.split(',').map(s => s.trim()).filter(Boolean);
                result.push({
                    hashId: hashId,
                    skus: skuList
                });
            }
        }
    }
    return result;
  };

  const parseProductImagesCSV = (csvText: string): ProductImage[] => {
    const rows = parseGenericCSV(csvText);
    const result: ProductImage[] = [];
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        if (values.length >= 3) {
            const name = values[1]?.trim();
            const url = values[2]?.trim();
            const id = values[0]?.trim() || String(i);
            
            if (name && url) {
                const norm = name.toLowerCase()
                  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^\w\s]/gi, '');

                result.push({
                    id: id,
                    name: name,
                    imageUrl: url,
                    normalizedName: norm
                });
            }
        }
    }
    return result;
  };

  const parseConsultantsCSV = (csvText: string): Consultant[] => {
    const rows = parseGenericCSV(csvText);
    const result: Consultant[] = [];
    // Columns based on sample: ID (0), SETOR (1), SENHA (2), IMAGEM (3), NOME (4)
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        if (values.length >= 5) {
            const id = values[0]?.trim();
            const sector = values[1]?.trim();
            const name = values[4]?.trim();
            const avatar = values[3]?.trim();
            const pass = values[2]?.trim() || '';

            if (id && sector) {
                const validAvatar = (avatar && avatar.length > 10 && !avatar.includes('SEM FOTO')) ? avatar : '';
                result.push({
                    id,
                    sector,
                    name,
                    avatarUrl: validAvatar,
                    pass
                });
            }
        }
    }
    return result;
  };

  const processTasksInMemory = (tasks: Task[], nonBuyers: NonBuyer[], skuMapData: TaskSkuMap[]) => {
    const nonBuyerSet = new Set(nonBuyers.map(nb => nb.normalizedCode));
    const skuMapLookup = new Map(skuMapData.map(item => [item.hashId, item.skus]));
    
    const processedTasks = tasks.map(t => {
        const normPdv = t.pdvCode.replace(/[.\s]/g, '');
        const associatedSkus = skuMapLookup.get(t.hashId) || [];
        
        return {
            ...t,
            isNonBuyer: nonBuyerSet.has(normPdv),
            associatedSkus: associatedSkus
        };
    });
    setAllTasks(processedTasks);
  };

  const performSync = async () => {
    if (!navigator.onLine) {
        alert("Você precisa estar online para realizar a carga de dados.");
        return;
    }

    setIsSyncing(true);
    try {
      setSyncMessage('Conectando...');
      
      const [tasksRes, nonBuyersRes, skuMapRes, imgRes, consRes] = await Promise.all([
          fetch(SHEET_URL),
          fetch(NON_BUYERS_SHEET_URL),
          fetch(SKU_MAP_SHEET_URL),
          fetch(PRODUCT_IMG_SHEET_URL),
          fetch(CONSULTANTS_SHEET_URL)
      ]);

      if(!tasksRes.ok) throw new Error("Erro tasks");

      setSyncMessage('Baixando dados...');
      const [tasksText, nbText, skuText, imgText, consText] = await Promise.all([
          tasksRes.text(),
          nonBuyersRes.text(),
          skuMapRes.text(),
          imgRes.text(),
          consRes.text()
      ]);

      setSyncMessage('Processando...');
      const tasksData = parseTaskCSV(tasksText);
      const nonBuyersData = parseNonBuyersCSV(nbText);
      const skuMapData = parseSkuMapCSV(skuText);
      const imgData = parseProductImagesCSV(imgText);
      const consData = parseConsultantsCSV(consText);

      setSyncMessage('Salvando imagens...');
      const consDataWithImages = await Promise.all(consData.map(async (c) => {
        if (c.avatarUrl && c.avatarUrl.startsWith('http')) {
            try {
                const response = await fetch(c.avatarUrl, { mode: 'cors' });
                if (response.ok) {
                    const blob = await response.blob();
                    return new Promise<Consultant>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            resolve({ ...c, avatarBase64: reader.result as string });
                        };
                        reader.onerror = () => resolve(c);
                        reader.readAsDataURL(blob);
                    });
                }
            } catch (e) {
                console.warn(`Could not cache image for ${c.name} (CORS or Error)`);
            }
        }
        return c;
      }));

      setSyncMessage('Salvando offline...');
      await Promise.all([
          saveTasksToDB(tasksData),
          saveNonBuyersToDB(nonBuyersData),
          saveSkuMapToDB(skuMapData),
          saveProductImagesToDB(imgData),
          saveConsultantsToDB(consDataWithImages) 
      ]);

      setAllNonBuyers(nonBuyersData);
      setProductImages(imgData);
      setAllConsultants(consDataWithImages);
      buildOptimizedImageMap(imgData);
      processTasksInMemory(tasksData, nonBuyersData, skuMapData);

      const now = new Date().toLocaleString('pt-BR');
      setLastSyncTime(now);
      localStorage.setItem(LAST_SYNC_KEY, now);

      setSyncMessage('Pronto!');
      await new Promise(r => setTimeout(r, 500)); 

    } catch (error) {
      console.error('Sync error:', error);
      alert('Erro ao realizar a carga. Verifique sua conexão.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter Tasks by Sector
  useEffect(() => {
    if (userSector) {
      const filtered = allTasks.filter(t => t.sectorCode.trim() === userSector.trim());
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks([]);
    }
  }, [userSector, allTasks]);

  // Filter Non-Buyers by Sector
  useEffect(() => {
    if (userSector) {
        const filteredNB = allNonBuyers.filter(nb => nb.sector.trim() === userSector.trim());
        setFilteredNonBuyers(filteredNB);
    } else {
        setFilteredNonBuyers([]);
    }
  }, [userSector, allNonBuyers]);

  // Current Consultant Logic
  const currentConsultant = useMemo(() => {
      return allConsultants.find(c => c.sector.trim() === userSector.trim());
  }, [allConsultants, userSector]);

  // LOGIN LOGIC START
  
  // Check if password is required for this sector (Works Offline)
  const isPasswordRequired = (sector: string): boolean => {
      const consultant = allConsultants.find(c => c.sector.trim() === sector.trim());
      return !!consultant && !!consultant.pass && consultant.pass.trim().length > 0;
  };

  // Perform Login (Works Offline)
  const handleLoginAttempt = async (sector: string, password?: string): Promise<boolean> => {
      const consultant = allConsultants.find(c => c.sector.trim() === sector.trim());
      
      // If consultant has a password, check it
      if (consultant && consultant.pass && consultant.pass.trim().length > 0) {
          if (password !== consultant.pass) {
              return false; // Password mismatch
          }
      }

      // Success
      setUserSector(sector);
      localStorage.setItem(SECTOR_KEY, sector); 
      
      // Try to sync in background if online, otherwise skip
      if (navigator.onLine) {
          await performSync();
      }
      
      setIsLoggedIn(true);
      return true;
  };
  // LOGIN LOGIC END

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserSector('');
    localStorage.removeItem(SECTOR_KEY);
    setActiveTab(ViewType.HOME);
    setSelectedTaskId(null);
  };

  const handleManualSync = () => {
      performSync();
  };

  const handleTabChange = (tab: ViewType) => { setActiveTab(tab); setSelectedTaskId(null); };
  const handleTaskClick = (taskId: string) => { setSelectedTaskId(taskId); };
  const handleTaskBack = () => { setSelectedTaskId(null); };
  
  const handleViewPdvTasks = (pdvName: string) => {
    sessionStorage.setItem('palmtask_cluster', 'Todos');
    sessionStorage.setItem('palmtask_category', 'Todos');
    sessionStorage.setItem('palmtask_subject', 'Todos');
    sessionStorage.setItem('palmtask_score', 'Todos');
    sessionStorage.setItem('palmtask_search', pdvName);
    sessionStorage.setItem('palmtask_isOpen', 'false'); 
    setSelectedTaskId(null);
    setActiveTab(ViewType.TASKS);
  };

  const handleViewSimilarTasks = (task: Task) => {
    sessionStorage.setItem('palmtask_cluster', task.cluster);
    sessionStorage.setItem('palmtask_category', task.category);
    sessionStorage.setItem('palmtask_subject', task.subject);
    sessionStorage.setItem('palmtask_search', '');
    sessionStorage.setItem('palmtask_isOpen', 'true');
    setSelectedTaskId(null);
    setActiveTab(ViewType.TASKS);
  };

  const handleSkuClick = (skuName: string) => {
      sessionStorage.setItem('palmtask_cluster', 'Todos');
      sessionStorage.setItem('palmtask_category', 'Todos');
      sessionStorage.setItem('palmtask_subject', 'Todos');
      sessionStorage.setItem('palmtask_score', 'Todos');
      sessionStorage.setItem('palmtask_search', skuName);
      sessionStorage.setItem('palmtask_isOpen', 'false');
      setSelectedTaskId(null);
      setActiveTab(ViewType.TASKS);
  };

  // Loading Screen for Suspense
  const PageLoader = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-light">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
    </div>
  );

  if (isSyncing) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 z-[100] relative">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="material-icons-round text-primary text-4xl">cloud_download</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Gerando Carga</h2>
            <p className="text-primary text-sm font-bold animate-pulse">{syncMessage}</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light relative">
       {isOffline && (
        <div className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest text-center py-1 absolute top-0 w-full z-[70] shadow-md">
          Modo Offline
        </div>
      )}
      
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
            {!isLoggedIn ? (
                <LoginView 
                    onLogin={handleLoginAttempt} 
                    checkPasswordRequired={isPasswordRequired}
                    isLoading={isSyncing} 
                />
            ) : (
                <>
                    {selectedTaskId ? (
                        (() => {
                            const task = filteredTasks.find(t => t.id === selectedTaskId);
                            return task ? (
                                <TaskDetailView 
                                    task={task} 
                                    onBack={handleTaskBack} 
                                    onViewPdvTasks={handleViewPdvTasks}
                                    onViewSimilarTasks={handleViewSimilarTasks}
                                    productImages={productImages}
                                    imageMap={imageMap} 
                                />
                            ) : null;
                        })()
                    ) : (
                        (() => {
                             if (isLoading && allTasks.length === 0) return <PageLoader />;
                             
                             switch (activeTab) {
                                case ViewType.HOME:
                                    return <HomeView tasks={filteredTasks} userSector={userSector} onRefresh={handleManualSync} onTaskClick={handleTaskClick} consultant={currentConsultant} />;
                                case ViewType.TASKS:
                                    return <TasksView tasks={filteredTasks} onTaskClick={handleTaskClick} productImages={productImages} imageMap={imageMap} />;
                                case ViewType.NON_BUYERS:
                                    return <NonBuyersView nonBuyers={filteredNonBuyers} userSector={userSector} />;
                                case ViewType.STATS:
                                    return <PerformanceView tasks={filteredTasks} nonBuyers={filteredNonBuyers} productImages={productImages} imageMap={imageMap} onSkuClick={handleSkuClick} />;
                                case ViewType.PROFILE:
                                    return <ProfileView onLogout={handleLogout} sector={userSector} onSync={handleManualSync} lastSync={lastSyncTime} consultant={currentConsultant} />;
                                default:
                                    return <HomeView tasks={filteredTasks} userSector={userSector} onRefresh={handleManualSync} onTaskClick={handleTaskClick} consultant={currentConsultant} />;
                            }
                        })()
                    )}
                </>
            )}
        </Suspense>
      </main>
      
      {isLoggedIn && !selectedTaskId && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
};

export default App;
