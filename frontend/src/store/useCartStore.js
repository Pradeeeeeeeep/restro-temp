import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Compute derived values after every mutation
const derived = (items) => ({
  total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  count: items.reduce((sum, i) => sum + i.quantity, 0),
});

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      count: 0,

      addItem: (item) => {
        const existing = get().items.find((i) => i.menuItemId === item.menuItemId);
        const newItems = existing
          ? get().items.map((i) =>
              i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
            )
          : [...get().items, { ...item, quantity: 1 }];
        set({ items: newItems, ...derived(newItems) });
      },

      removeItem: (menuItemId) => {
        const newItems = get().items.filter((i) => i.menuItemId !== menuItemId);
        set({ items: newItems, ...derived(newItems) });
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        const newItems = get().items.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity } : i
        );
        set({ items: newItems, ...derived(newItems) });
      },

      clearCart: () => set({ items: [], total: 0, count: 0 }),
    }),
    { name: 'cafe-cart' }
  )
);

export default useCartStore;
