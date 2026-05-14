import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import feedbackReducer from './slices/feedbackSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    feedback: feedbackReducer,
  },
});

// Redux store types are not required in plain JavaScript build.
// If you add TypeScript support later, convert this file to .ts and restore these exports.
