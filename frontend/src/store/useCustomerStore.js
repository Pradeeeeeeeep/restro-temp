import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCustomerStore = create(
  persist(
    (set) => ({
      customer: null,       // { id, name, phone }
      lastOrderId: null,    // most recent order after checkout
      setCustomer: (customer) => set({ customer }),
      clearCustomer: () => set({ customer: null, lastOrderId: null }),
      setLastOrderId: (id) => set({ lastOrderId: id }),
    }),
    { name: 'cafe-customer' }
  )
);

export default useCustomerStore;
