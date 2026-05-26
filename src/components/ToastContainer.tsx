import { Component } from 'solid-js';
import { Toast } from '@kobalte/core/toast';

export const ToastContainer: Component = () => {
  return (
    <Toast.Region>
      <Toast.List class="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 max-w-[400px] outline-none" />
    </Toast.Region>
  );
};
