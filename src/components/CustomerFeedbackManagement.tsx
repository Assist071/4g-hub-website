import { useState, useEffect } from 'react';
import { Feedback } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, CheckCircle2, Archive, MessageCircle, Eye, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFeedbackDatabase } from '@/hooks/useFeedbackDatabase';

export function CustomerFeedbackManagement() {
  const { fetchAllFeedbacks, updateFeedbackStatus, deleteFeedback } = useFeedbackDatabase();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'reviewed' | 'archived'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load feedbacks from database
  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setIsLoading(true);
    const result = await fetchAllFeedbacks();
    if (result.success) {
      setFeedbacks(result.feedbacks);
    }
    setIsLoading(false);
  };

  const handleMarkAsReviewed = async (id: string) => {
    const result = await updateFeedbackStatus(id, 'reviewed');
    if (result.success) {
      setFeedbacks(feedbacks.map((f) =>
        f.id === id ? { ...f, status: 'reviewed' as const } : f
      ));
    }
  };

  const handleArchive = async (id: string) => {
    const result = await updateFeedbackStatus(id, 'archived');
    if (result.success) {
      setFeedbacks(feedbacks.map((f) =>
        f.id === id ? { ...f, status: 'archived' as const } : f
      ));
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteFeedback(id);
    if (result.success) {
      setFeedbacks(feedbacks.filter((f) => f.id !== id));
      setIsDeleteOpen(false);
      setSelectedFeedback(null);
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filterStatus === 'all') return true;
    return f.status === filterStatus;
  });

  const stats = {
    total: feedbacks.length,
    new: feedbacks.filter((f) => f.status === 'new').length,
    reviewed: feedbacks.filter((f) => f.status === 'reviewed').length,
    archived: feedbacks.filter((f) => f.status === 'archived').length,
    avgRating:
      feedbacks.length > 0
        ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
        : 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 font-ethnocentric neon-glow">
          Customer Feedback Management
        </h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="tech-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm font-ethnocentric">Total Feedbacks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="tech-card border-yellow-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-ethnocentric">New</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-500">{stats.new}</p>
          </CardContent>
        </Card>

        <Card className="tech-card border-green-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-ethnocentric">Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{stats.reviewed}</p>
          </CardContent>
        </Card>

        <Card className="tech-card border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-ethnocentric">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">{stats.archived}</p>
          </CardContent>
        </Card>

        <Card className="tech-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm font-ethnocentric">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{stats.avgRating} ⭐</p>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="new">New ({stats.new})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed ({stats.reviewed})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({stats.archived})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          <FeedbackList
            feedbacks={feedbacks.filter((f) => f.status !== 'archived')}
            onMarkAsReviewed={handleMarkAsReviewed}
            onArchive={handleArchive}
            onDelete={(f) => {
              setSelectedFeedback(f);
              setIsDeleteOpen(true);
            }}
            onView={(f) => {
              setSelectedFeedback(f);
              setIsViewOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="new" className="space-y-4 mt-4">
          <FeedbackList
            feedbacks={feedbacks.filter((f) => f.status === 'new')}
            onMarkAsReviewed={handleMarkAsReviewed}
            onArchive={handleArchive}
            onDelete={(f) => {
              setSelectedFeedback(f);
              setIsDeleteOpen(true);
            }}
            onView={(f) => {
              setSelectedFeedback(f);
              setIsViewOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4 mt-4">
          <FeedbackList
            feedbacks={feedbacks.filter((f) => f.status === 'reviewed')}
            onMarkAsReviewed={handleMarkAsReviewed}
            onArchive={handleArchive}
            onDelete={(f) => {
              setSelectedFeedback(f);
              setIsDeleteOpen(true);
            }}
            onView={(f) => {
              setSelectedFeedback(f);
              setIsViewOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="archived" className="space-y-4 mt-4">
          <FeedbackList
            feedbacks={feedbacks.filter((f) => f.status === 'archived')}
            onMarkAsReviewed={handleMarkAsReviewed}
            onArchive={handleArchive}
            onDelete={(f) => {
              setSelectedFeedback(f);
              setIsDeleteOpen(true);
            }}
            onView={(f) => {
              setSelectedFeedback(f);
              setIsViewOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="tech-card border-primary/30">
          <AlertDialogTitle className="font-ethnocentric neon-glow">
            Delete Feedback?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            This action cannot be undone. The feedback will be permanently deleted.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end pt-4">
            <AlertDialogCancel className="border-primary/30 hover:bg-primary/5 transition-colors">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedFeedback) {
                  handleDelete(selectedFeedback.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 transition-colors"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Feedback Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Customer Feedback Details
            </DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs font-bold text-muted-foreground mb-1">Customer Name</p>
                  <p className="text-lg font-bold">{selectedFeedback.customerName}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs font-bold text-muted-foreground mb-1">PC Number</p>
                  <p className="text-lg font-bold text-primary">{selectedFeedback.email}</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3">FEEDBACK MESSAGE:</p>
                <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedFeedback.comment}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-bold text-yellow-700 dark:text-yellow-300 mb-2">CUSTOMER RATING:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        star <= selectedFeedback.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 font-semibold">
                  {selectedFeedback.rating} out of 5 stars
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge variant={selectedFeedback.status === 'new' ? 'destructive' : selectedFeedback.status === 'reviewed' ? 'default' : 'secondary'}>
                    {selectedFeedback.status}
                  </Badge>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Submitted Date</p>
                  <p className="font-semibold">{new Date(selectedFeedback.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <Button onClick={() => setIsViewOpen(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FeedbackListProps {
  feedbacks: Feedback[];
  onMarkAsReviewed: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (feedback: Feedback) => void;
  onView: (feedback: Feedback) => void;
}

function FeedbackList({
  feedbacks,
  onMarkAsReviewed,
  onArchive,
  onDelete,
  onView,
}: FeedbackListProps) {
  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No feedback found in this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <Card key={feedback.id} className="border-muted-foreground/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold">{feedback.customerName}</h3>
                    <Badge
                      variant={
                        feedback.status === 'new'
                          ? 'destructive'
                          : feedback.status === 'reviewed'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {feedback.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(feedback.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {feedback.email && (
                <p className="text-sm text-primary">
                  PC Number: <span className="text-muted-foreground font-bold">{feedback.email}</span>
                </p>
              )}

              <div className="flex gap-2 pt-3 border-t border-muted-foreground/10">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => onView(feedback)}
                >
                  <Eye className="h-4 w-4" />
                  View Message
                </Button>

                {feedback.status === 'new' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => onMarkAsReviewed(feedback.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Reviewed
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => onArchive(feedback.id)}
                  disabled={feedback.status === 'archived'}
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => onDelete(feedback)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
