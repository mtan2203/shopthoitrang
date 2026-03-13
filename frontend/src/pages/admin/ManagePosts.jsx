import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { getPosts, createPost, updatePost, deletePost, getComments, addReply, deleteComment, uploadImage } from '../../services/api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  MessageSquare,
  Calendar,
  User,
  Image as ImageIcon,
  FileText,
  BarChart3,
  RefreshCw,
  Download,
  Filter,
  Grid,
  List,
  X,
  Save,
  Upload,
  Reply,
  Send
} from 'lucide-react';

// Định nghĩa base URL của backend
const BACKEND_BASE_URL = 'http://localhost:5000';

const ManagePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Edit form states
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  
  const [replyContent, setReplyContent] = useState({});
  const [activeReply, setActiveReply] = useState(null);

  useEffect(() => {
    if (!hasInitialized) {
      fetchPosts();
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPosts();
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bài viết:', error.response?.data || error.message);
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComments = useCallback(async (postId) => {
    try {
      const response = await getComments(postId);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Lỗi khi lấy bình luận:', error.response?.data || error.message);
      toast.error('Không thể tải bình luận');
    }
  }, []);

  const handleImageChange = useCallback((e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isEdit) {
        setEditImageFile(file);
        setEditImagePreview(URL.createObjectURL(file));
      } else {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  }, []);

  const handleCreatePost = useCallback(async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng điền đầy đủ tiêu đề và nội dung');
      return;
    }

    try {
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadResponse = await uploadImage(formData);
        imageUrl = uploadResponse.data.url;
      }

      const postData = { title, content, image: imageUrl };
      await createPost(postData);

      toast.success('Tạo bài viết thành công');
      resetCreateForm();
      setShowCreateModal(false);
      fetchPosts();
    } catch (error) {
      console.error('Lỗi khi tạo bài viết:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể tạo bài viết');
    }
  }, [title, content, imageFile, fetchPosts]);

  const handleEditPost = useCallback(async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('Vui lòng điền đầy đủ tiêu đề và nội dung');
      return;
    }

    try {
      let imageUrl = selectedPost.image;
      if (editImageFile) {
        const formData = new FormData();
        formData.append('image', editImageFile);
        const uploadResponse = await uploadImage(formData);
        imageUrl = uploadResponse.data.url;
      }

      const postData = { title: editTitle, content: editContent, image: imageUrl };
      await updatePost(selectedPost.id, postData);

      toast.success('Cập nhật bài viết thành công');
      resetEditForm();
      setShowEditModal(false);
      fetchPosts();
    } catch (error) {
      console.error('Lỗi khi cập nhật bài viết:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể cập nhật bài viết');
    }
  }, [editTitle, editContent, selectedPost, editImageFile, fetchPosts]);

  const handleDeletePost = useCallback(async (post) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${post.title}"?`)) {
      return;
    }

    try {
      await deletePost(post.id);
      toast.success('Xóa bài viết thành công');
      fetchPosts();
      if (showEditModal) setShowEditModal(false);
      if (showDetailModal) setShowDetailModal(false);
    } catch (error) {
      console.error('Lỗi khi xóa bài viết:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể xóa bài viết');
    }
  }, [fetchPosts, showEditModal, showDetailModal]);

  const handleViewDetail = useCallback(async (post) => {
    setSelectedPost(post);
    await fetchComments(post.id);
    setShowDetailModal(true);
  }, [fetchComments]);

  const handleOpenEditModal = useCallback((post) => {
    setSelectedPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditImageFile(null);
    setEditImagePreview(null);
    setShowEditModal(true);
  }, []);

  const handleAddReply = useCallback(async (commentId) => {
    const content = replyContent[commentId]?.trim();
    if (!content) {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }

    try {
      const response = await addReply(selectedPost.id, commentId, content);
      setReplyContent(prev => ({ ...prev, [commentId]: '' }));
      setActiveReply(null);
      setComments(response.data.comments || []);
      toast.success('Phản hồi đã được thêm');
    } catch (error) {
      console.error('Lỗi khi thêm phản hồi:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể thêm phản hồi');
    }
  }, [selectedPost, replyContent]);

  const handleDeleteComment = useCallback(async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này? Tất cả phản hồi của bình luận này cũng sẽ bị xóa.')) {
      return;
    }

    try {
      const response = await deleteComment(selectedPost.id, commentId);
      setComments(response.data.comments || []);
      toast.success('Xóa bình luận thành công');
    } catch (error) {
      console.error('Lỗi khi xóa bình luận:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Không thể xóa bình luận');
    }
  }, [selectedPost]);

  const resetCreateForm = useCallback(() => {
    setTitle('');
    setContent('');
    setImageFile(null);
    setImagePreview(null);
  }, []);

  const resetEditForm = useCallback(() => {
    setSelectedPost(null);
    setEditTitle('');
    setEditContent('');
    setEditImageFile(null);
    setEditImagePreview(null);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    resetCreateForm();
    setShowCreateModal(true);
  }, [resetCreateForm]);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
    resetCreateForm();
  }, [resetCreateForm]);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    resetEditForm();
  }, [resetEditForm]);

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter(post =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [posts, searchTerm]);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [filteredPosts, sortBy]);

  const stats = useMemo(() => ({
    total: posts.length,
    thisMonth: posts.filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth()).length,
    withImages: posts.filter(p => p.image).length,
    totalComments: posts.reduce((sum, p) => sum + (p.commentCount || 0), 0)
  }), [posts]);

  const renderComments = useCallback((parentId = null, depth = 0) => {
    return comments
      .filter((comment) => comment.parentId === parentId)
      .map((comment) => (
        <div key={comment.id} className={`${depth > 0 ? 'ml-8' : ''} mt-4`}>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{comment.author}</p>
                  <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <p className="text-gray-700 mb-3">{comment.content}</p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveReply(activeReply === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Reply size={16} />
                Trả lời
              </button>
            </div>

            {activeReply === comment.id && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                <textarea
                  value={replyContent[comment.id] || ''}
                  onChange={(e) => setReplyContent(prev => ({ ...prev, [comment.id]: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                  placeholder="Nhập phản hồi của bạn..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAddReply(comment.id)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Send size={16} />
                    Gửi
                  </button>
                  <button
                    onClick={() => setActiveReply(null)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm"
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
  }, [comments, activeReply, replyContent, handleDeleteComment, handleAddReply]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Quản Lý Bài Viết - Thời Trang XYZ</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Bài Viết</h1>
            <p className="text-gray-600 mt-1">Tạo và quản lý nội dung blog cho website</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <button
              onClick={fetchPosts}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              type="button"
            >
              <RefreshCw size={18} />
              Làm mới
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              type="button"
            >
              <Plus size={18} />
              Tạo Bài Viết
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng bài viết</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500">
                <FileText size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bài viết tháng này</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.thisMonth}</p>
              </div>
              <div className="p-4 rounded-2xl bg-green-500">
                <Calendar size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Có hình ảnh</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.withImages}</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-500">
                <ImageIcon size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng bình luận</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalComments}</p>
              </div>
              <div className="p-4 rounded-2xl bg-orange-500">
                <MessageSquare size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="title">Theo tiêu đề</option>
              </select>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                  type="button"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                  type="button"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Danh Sách Bài Viết ({sortedPosts.length})
            </h2>
            <button 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              type="button"
            >
              <Download size={18} />
              Xuất Excel
            </button>
          </div>

          {sortedPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Không tìm thấy bài viết nào' : 'Chưa có bài viết nào'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : 'Hãy tạo bài viết đầu tiên của bạn'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleOpenCreateModal}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  type="button"
                >
                  Tạo Bài Viết
                </button>
              )}
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {sortedPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <div className="relative">
                    {post.image ? (
                      <img
                        src={`${BACKEND_BASE_URL}${post.image}`}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                        <ImageIcon size={48} className="text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Bài viết
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {post.content}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    {post.commentCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 mb-4">
                        <MessageSquare size={16} />
                        <span>{post.commentCount} bình luận</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetail(post)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Eye size={16} />
                        Xem
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(post)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                      >
                        <Edit size={16} />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeletePost(post)}
                        className="flex items-center justify-center gap-2 bg-red-50 text-red-700 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Tạo Bài Viết Mới</h2>
              <button
                onClick={handleCloseCreateModal}
                className="text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tiêu đề bài viết..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer transition-colors">
                    <Upload size={18} />
                    Chọn ảnh
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, false)}
                      className="hidden"
                    />
                  </label>
                  {imageFile && <span className="text-sm text-green-600">✓ Đã chọn ảnh</span>}
                </div>
                {imagePreview && (
                  <div className="mt-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="8"
                  placeholder="Nhập nội dung bài viết..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseCreateModal}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                type="button"
              >
                Hủy
              </button>
              <button
                onClick={handleCreatePost}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                type="button"
              >
                <Save size={18} />
                Tạo Bài Viết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Bài Viết</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh
                </label>
                
                {selectedPost?.image && !editImagePreview && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Hình ảnh hiện tại:</p>
                    <img
                      src={`${BACKEND_BASE_URL}${selectedPost.image}`}
                      alt="Current"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer transition-colors">
                    <Upload size={18} />
                    {selectedPost?.image ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, true)}
                      className="hidden"
                    />
                  </label>
                  {editImageFile && <span className="text-sm text-green-600">✓ Đã chọn ảnh mới</span>}
                </div>

                {editImagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Ảnh mới:</p>
                    <img
                      src={editImagePreview}
                      alt="New preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung *
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="8"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseEditModal}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                type="button"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeletePost(selectedPost)}
                className="bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                type="button"
              >
                <Trash2 size={18} />
                Xóa
              </button>
              <button
                onClick={handleEditPost}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                type="button"
              >
                <Save size={18} />
                Cập Nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex-1 pr-4">{selectedPost?.title}</h2>
              <button
                onClick={handleCloseDetailModal}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>{selectedPost?.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{selectedPost && new Date(selectedPost.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>

            {selectedPost?.image && (
              <div className="mb-6">
                <img
                  src={`${BACKEND_BASE_URL}${selectedPost.image}`}
                  alt={selectedPost.title}
                  className="w-full h-64 object-cover rounded-xl border border-gray-200"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x300?text=No+Image';
                  }}
                />
              </div>
            )}

            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedPost?.content}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare size={20} />
                  Bình Luận ({comments.length})
                </h3>
              </div>

              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Chưa có bình luận nào cho bài viết này</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {renderComments()}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleCloseDetailModal}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                type="button"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePosts;