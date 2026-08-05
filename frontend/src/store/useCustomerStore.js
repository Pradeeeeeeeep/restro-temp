import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCustomerStore = create(
  persist(
    (set) => ({
      customer: null,  // { id, name, phone }
      setCustomer: (customer) => set({ customer }),
      clearCustomer: () => set({ customer: null }),
    }),
    { name: 'cafe-customer' }
  )
);

export default useCustomerStore;
