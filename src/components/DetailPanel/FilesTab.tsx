import { Component, For, Show, createSignal } from 'solid-js';
import { Torrent } from '../../types/transmission';
import { formatBytes, formatPercent } from '../../utils/format';
import { rpcCall } from '../../api/rpc';
import { fetchTorrents } from '../../store/torrentStore';
import { t } from '../../utils/i18n';
import { showToast } from '../../utils/toast';

export const FilesTab: Component<{ torrent: Torrent }> = (props) => {
  const [updatingId, setUpdatingId] = createSignal<number | null>(null);
  const [editingIdx, setEditingIdx] = createSignal<number | null>(null);
  const [newName, setNewName] = createSignal('');
  const [renaming, setRenaming] = createSignal(false);

  const saveRename = async (oldPath: string) => {
    const val = newName().trim();
    if (!val || val === oldPath) {
      setEditingIdx(null);
      return;
    }

    setRenaming(true);
    try {
      await rpcCall('torrent_rename_path', {
        ids: [props.torrent.id],
        path: oldPath,
        name: val,
      });
      await fetchTorrents(true);
      setEditingIdx(null);
    } catch (e) {
      console.error('Failed to rename path', e);
      showToast(t('dialog.rename.failed'), 'error');
    } finally {
      setRenaming(false);
    }
  };

  // Toggle file wanted/unwanted checkbox
  const toggleWanted = async (index: number, currentWanted: boolean) => {
    setUpdatingId(index);
    try {
      await rpcCall('torrent_set', {
        ids: [props.torrent.id],
        [currentWanted ? 'files_unwanted' : 'files_wanted']: [index],
      });
      await fetchTorrents(true);
    } catch (e) {
      console.error('Failed to set file priority', e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Set individual file priority
  const setPriority = async (index: number, priority: number) => {
    setUpdatingId(index);
    try {
      const args: Record<string, any> = { ids: [props.torrent.id] };
      if (priority === 1) {
        args['priority_high'] = [index];
      } else if (priority === -1) {
        args['priority_low'] = [index];
      } else {
        args['priority_normal'] = [index];
      }
      await rpcCall('torrent_set', args);
      await fetchTorrents(true);
    } catch (e) {
      console.error('Failed to set file priority', e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div class="trwm-files-tab">
      <div class="files-table-container">
        <table class="files-table">
          <thead>
            <tr>
              <th width="40"></th>
              <th>{t('columns.name')}</th>
              <th width="90">{t('columns.size')}</th>
              <th width="120">{t('columns.progress')}</th>
              <th width="160">{t('detail.settings.priority')}</th>
            </tr>
          </thead>
          <tbody>
            <Show
              when={props.torrent.files && props.torrent.files.length > 0}
              fallback={
                <tr>
                  <td colspan="5" class="empty-row">
                    {t('status.no_files')}
                  </td>
                </tr>
              }
            >
              <For each={props.torrent.files}>
                {(file, idx) => {
                  const stats = () => props.torrent.file_stats?.[idx()];
                  const isWanted = () => stats()?.wanted ?? true;
                  const priority = () => stats()?.priority ?? 0;
                  const progress = () => file.length > 0 ? (stats()?.bytes_completed ?? 0) / file.length : 0;

                  return (
                    <tr class={isWanted() ? '' : 'file-unwanted'}>
                      <td class="text-center">
                        <input
                          type="checkbox"
                          checked={isWanted()}
                          disabled={updatingId() === idx()}
                          onChange={() => toggleWanted(idx(), isWanted())}
                        />
                      </td>
                      <td class="selectable-text file-name-cell" title={file.name}>
                        <Show
                          when={editingIdx() === idx()}
                          fallback={
                            <div class="file-name-row flex-row align-center justify-between">
                              <span class="file-name-text">{file.name}</span>
                              <button
                                type="button"
                                class="file-rename-btn"
                                onClick={() => {
                                  setEditingIdx(idx());
                                  setNewName(file.name);
                                }}
                              >
                                ✏️
                              </button>
                            </div>
                          }
                        >
                          <div class="file-rename-editor flex-row align-center gap-2">
                            <input
                              type="text"
                              class="inline-rename-input"
                              value={newName()}
                              onInput={(e) => setNewName(e.currentTarget.value)}
                              disabled={renaming()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRename(file.name);
                                if (e.key === 'Escape') setEditingIdx(null);
                              }}
                            />
                            <button
                              type="button"
                              class="trwm-btn-sm"
                              disabled={renaming()}
                              onClick={() => saveRename(file.name)}
                            >
                              💾
                            </button>
                            <button
                              type="button"
                              class="trwm-btn-sm"
                              disabled={renaming()}
                              onClick={() => setEditingIdx(null)}
                            >
                              ✕
                            </button>
                          </div>
                        </Show>
                      </td>
                      <td class="text-mono text-right">{formatBytes(file.length)}</td>
                      <td>
                        <div class="file-progress-container">
                          <div class="file-progress-bar">
                            <div
                              class="file-progress-fill"
                              style={{
                                width: `${progress() * 100}%`,
                                'background-color': isWanted()
                                  ? 'var(--color-primary-500)'
                                  : 'var(--text-muted)',
                              }}
                            />
                          </div>
                          <span class="file-progress-text text-mono">
                            {formatPercent(progress())}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div class="priority-btn-group">
                          <button
                            class={`priority-btn low ${priority() === -1 ? 'active' : ''}`}
                            disabled={updatingId() === idx()}
                            onClick={() => setPriority(idx(), -1)}
                          >
                            {t('detail.settings.priority_low')}
                          </button>
                          <button
                            class={`priority-btn normal ${priority() === 0 ? 'active' : ''}`}
                            disabled={updatingId() === idx()}
                            onClick={() => setPriority(idx(), 0)}
                          >
                            {t('detail.settings.priority_normal')}
                          </button>
                          <button
                            class={`priority-btn high ${priority() === 1 ? 'active' : ''}`}
                            disabled={updatingId() === idx()}
                            onClick={() => setPriority(idx(), 1)}
                          >
                            {t('detail.settings.priority_high')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }}
              </For>
            </Show>
          </tbody>
        </table>
      </div>

      <style>{`
        .trwm-files-tab {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .files-table-container {
          flex: 1;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .files-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }
        .files-table th {
          background-color: var(--bg-secondary);
          color: var(--text-secondary);
          font-weight: 600;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-color);
          user-select: none;
        }
        .files-table td {
          padding: 6px 12px;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }
        .files-table tbody tr:hover {
          background-color: var(--bg-hover);
        }
        .file-unwanted {
          opacity: 0.6;
        }
        .file-name-cell {
          word-break: break-all;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .empty-row {
          text-align: center;
          color: var(--text-muted);
          padding: 24px !important;
        }
        .file-progress-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .file-progress-bar {
          flex: 1;
          height: 6px;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        .file-progress-fill {
          height: 100%;
          border-radius: var(--radius-sm);
        }
        .file-progress-text {
          min-width: 45px;
          text-align: right;
          font-size: 11px;
        }
        .priority-btn-group {
          display: flex;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          overflow: hidden;
          width: fit-content;
        }
        .priority-btn {
          border: none;
          background: var(--bg-primary);
          color: var(--text-secondary);
          font-size: 11px;
          padding: 3px 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.15s ease;
        }
        .priority-btn:not(:last-child) {
          border-right: 1px solid var(--border-color);
        }
        .priority-btn:hover:not(:disabled) {
          background-color: var(--bg-hover);
          color: var(--text-primary);
        }
        .priority-btn.active {
          color: #ffffff !important;
        }
        .priority-btn.low.active {
          background-color: var(--text-muted);
        }
        .priority-btn.normal.active {
          background-color: var(--color-primary-500);
        }
        .priority-btn.high.active {
          background-color: var(--color-success-500);
        }
        .priority-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        
        /* Inline renaming styles */
        .file-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 6px;
        }
        .file-name-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        .file-rename-btn {
          opacity: 0;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          padding: 2px;
          border-radius: var(--radius-xs);
          transition: all 0.15s ease;
        }
        tr:hover .file-rename-btn {
          opacity: 0.7;
        }
        .file-rename-btn:hover {
          opacity: 1 !important;
          background-color: var(--bg-hover);
        }
        .file-rename-editor {
          display: flex;
          align-items: center;
          gap: 4px;
          width: 100%;
        }
        .inline-rename-input {
          flex: 1;
          background-color: var(--bg-primary) !important;
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 3px 6px !important;
          font-size: 12px;
          outline: none;
          width: 0; /* allows flex basis to compress */
        }
        .inline-rename-input:focus {
          border-color: var(--color-primary-500) !important;
        }
      `}</style>
    </div>
  );
};
