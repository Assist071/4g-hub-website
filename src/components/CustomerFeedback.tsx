import { useState, useEffect } from 'react';
import { Feedback } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Star } from 'lucide-react';
import { useFeedbackDatabase } from '@/hooks/useFeedbackDatabase';

interface CustomerFeedbackProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerFeedback({ isOpen, onOpenChange }: CustomerFeedbackProps) {
  const { saveFeedback } = useFeedbackDatabase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [submittedFeedback, setSubmittedFeedback] = useState<Feedback | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    pcNumber: '',
    rating: 5,
    feedback: '',
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setShowForm(true);
      setSubmittedFeedback(null);
      setFormData({
        customerName: '',
        pcNumber: '',
        rating: 5,
        feedback: '',
      });
    }
  }, [isOpen]);

  const handleSubmitFeedback = async () => {
    if (!formData.customerName || !formData.pcNumber || !formData.feedback) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const newFeedback: Feedback = {
        id: '', // Will be set by database
        customerName: formData.customerName,
        email: formData.pcNumber, // Using email field to store PC Number
        rating: formData.rating,
        comment: formData.feedback, // Customer's feedback
        createdAt: new Date(),
        status: 'new',
      };

      const result = await saveFeedback(newFeedback);

      if (result.success) {
        // Show the submitted feedback
        setSubmittedFeedback({
          ...newFeedback,
          id: result.feedbackId!,
        });
        setShowForm(false);
      } else {
        alert('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Customer Feedback & Reviews
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Show submitted feedback confirmation */}
          {submittedFeedback && !showForm && (
            <Card className="border-green-500/30 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                  ✅ Feedback Submitted Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm font-bold text-gray-600 mb-1">Name:</p>
                  <p className="text-lg font-semibold text-foreground mb-4">{submittedFeedback.customerName}</p>

                  <p className="text-sm font-bold text-gray-600 mb-1">PC Number:</p>
                  <p className="text-lg font-semibold text-primary mb-4">{submittedFeedback.email}</p>

                  <p className="text-sm font-bold text-gray-600 mb-2">Your Rating:</p>
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= submittedFeedback.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-sm font-bold text-gray-600 mb-1">Your Feedback:</p>
                  <p className="text-base text-muted-foreground whitespace-pre-wrap border-l-4 border-primary pl-4 py-2">
                    {submittedFeedback.comment}
                  </p>

                  <p className="text-xs text-gray-500 mt-4">
                    Submitted: {new Date(submittedFeedback.createdAt).toLocaleString()}
                  </p>
                </div>

                <Button
                  onClick={() => onOpenChange(false)}
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                >
                  Done
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Feedback Form */}
          {showForm && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Enter Your Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Your Name *</Label>
                  <Input
                    placeholder="Enter your name"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label className="mb-2 block">PC Number *</Label>
                  <Input
                    placeholder="e.g., PC-01, PC-12, Terminal-05"
                    value={formData.pcNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, pcNumber: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label className="mb-3 block">Rate Your Experience *</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="transition-all hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= formData.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    You rated: {formData.rating} star{formData.rating !== 1 ? 's' : ''}
                  </p>
                </div>

                <div>
                  <Label className="mb-2 block">Your Feedback *</Label>
                  <Textarea
                    placeholder="Share your feedback, suggestions, or comments..."
                    value={formData.feedback}
                    onChange={(e) =>
                      setFormData({ ...formData, feedback: e.target.value })
                    }
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={isSubmitting}
                    className="flex-1 gap-2"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                  <Button
                    onClick={() => onOpenChange(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
