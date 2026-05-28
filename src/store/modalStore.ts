import { createSignal } from 'solid-js';

// Modal open/close signals
export const [showAddModal, setShowAddModal] = createSignal(false);
export const [showSettingsModal, setShowSettingsModal] = createSignal(false);
export const [showDeleteModal, setShowDeleteModal] = createSignal(false);
export const [showHistoryModal, setShowHistoryModal] = createSignal(false);
export const [showStatsModal, setShowStatsModal] = createSignal(false);
export const [showTrackerAggregatorModal, setShowTrackerAggregatorModal] = createSignal(false);

// Global actions
export const openAddModal = () => setShowAddModal(true);
export const closeAddModal = () => setShowAddModal(false);

export const openSettingsModal = () => setShowSettingsModal(true);
export const closeSettingsModal = () => setShowSettingsModal(false);

export const openDeleteModal = () => setShowDeleteModal(true);
export const closeDeleteModal = () => setShowDeleteModal(false);

export const openHistoryModal = () => setShowHistoryModal(true);
export const closeHistoryModal = () => setShowHistoryModal(false);

export const openStatsModal = () => setShowStatsModal(true);
export const closeStatsModal = () => setShowStatsModal(false);

export const openTrackerAggregatorModal = () => setShowTrackerAggregatorModal(true);
export const closeTrackerAggregatorModal = () => setShowTrackerAggregatorModal(false);

// Global drag and drop file state
export const [droppedFiles, setDroppedFiles] = createSignal<File[]>([]);
export const [prefilledUrls, setPrefilledUrls] = createSignal<string>('');

