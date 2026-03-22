import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem('gym_user') || 'null'),
  token: localStorage.getItem('gym_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('gym_user',  JSON.stringify(user));
    localStorage.setItem('gym_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('gym_user');
    localStorage.removeItem('gym_token');
    set({ user: null, token: null });
  },

  updateUser: (updates) =>
    set((state) => {
      const updated = { ...state.user, ...updates };
      localStorage.setItem('gym_user', JSON.stringify(updated));
      return { user: updated };
    }),
}));

export default useAuthStore;
