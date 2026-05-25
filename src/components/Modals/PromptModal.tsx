import { Component, Show, createSignal, createEffect } from 'solid-js';
import { t } from '../../utils/i18n';

interface PromptModalProps {
  open: boolean;
  title: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: 'text' | 'number';
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const PromptModal: Component<PromptModalProps> = (props) => {
  const [value, setValue] = createSignal('');

  createEffect(() => {
    if (props.open) {
      setValue(props.defaultValue || '');
    }
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const v = value().trim();
    if (v.length > 0) {
      props.onConfirm(v);
    }
  };

  return (
    <Show when={props.open}>
      <div class="trwm-modal-overlay" onClick={props.onCancel}>
        <div class="trwm-modal-box" style={{ 'min-width': '360px' }} onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <h3>{props.title}</h3>
            <button class="close-btn" onClick={props.onCancel}>✕</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div class="modal-form" style={{ padding: '16px 20px' }}>
              <Show when={props.label}>
                <label style={{ 'font-size': '13px', 'font-weight': '500', 'margin-bottom': '6px', display: 'block' }}>{props.label}</label>
              </Show>
              <input
                type={props.inputType || 'text'}
                class="form-input"
                placeholder={props.placeholder || ''}
                value={value()}
                onInput={(e) => setValue(e.currentTarget.value)}
                autofocus
                style={{ width: '100%' }}
              />
            </div>
            <div class="modal-footer">
              <button type="button" class="trwm-btn" onClick={props.onCancel}>{t('dialog.cancel')}</button>
              <button type="submit" class="trwm-btn primary">{t('dialog.ok')}</button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
};
