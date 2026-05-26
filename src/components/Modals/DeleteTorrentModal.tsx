import { Component, Show, createSignal } from 'solid-js';
import { closeDeleteModal, showDeleteModal } from '../../store/modalStore';
import { removeTorrents, selectedIds } from '../../store/torrentStore';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import { X } from 'lucide-solid';

export const DeleteTorrentModal: Component = () => {
  const [deleteData, setDeleteData] = createSignal(false);
  const [deleting, setDeleting] = createSignal(false);

  const count = () => selectedIds().length;

  const handleDelete = async (e: Event) => {
    e.preventDefault();
    if (count() === 0) return;

    setDeleting(true);
    try {
      await removeTorrents(selectedIds(), deleteData());
      closeDeleteModal();
      setDeleteData(false);
    } catch (err) {
      console.error('Failed to delete torrents', err);
      showToast(t('status.delete_failed'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Show when={showDeleteModal()}>
      <div class="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeDeleteModal}>
        <div class="bg-popover/90 backdrop-blur-xl border border-border w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          <div class="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-secondary/30 shrink-0">
            <h2 class="m-0 text-base font-bold text-foreground">{t('dialog.delete.title')}</h2>
            <button class="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" onClick={closeDeleteModal}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleDelete} class="flex flex-col">
            <div class="p-6 text-[13px] text-foreground leading-relaxed">
              <Show
                when={deleteData()}
                fallback={<p>{t('dialog.delete.confirm', { n: count() })}</p>}
              >
                <p class="text-danger font-semibold">
                  {t('dialog.delete.confirm_data', { n: count() })}
                </p>
              </Show>
            </div>

            <label class="flex items-center gap-2 px-6 pb-6 cursor-pointer text-[13px] group">
              <input
                type="checkbox"
                class="w-4 h-4 rounded border-border/80 text-destructive focus:ring-destructive/20 cursor-pointer"
                checked={deleteData()}
                onChange={(e) => setDeleteData(e.currentTarget.checked)}
                disabled={deleting()}
              />
              <span class="text-destructive font-medium group-hover:text-destructive/80 transition-colors">{t('dialog.delete.also_data')}</span>
            </label>

            <div class="flex justify-end gap-2 px-6 py-4 border-t border-border/50 bg-secondary/30 shrink-0">
              <button type="submit" class="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-xl text-[13px] font-bold shadow-lg shadow-destructive/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none" disabled={deleting()}>
                {deleting() ? t('common.loading') : t('dialog.delete.submit')}
              </button>
              <button type="button" class="bg-background border border-border/80 text-foreground hover:bg-muted px-4 py-2 rounded-xl text-[13px] font-medium shadow-sm transition-colors active:scale-[0.98] disabled:opacity-50" onClick={closeDeleteModal} disabled={deleting()}>
                {t('dialog.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
};
