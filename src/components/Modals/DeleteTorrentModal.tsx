import { Component, Show, createSignal } from 'solid-js';
import { closeDeleteModal, showDeleteModal } from '../../store/modalStore';
import { removeTorrents, selectedIds } from '../../store/torrentStore';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';
import './Modals.css';

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
      <div class="trwm-modal-overlay" onClick={closeDeleteModal}>
        <div class="trwm-modal-box" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <h2>{t('dialog.delete.title')}</h2>
            <button class="close-btn" onClick={closeDeleteModal}>×</button>
          </div>

          <form onSubmit={handleDelete} class="modal-form">
            <div class="confirm-message">
              <Show
                when={deleteData()}
                fallback={<p>{t('dialog.delete.confirm', { n: count() })}</p>}
              >
                <p class="text-danger font-semibold">
                  {t('dialog.delete.confirm_data', { n: count() })}
                </p>
              </Show>
            </div>

            <label class="checkbox-label delete-data-checkbox">
              <input
                type="checkbox"
                checked={deleteData()}
                onChange={(e) => setDeleteData(e.currentTarget.checked)}
                disabled={deleting()}
              />
              <span class="text-danger">{t('dialog.delete.also_data')}</span>
            </label>

            <div class="modal-footer">
              <button type="submit" class="trwm-btn danger" disabled={deleting()}>
                {deleting() ? t('common.loading') : t('dialog.delete.submit')}
              </button>
              <button type="button" class="trwm-btn" onClick={closeDeleteModal} disabled={deleting()}>
                {t('dialog.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
};
