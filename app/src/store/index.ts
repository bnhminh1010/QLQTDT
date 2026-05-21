import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    // thêm slice reducer ở đây
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
