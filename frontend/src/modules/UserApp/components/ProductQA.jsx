import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiSend } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { useAuthStore } from '../../../shared/store/authStore';
import toast from 'react-hot-toast';

const ProductQA = ({ productId }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [answeringId, setAnsweringId] = useState(null);
  const [newAnswer, setNewAnswer] = useState('');

  const { isAuthenticated, user, isVendor } = useAuthStore();

  useEffect(() => {
    fetchQuestions();
  }, [productId]);

  const fetchQuestions = async () => {
    try {
      const { data } = await api.get(`/products/${productId}/questions`);
      if (data.success) {
        setQuestions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    try {
      const { data } = await api.post('/user/questions', { productId, question: newQuestion });
      if (data.success) {
        toast.success('Question posted!');
        setNewQuestion('');
        fetchQuestions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post question');
    }
  };

  const handleAnswerQuestion = async (e, questionId) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;
    try {
      const endpoint = isVendor ? `/vendor/questions/${questionId}/answer` : `/user/questions/${questionId}/answer`;
      const { data } = await api.post(endpoint, { answer: newAnswer });
      if (data.success) {
        toast.success('Answer posted!');
        setNewAnswer('');
        setAnsweringId(null);
        fetchQuestions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post answer');
    }
  };

  if (loading) {
    return <div className="text-gray-500 text-sm py-4">Loading Q&A...</div>;
  }

  return (
    <div className="mt-4 mb-4" id="qa-section">
      <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FiMessageSquare className="text-[#F5A623]" /> Community Q&A
      </h3>

      {isAuthenticated ? (
        <form onSubmit={handleAskQuestion} className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Have a question? Ask the community</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="What would you like to know about this product?"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-saffron focus:border-transparent text-sm"
            />
            <button
              type="submit"
              disabled={!newQuestion.trim()}
              className="px-6 py-3 bg-brand-navy text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              Post <FiSend size={14} />
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-600">
          Please log in to ask or answer a question.
        </div>
      )}

      {questions.length > 0 ? (
        <div className="space-y-6">
          {questions.map((q) => (
            <div key={q._id} className="border-b border-gray-100 pb-6 last:border-0">
              <div className="mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blackLight text-[#F5A623] flex items-center justify-center font-bold text-sm shrink-0 mt-1">
                    Q
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base leading-snug">{q.question}</h4>
                    <p className="text-xs text-gray-500 mt-1">Asked by {q.userName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pl-11">
                {q.answers && q.answers.map((a) => (
                  <div key={a._id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">{a.userName}</span>
                      {a.userType === 'vendor' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-navy text-white rounded-full uppercase tracking-wider">Seller</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-800 rounded-full uppercase tracking-wider">Buyer</span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{a.answer}</p>
                  </div>
                ))}

                {isAuthenticated && answeringId !== q._id && (
                  <button
                    onClick={() => setAnsweringId(q._id)}
                    className="text-xs font-semibold text-[#F5A623] hover:text-[#F5A623]Dark underline"
                  >
                    Add an answer
                  </button>
                )}

                {answeringId === q._id && (
                  <form onSubmit={(e) => handleAnswerQuestion(e, q._id)} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Write your answer..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-saffron text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!newAnswer.trim()}
                      className="px-4 py-2 bg-black text-white rounded-md font-semibold text-xs hover:bg-blackDark transition-colors disabled:opacity-50"
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAnsweringId(null); setNewAnswer(''); }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold text-xs hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No questions have been asked yet. Be the first!</p>
      )}
    </div>
  );
};

export default ProductQA;
