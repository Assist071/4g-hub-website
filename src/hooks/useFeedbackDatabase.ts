import { supabase } from '@/lib/supabase';
import { Feedback } from '@/types';

export function useFeedbackDatabase() {
  /**
   * Save a new feedback to the database
   */
  const saveFeedback = async (feedback: Feedback) => {
    try {
      const { data, error } = await supabase
        .from('customer_feedbacks')
        .insert([
          {
            customer_name: feedback.customerName,
            pc_number: feedback.email,
            feedback_message: feedback.comment,
            rating: feedback.rating,
            status: feedback.status,
            created_at: feedback.createdAt,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      console.log('Feedback saved successfully:', data.id);
      return { success: true, feedbackId: data.id, feedback: data };
    } catch (error) {
      console.error('Error saving feedback:', error);
      return { success: false, error };
    }
  };

  /**
   * Fetch all feedbacks
   */
  const fetchAllFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert database format to frontend format
      const feedbacks: Feedback[] = data.map((fb: any) => ({
        id: fb.id,
        customerName: fb.customer_name,
        email: fb.pc_number,
        rating: fb.rating,
        comment: fb.feedback_message,
        createdAt: new Date(fb.created_at),
        status: fb.status,
      }));

      return { success: true, feedbacks };
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      return { success: false, error, feedbacks: [] };
    }
  };

  /**
   * Fetch feedbacks by status
   */
  const fetchFeedbacksByStatus = async (status: 'new' | 'reviewed' | 'archived') => {
    try {
      const { data, error } = await supabase
        .from('customer_feedbacks')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const feedbacks: Feedback[] = data.map((fb: any) => ({
        id: fb.id,
        customerName: fb.customer_name,
        email: fb.pc_number,
        rating: fb.rating,
        comment: fb.feedback_message,
        createdAt: new Date(fb.created_at),
        status: fb.status,
      }));

      return { success: true, feedbacks };
    } catch (error) {
      console.error('Error fetching feedbacks by status:', error);
      return { success: false, error, feedbacks: [] };
    }
  };

  /**
   * Update feedback status in database
   */
  const updateFeedbackStatus = async (
    feedbackId: string,
    status: 'new' | 'reviewed' | 'archived'
  ) => {
    try {
      const { error } = await supabase
        .from('customer_feedbacks')
        .update({ status })
        .eq('id', feedbackId);

      if (error) throw error;

      console.log(`Feedback ${feedbackId} updated to ${status}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating feedback status:', error);
      return { success: false, error };
    }
  };

  /**
   * Delete feedback from database
   */
  const deleteFeedback = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from('customer_feedbacks')
        .delete()
        .eq('id', feedbackId);

      if (error) throw error;

      console.log('Feedback deleted:', feedbackId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting feedback:', error);
      return { success: false, error };
    }
  };

  /**
   * Subscribe to real-time feedbacks updates (optional)
   */
  const subscribeToFeedbacks = (callback: (payload: any) => void) => {
    // Note: Real-time subscriptions require additional setup
    // For now, use polling or manual refresh
    return null;
  };

  return {
    saveFeedback,
    fetchAllFeedbacks,
    fetchFeedbacksByStatus,
    updateFeedbackStatus,
    deleteFeedback,
    subscribeToFeedbacks,
  };
}
