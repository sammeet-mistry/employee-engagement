import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

const API_URL = '/api/feedback';
const ADMIN_URL = '/api/admin';

export const submitFeedback = createAsyncThunk(
  'feedback/submit',
  async (feedbackData, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, feedbackData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Unable to generate an AI reply.');
    }
  }
);

export const fetchMyFeedback = createAsyncThunk(
  'feedback/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/my`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Unable to load your feedback.');
    }
  }
);

export const fetchMyFeedbackWithReplies = createAsyncThunk(
  'feedback/fetchMyWithReplies',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/my-with-replies`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Unable to load your feedback.');
    }
  }
);

export const fetchAllFeedback = createAsyncThunk(
  'feedback/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const response = await axios.get(`${API_URL}?${queryString}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Unable to load feedback.');
    }
  }
);

export const updateFeedbackStatus = createAsyncThunk(
  'feedback/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/${id}/status`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const updateFeedbackAssignment = createAsyncThunk(
  'feedback/updateAssignment',
  async ({ id, assignedTo }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/${id}/assignment`, { assignedTo });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Unable to update feedback assignment.');
    }
  }
);

export const deleteFeedback = createAsyncThunk(
  'feedback/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const generateAIReply = createAsyncThunk(
  'feedback/generateAI',
  async (feedbackId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${ADMIN_URL}/generate-ai-reply/${feedbackId}`, {});
      return { feedbackId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Unable to generate an AI reply.');
    }
  }
);

export const approveAndSendReply = createAsyncThunk(
  'feedback/approveReply',
  async ({ replyId, finalReply }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${ADMIN_URL}/approve-reply/${replyId}`, { finalReply });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const fetchFeedbackStats = createAsyncThunk(
  'feedback/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${ADMIN_URL}/stats`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState: {
    myFeedback: [],
    myFeedbackPagination: { page: 1, limit: 10, total: 0, totalPages: 0, summary: { total: 0, inReview: 0, responded: 0 } },
    allFeedback: [],
    allFeedbackPagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
    stats: {},
    loading: false,
    error: null,
    fetchError: null,
    myFeedbackRequestId: null,
    allFeedbackRequestId: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.loading = false;
        state.myFeedback.unshift(action.payload);
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyFeedback.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.fetchError = null;
        state.myFeedbackRequestId = action.meta.requestId;
      })
      .addCase(fetchMyFeedback.fulfilled, (state, action) => {
        if (state.myFeedbackRequestId === action.meta.requestId) {
          state.loading = false;
          state.error = null;
          state.fetchError = null;
          state.myFeedback = action.payload.items;
          state.myFeedbackPagination = action.payload.pagination;
          state.myFeedbackRequestId = null;
        }
      })
      .addCase(fetchMyFeedback.rejected, (state, action) => {
        if (state.myFeedbackRequestId === action.meta.requestId) {
          state.loading = false;
          state.error = action.payload;
          state.fetchError = action.payload;
          state.myFeedbackRequestId = null;
        }
      })
      .addCase(fetchMyFeedbackWithReplies.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.fetchError = null;
        state.myFeedbackRequestId = action.meta.requestId;
      })
      .addCase(fetchMyFeedbackWithReplies.fulfilled, (state, action) => {
        if (state.myFeedbackRequestId === action.meta.requestId) {
          state.loading = false;
          state.error = null;
          state.fetchError = null;
          state.myFeedback = action.payload.items;
          state.myFeedbackPagination = action.payload.pagination;
          state.myFeedbackRequestId = null;
        }
      })
      .addCase(fetchMyFeedbackWithReplies.rejected, (state, action) => {
        if (state.myFeedbackRequestId === action.meta.requestId) {
          state.loading = false;
          state.error = action.payload;
          state.fetchError = action.payload;
          state.myFeedbackRequestId = null;
        }
      })
      .addCase(fetchAllFeedback.pending, (state, action) => {
        state.loading = true;
        state.allFeedbackRequestId = action.meta.requestId;
      })
      .addCase(fetchAllFeedback.fulfilled, (state, action) => {
        if (state.allFeedbackRequestId === action.meta.requestId) {
          state.loading = false;
          state.allFeedback = action.payload.items;
          state.allFeedbackPagination = action.payload.pagination;
          state.allFeedbackRequestId = null;
        }
      })
      .addCase(fetchAllFeedback.rejected, (state, action) => {
        if (state.allFeedbackRequestId === action.meta.requestId) {
          state.loading = false;
          state.error = action.payload;
          state.allFeedbackRequestId = null;
        }
      })
      .addCase(updateFeedbackStatus.fulfilled, (state, action) => {
        const index = state.allFeedback.findIndex(fb => fb._id === action.payload._id);
        if (index !== -1) {
          state.allFeedback[index] = action.payload;
        }
      })
      .addCase(updateFeedbackAssignment.fulfilled, (state, action) => {
        const index = state.allFeedback.findIndex(fb => fb._id === action.payload._id);
        if (index !== -1) {
          state.allFeedback[index] = action.payload;
        }
      })
      .addCase(deleteFeedback.fulfilled, (state, action) => {
        state.allFeedback = state.allFeedback.filter(fb => fb._id !== action.payload);
      })
      .addCase(fetchFeedbackStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearError } = feedbackSlice.actions;
export default feedbackSlice.reducer;