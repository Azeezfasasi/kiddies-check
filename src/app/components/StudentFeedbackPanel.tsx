"use client";

import { useState, useEffect } from "react";
import { X, Send, Loader, MessageSquare, User, Calendar, AlertCircle, Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function StudentFeedbackPanel({
  studentId,
  studentName,
  schoolId,
  userId,
  initialFeedback = [],
  feedbackLoading = false,
  onClose,
}) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [loading, setLoading] = useState(feedbackLoading);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState({});
  const [replyText, setReplyText] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});

  useEffect(() => {
    if (!feedbackLoading && initialFeedback.length === 0) {
      fetchFeedback();
    } else {
      setFeedback(initialFeedback);
    }
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/teacher/feedback?studentId=${studentId}&schoolId=${schoolId}`,
        {
          headers: { "x-user-id": userId },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter your comment");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/teacher/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          schoolId,
          studentId,
          title: "Parent Feedback",
          comment: newComment,
          category: "general",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const data = await response.json();
      setFeedback([data.feedback, ...feedback]);
      setNewComment("");
      setShowCommentForm(false);
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (feedbackId) => {
    if (!replyText[feedbackId]?.trim()) {
      toast.error("Please enter your reply");
      return;
    }

    try {
      setSubmittingReply({ ...submittingReply, [feedbackId]: true });
      const response = await fetch(
        `/api/teacher/feedback/${feedbackId}?schoolId=${schoolId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            action: "add-reply",
            reply: {
              comment: replyText[feedbackId],
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add reply");
      }

      const data = await response.json();
      
      // Update feedback with new reply
      setFeedback(feedback.map(f => f._id === feedbackId ? data.feedback : f));
      setReplyText({ ...replyText, [feedbackId]: "" });
      toast.success("Reply added successfully");
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error(error.message);
    } finally {
      setSubmittingReply({ ...submittingReply, [feedbackId]: false });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const categoryColors = {
    academic: "bg-blue-100 text-blue-800",
    behavior: "bg-orange-100 text-orange-800",
    attendance: "bg-red-100 text-red-800",
    personal: "bg-purple-100 text-purple-800",
    health: "bg-green-100 text-green-800",
    general: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Feedback & Comments</h2>
            <p className="text-sm text-gray-600 mt-1">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Comment Button */}
          <button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 py-3 rounded-lg transition-colors font-medium border border-blue-200"
          >
            <Plus className="w-5 h-5" />
            Add Your Comment
          </button>

          {/* Comment Form */}
          {showCommentForm && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts, questions, or concerns about your child's progress..."
                rows={4}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCommentForm(false)}
                  className="flex-1 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader className="w-4 h-4 animate-spin" />}
                  Submit Comment
                </button>
              </div>
            </div>
          )}

          {/* Feedback List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No feedback yet</p>
              <p className="text-sm text-gray-500 mt-1">Teachers and school staff will share feedback here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div
                  key={item._id}
                  className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Feedback Item Header */}
                  <div
                    onClick={() =>
                      setExpandedFeedback({
                        ...expandedFeedback,
                        [item._id]: !expandedFeedback[item._id],
                      })
                    }
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {item.author ? (
                            <>
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {item.author.firstName?.charAt(0)}{item.author.lastName?.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-800">{item.author.firstName} {item.author.lastName}</p>
                                <p className="text-xs text-gray-600 capitalize">{item.authorRole}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                ?
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-800">Unknown Author</p>
                                <p className="text-xs text-gray-600 capitalize">{item.authorRole}</p>
                              </div>
                            </>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-800 mb-2 truncate">{item.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{item.comment}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {item.category && (
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${categoryColors[item.category]}`}
                          >
                            {item.category}
                          </span>
                        )}
                        {item.rating && (
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-lg ${star <= item.rating ? "text-yellow-400" : "text-gray-300"}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedFeedback[item._id] && (
                    <div className="p-4 bg-gray-50 space-y-4 border-t">
                      {/* Full Comment */}
                      <div>
                        <p className="text-sm text-gray-600 mb-2 font-medium">Full Feedback</p>
                        <p className="text-gray-800 text-sm leading-relaxed">{item.comment}</p>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.createdAt)}
                        </div>
                      </div>

                      {/* Replies */}
                      {item.replies && item.replies.length > 0 && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <p className="text-sm font-semibold text-gray-700">Replies ({item.replies.length})</p>
                          {item.replies.map((reply) => (
                            <div key={reply._id} className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                              <div className="flex items-start gap-2 mb-2">
                                <User className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm text-gray-800">
                                    {reply.author?.firstName} {reply.author?.lastName}
                                  </p>
                                  <p className="text-xs text-gray-600 capitalize">{reply.authorRole}</p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700">{reply.comment}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(reply.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Form */}
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <p className="text-sm font-semibold text-gray-700">Add a Reply</p>
                        <textarea
                          value={replyText[item._id] || ""}
                          onChange={(e) => setReplyText({ ...replyText, [item._id]: e.target.value })}
                          placeholder="Write your reply..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                        />
                        <button
                          onClick={() => handleReply(item._id)}
                          disabled={submittingReply[item._id] || !replyText[item._id]?.trim()}
                          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 font-medium text-sm"
                        >
                          {submittingReply[item._id] && <Loader className="w-4 h-4 animate-spin" />}
                          <Send className="w-4 h-4" />
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
