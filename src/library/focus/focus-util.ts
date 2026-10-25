/** True when focus is inside any text input, textarea, contenteditable, matrix/array cell, note body, or sketch caption. */
export function isEditingTextField(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return false;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return true;
  if (el.closest('[data-cell-input]')) return true;
  if (el.matches('textarea.note-ta')) return true;
  if (el.closest('[data-caption-editor]')) return true;
  return false;
}

/** Shell modals (auto-create, dimensions) — structure paste must not steal ⌘V here. */
export function isInAppModalField(): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return false;
  return Boolean(el.closest('[data-app-modal]'));
}
