import { Component, createSignal, Show } from 'solid-js';
import {
  selectedIds,
  startTorrents,
  startNowTorrents,
  pauseTorrents,
  reannounceTorrents,
  verifyTorrents,
  moveQueueUp,
  moveQueueDown,
  moveQueueTop,
  moveQueueBottom,
  searchQuery,
  setSearchQuery,
  fetchTorrents
} from '../store/torrentStore';
import {
  openAddModal,
  openSettingsModal,
  openDeleteModal,
  openHistoryModal,
  openStatsModal
} from '../store/modalStore';
import { t, currentLang, setLanguage, type LanguageType } from '../utils/i18n';
import { Button, type ButtonProps } from './ui/button';
import { cn } from '../lib/utils';
import {
  Plus,
  Play,
  ChevronsRight,
  Pause,
  RefreshCcw,
  CheckCircle2,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Search,
  X,
  RefreshCw,
  Sidebar as SidebarIcon,
  PanelRight,
  Moon,
  Sun,
  Activity,
  History,
  Settings
} from 'lucide-solid';

const ToolBtn: Component<ButtonProps> = (props) => (
  <Button 
    variant="ghost" 
    size="sm" 
    class={cn("h-8 px-2 text-muted-foreground hover:text-foreground", props.class)} 
    {...props} 
  />
);

const IconBtn: Component<ButtonProps> = (props) => (
  <Button 
    variant="ghost" 
    size="icon" 
    class={cn("h-8 w-8 text-muted-foreground hover:text-foreground", props.class)} 
    {...props} 
  />
);

const Separator: Component = () => <div class="w-px h-[18px] bg-border mx-1 opacity-60" />;

export const Toolbar: Component<{
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  detailOpen: boolean;
  onToggleDetail: () => void;
}> = (props) => {
  const hasSelection = () => selectedIds().length > 0;

  const getInitialTheme = (): 'light' | 'dark' => {
    const stored = localStorage.getItem('trwm-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [theme, setTheme] = createSignal<'light' | 'dark'>(getInitialTheme());

  document.documentElement.setAttribute('data-theme', theme());

  const toggleTheme = () => {
    const next = theme() === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('trwm-theme', next);
  };

  const toggleLanguage = () => {
    const next: LanguageType = currentLang() === 'zh-CN' ? 'en' : 'zh-CN';
    setLanguage(next);
  };

  return (
    <div class="flex items-center gap-0.5 w-full h-full bg-background border-b border-border select-none px-1.5 overflow-x-auto no-scrollbar">
      {/* Add torrent button */}
      <ToolBtn class="text-success hover:text-success hover:bg-success/10" onClick={openAddModal} title={t('toolbar.add')}>
        <Plus size={16} stroke-width={2.5} class="mr-1.5" />
        <span class="font-semibold text-xs hidden md:inline">{t('toolbar.add')}</span>
      </ToolBtn>

      <Separator />

      {/* Control buttons */}
      <IconBtn disabled={!hasSelection()} onClick={() => startTorrents()} title={t('toolbar.start')} class="hover:text-success hover:bg-success/10">
        <Play size={16} stroke-width={2.5} class={hasSelection() ? "text-success" : ""} />
      </IconBtn>
      <IconBtn disabled={!hasSelection()} onClick={() => startNowTorrents()} title={t('toolbar.start_now')} class="hover:text-success hover:bg-success/10">
        <ChevronsRight size={16} stroke-width={2.5} class={hasSelection() ? "text-success" : ""} />
      </IconBtn>
      <IconBtn disabled={!hasSelection()} onClick={() => pauseTorrents()} title={t('toolbar.pause')} class="hover:text-warning hover:bg-warning/10">
        <Pause size={16} stroke-width={2.5} class={hasSelection() ? "text-warning" : ""} />
      </IconBtn>
      <IconBtn disabled={!hasSelection()} onClick={() => reannounceTorrents()} title={t('toolbar.reannounce')} class="hover:text-primary hover:bg-primary/10">
        <RefreshCcw size={16} stroke-width={2.5} class={hasSelection() ? "text-primary" : ""} />
      </IconBtn>
      <IconBtn disabled={!hasSelection()} onClick={() => verifyTorrents()} title={t('toolbar.verify')} class="hover:text-success hover:bg-success/10">
        <CheckCircle2 size={16} stroke-width={2.5} class={hasSelection() ? "text-success" : ""} />
      </IconBtn>
      <IconBtn disabled={!hasSelection()} onClick={openDeleteModal} title={t('toolbar.remove')} class="hover:text-destructive hover:bg-destructive/10">
        <Trash2 size={16} stroke-width={2.5} class={hasSelection() ? "text-destructive" : ""} />
      </IconBtn>

      <Separator />

      {/* Queue buttons */}
      <IconBtn disabled={!hasSelection()} onClick={() => moveQueueUp()} title={t('toolbar.queue_up')}>
        <ChevronUp size={16} stroke-width={2.5} />
      </IconBtn>
      <IconBtn disabled={!hasSelection()} onClick={() => moveQueueDown()} title={t('toolbar.queue_down')}>
        <ChevronDown size={16} stroke-width={2.5} />
      </IconBtn>
      <IconBtn disabled={!hasSelection()} onClick={() => moveQueueTop()} title={t('toolbar.queue_top')}>
        <ChevronsUp size={16} stroke-width={2.5} />
      </IconBtn>
      <IconBtn disabled={!hasSelection()} onClick={() => moveQueueBottom()} title={t('toolbar.queue_bottom')}>
        <ChevronsDown size={16} stroke-width={2.5} />
      </IconBtn>

      <div class="flex-1" />

      {/* Search Box */}
      <div class="group relative flex items-center bg-secondary border border-border rounded-md px-2 h-8 w-32 md:w-44 transition-all duration-200 focus-within:w-40 md:focus-within:w-60 focus-within:border-primary focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20">
        <Search size={14} class="text-muted-foreground shrink-0 transition-colors group-focus-within:text-primary" />
        <input
          type="text"
          class="bg-transparent border-none text-foreground text-xs w-full h-full outline-none pl-2 placeholder:text-muted-foreground/70"
          placeholder={t('toolbar.search_placeholder')}
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
        />
        <Show when={searchQuery()}>
          <button class="absolute right-1.5 w-4 h-4 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" onClick={() => setSearchQuery('')}>
            <X size={12} stroke-width={3} />
          </button>
        </Show>
      </div>

      <Separator />

      {/* Global Actions */}
      <IconBtn onClick={() => fetchTorrents(true)} title={t('toolbar.refresh')}>
        <RefreshCw size={16} stroke-width={2.5} class="text-primary" />
      </IconBtn>
      <IconBtn class={props.sidebarOpen ? "bg-muted text-foreground" : ""} onClick={props.onToggleSidebar} title={t('toolbar.sidebar_toggle')}>
        <SidebarIcon size={16} stroke-width={2.5} />
      </IconBtn>
      <IconBtn class={props.detailOpen ? "bg-muted text-foreground" : ""} onClick={props.onToggleDetail} title={t('toolbar.detail_toggle')}>
        <PanelRight size={16} stroke-width={2.5} />
      </IconBtn>
      <IconBtn onClick={toggleLanguage} title={t('toolbar.switch_lang')}>
        <span class="text-[11px] font-bold tracking-wide">{t('toolbar.lang_label')}</span>
      </IconBtn>
      <IconBtn onClick={toggleTheme} title={t('toolbar.theme')}>
        <Show when={theme() === 'light'} fallback={<Sun size={16} stroke-width={2.5} />}>
          <Moon size={16} stroke-width={2.5} />
        </Show>
      </IconBtn>
      
      <Separator />
      
      <IconBtn onClick={openStatsModal} title={t('toolbar.stats')}>
        <Activity size={16} stroke-width={2.5} class="text-purple-500" />
      </IconBtn>
      <IconBtn onClick={openHistoryModal} title={t('toolbar.history')}>
        <History size={16} stroke-width={2.5} class="text-primary" />
      </IconBtn>
      <IconBtn onClick={openSettingsModal} title={t('toolbar.settings')}>
        <Settings size={16} stroke-width={2.5} />
      </IconBtn>
    </div>
  );
};
