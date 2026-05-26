import { Component, Show, createSignal } from 'solid-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { closeDeleteModal, showDeleteModal } from '../../store/modalStore';
import { removeTorrents, selectedIds } from '../../store/torrentStore';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import { Checkbox } from '../ui/checkbox';

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

  const handleOpenChange = (open: boolean) => {
    if (!open && !deleting()) {
      closeDeleteModal();
    }
  };

  return (
    <Dialog open={showDeleteModal()} onOpenChange={handleOpenChange}>
      <DialogContent class="p-0 overflow-hidden sm:rounded-3xl max-w-md border-border bg-popover/90 backdrop-blur-xl shadow-2xl">
        <DialogHeader class="px-6 py-4 border-b border-border/50 bg-secondary/30 shrink-0">
          <DialogTitle>{t('dialog.delete.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleDelete} class="flex flex-col">
          <div class="p-6">
            <DialogDescription class="text-[13px] text-foreground leading-relaxed m-0">
              <Show
                when={deleteData()}
                fallback={<p>{t('dialog.delete.confirm', { n: count() })}</p>}
              >
                <p class="text-danger font-semibold">
                  {t('dialog.delete.confirm_data', { n: count() })}
                </p>
              </Show>
            </DialogDescription>
          </div>

          <label class="flex items-center gap-2 px-6 pb-6 cursor-pointer text-[13px] group">
            <Checkbox
              class="text-destructive data-[checked]:bg-destructive data-[checked]:text-destructive-foreground border-destructive/80 focus-visible:ring-destructive/20"
              checked={deleteData()}
              onChange={(checked) => setDeleteData(checked)}
              disabled={deleting()}
            />
            <span class="text-destructive font-medium group-hover:text-destructive/80 transition-colors">{t('dialog.delete.also_data')}</span>
          </label>

          <DialogFooter class="px-6 py-4 border-t border-border/50 bg-secondary/30 shrink-0 gap-2 sm:space-x-0">
            <button type="submit" class="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-xl text-[13px] font-bold shadow-lg shadow-destructive/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none" disabled={deleting()}>
              {deleting() ? t('common.loading') : t('dialog.delete.submit')}
            </button>
            <button type="button" class="bg-background border border-border/80 text-foreground hover:bg-muted px-4 py-2 rounded-xl text-[13px] font-medium shadow-sm transition-colors active:scale-[0.98] disabled:opacity-50" onClick={closeDeleteModal} disabled={deleting()}>
              {t('dialog.cancel')}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
