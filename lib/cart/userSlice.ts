import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  customer_id: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  profile_pic?: string;
  whatsapp?: string;
  remarks?: string;
  order_record?: any;
  created_at?: string;
  updated_at?: string;
  dob?: string;
}

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserLoading(state) {
      state.loading = true;
      state.error = null;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    setUserError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    clearUser(state) {
      state.user = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setUserLoading, setUser, setUserError, clearUser } = userSlice.actions;
export default userSlice.reducer;