import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AuthContext } from '../context/AuthContext';
import { getPosts, getComments, addComment, addReply } from '../services/api';
import { toast } from 'react-toastify';

// Định nghĩa base URL của backend
const BACKEND_BASE_URL = 'http://localhost:5000';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        setLoading(true);
        const postResponse = await getPosts();
        const selectedPost = postResponse.data.posts.find((p) => p.id === parseInt(id));
        if (!selectedPost) {
          navigate('/not-found');
          return;
        }
        setPost(selectedPost);

        const commentsResponse = await getComments(id);
        setComments(commentsResponse.data.comments || []);
      } catch (error) {
        console.error('[PostDetail] Lỗi khi lấy bài viết hoặc bình luận:', error);
        toast.error('Không thể tải bài viết');
      } finally {
        setLoading(false);
      }
    };
    fetchPostAndComments();
  }, [id, navigate]);

  const handleAddComment = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để bình luận');
      navigate('/dang-nhap');
      return;
    }
    if (!newComment.trim()) {
      toast.error('Vui lòng nhập nội dung bình luận');
      return;
    }

    try {
      await addComment(id, newComment);
      setNewComment('');
      const commentsResponse = await getComments(id);
      setComments(commentsResponse.data.comments || []);
      toast.success('Bình luận đã được thêm');
    } catch (error) {
      console.error('[PostDetail] Lỗi khi thêm bình luận:', error);
      toast.error(error.response?.data?.message || 'Không thể thêm bình luận');
    }
  };

  const handleAddReply = async (commentId) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để trả lời');
      navigate('/dang-nhap');
      return;
    }
    const content = replyContent[commentId]?.trim();
    if (!content) {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }

    try {
      await addReply(id, commentId, content);
      setReplyContent({ ...replyContent, [commentId]: '' });
      const commentsResponse = await getComments(id);
      setComments(commentsResponse.data.comments || []);
      toast.success('Phản hồi đã được thêm');
    } catch (error) {
      console.error('[PostDetail] Lỗi khi thêm phản hồi:', error);
      toast.error(error.response?.data?.message || 'Không thể thêm phản hồi');
    }
  };

  const renderComments = (parentId = null, depth = 0) => {
    return comments
      .filter((comment) => comment.parentId === parentId)
      .map((comment) => (
        <div key={comment.id} className={`ml-${depth * 4} mt-4`}>
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-gray-800">{comment.author}</p>
              <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</p>
            </div>
            <p className="mt-2 text-gray-600">{comment.content}</p>
            <button
              onClick={() => setReplyContent({ ...replyContent, [comment.id]: replyContent[comment.id] || '' })}
              className="text-blue-600 text-sm mt-2"
            >
              Trả lời
            </button>
            {replyContent[comment.id] !== undefined && (
              <div className="mt-2">
                <textarea
                  value={replyContent[comment.id] || ''}
                  onChange={(e) => setReplyContent({ ...replyContent, [comment.id]: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows="2"
                  placeholder="Nhập phản hồi của bạn..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAddReply(comment.id)}
                    className="bg-blue-600 text-white px-4 py-1 rounded-lg"
                  >
                    Gửi
                  </button>
                  <button
                    onClick={() => setReplyContent({ ...replyContent, [comment.id]: undefined })}
                    className="bg-gray-300 text-gray-700 px-4 py-1 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
          {renderComments(comment.id, depth + 1)}
        </div>
      ));
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  if (!post) {
    return null;
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Helmet>
        <title>{post.title} - Thời Trang XYZ</title>
        <meta name="description" content={post.content.slice(0, 150)} />
      </Helmet>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">{post.title}</h1>
      <div className="text-sm text-gray-500 mb-6">
        <p>Đăng bởi: {post.author}</p>
        <p>Ngày đăng: {new Date(post.createdAt).toLocaleDateString()}</p>
      </div>
      {post.image ? (
        <img
          src={`${BACKEND_BASE_URL}${post.image}`}
          alt={post.title}
          className="w-full h-96 object-cover rounded-lg mb-6"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/150'; // Fallback image
            console.error(`[PostDetail] Lỗi tải hình ảnh: ${post.image}`);
          }}
        />
      ) : (
        <div className="w-full h-96 bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
          <p className="text-gray-500">Không có hình ảnh</p>
        </div>
      )}
      <div className="prose max-w-none text-gray-600 mb-12">{post.content}</div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Bình Luận</h2>
      <div className="mb-8">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full p-3 border rounded-lg"
          rows="4"
          placeholder="Viết bình luận của bạn..."
        />
        <button
          onClick={handleAddComment}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Gửi Bình Luận
        </button>
      </div>

      <div>{renderComments()}</div>
    </div>
  );
};

export default PostDetail;