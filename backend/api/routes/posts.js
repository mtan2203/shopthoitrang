const express = require('express');
const router = express.Router();
const { runAsync, getAsync, allAsync } = require('../../config/db');
const { authenticate, restrictTo } = require('../middleware/auth');

// Hàm chuẩn hóa định dạng thời gian sang YYYY-MM-DD HH:mm:ss (Asia/Ho_Chi_Minh)
const formatDateForMySQL = (date) => {
  const offset = 7 * 60; // UTC+7
  const localDate = new Date(date.getTime() + offset * 60 * 1000);
  return localDate.toISOString().slice(0, 19).replace('T', ' ');
};

// Lấy danh sách bài viết
router.get('/', async (req, res) => {
  try {
    const posts = await allAsync(
      `SELECT posts.id, posts.title, posts.content, posts.image, posts.createdAt, users.username as author
       FROM posts
       JOIN users ON posts.authorId = users.id
       ORDER BY posts.createdAt DESC`
    );
    console.log('[GET /posts] Dữ liệu trả về:', posts);
    res.json({ posts });
  } catch (err) {
    console.error('[GET /posts] Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Tạo bài viết mới (chỉ admin)
router.post('/', authenticate, restrictTo('admin'), async (req, res) => {
  const { title, content, image } = req.body;
  console.log('[POST /posts] Dữ liệu nhận được:', { title, content, image });

  if (!title || !content) {
    return res.status(400).json({ message: 'Vui lòng cung cấp tiêu đề và nội dung' });
  }

  try {
    const createdAt = formatDateForMySQL(new Date());
    const result = await runAsync(
      'INSERT INTO posts (title, content, image, authorId, createdAt) VALUES (?, ?, ?, ?, ?)',
      [title, content, image || null, req.user.id, createdAt]
    );
    const postId = result.lastID;

    // Tạo thông báo cho tất cả user
    const titleNotif = `Bài viết mới: ${title}`;
    const message = `Bài viết mới: ${title} vừa được đăng! Nhấn để xem ngay.`;
    const link = `/bai-viet/${postId}`;
    await runAsync(
      'INSERT INTO notifications (title, message, link, userId, createdAt) VALUES (?, ?, ?, ?, ?)',
      [titleNotif, message, link, null, createdAt]
    );

    console.log('[POST /posts] Đã lưu bài viết vào database, image:', image);
    res.status(201).json({ id: postId, title, content, image, authorId: req.user.id });
  } catch (err) {
    console.error('[POST /posts] Lỗi khi lưu vào database:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Cập nhật bài viết (chỉ admin)
router.put('/:id', authenticate, restrictTo('admin'), async (req, res) => {
  const { id } = req.params;
  const { title, content, image } = req.body;
  console.log('[PUT /posts/:id] Dữ liệu nhận được:', { id, title, content, image });

  if (!title || !content) {
    return res.status(400).json({ message: 'Vui lòng cung cấp tiêu đề và nội dung' });
  }

  try {
    const result = await runAsync(
      'UPDATE posts SET title = ?, content = ?, image = ? WHERE id = ?',
      [title, content, image || null, id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }
    console.log('[PUT /posts/:id] Đã cập nhật bài viết, image:', image);
    res.status(200).json({ id, title, content, image });
  } catch (err) {
    console.error('[PUT /posts/:id] Lỗi khi cập nhật database:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Xóa bài viết (chỉ admin)
router.delete('/:id', authenticate, restrictTo('admin'), async (req, res) => {
  const { id } = req.params;
  console.log('[DELETE /posts/:id] Yêu cầu xóa bài viết:', id);

  try {
    // Xóa các bình luận liên quan trước
    await runAsync('DELETE FROM comments WHERE postId = ?', [id]);

    // Xóa bài viết
    const result = await runAsync('DELETE FROM posts WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }
    console.log('[DELETE /posts/:id] Đã xóa bài viết thành công');
    res.status(200).json({ message: 'Xóa bài viết thành công' });
  } catch (err) {
    console.error('[DELETE /posts/:id] Lỗi khi xóa bài viết:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Lấy danh sách bình luận của bài viết
router.get('/:id/comments', async (req, res) => {
  const { id } = req.params;
  try {
    const comments = await allAsync(
      `SELECT comments.id, comments.content, comments.createdAt, comments.parentId, users.username as author
       FROM comments
       JOIN users ON comments.userId = users.id
       WHERE comments.postId = ?
       ORDER BY comments.createdAt ASC`,
      [id]
    );
    res.json({ comments });
  } catch (err) {
    console.error('[GET /posts/:id/comments] Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Thêm bình luận mới
router.post('/:id/comments', authenticate, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Vui lòng cung cấp nội dung bình luận' });
  }

  try {
    const createdAt = formatDateForMySQL(new Date());
    const result = await runAsync(
      'INSERT INTO comments (postId, userId, content, createdAt) VALUES (?, ?, ?, ?)',
      [id, req.user.id, content, createdAt]
    );
    const commentId = result.lastID;

    // Lấy thông tin bài viết
    const post = await getAsync('SELECT title FROM posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    // Tạo thông báo cho admin
    const adminUsers = await allAsync('SELECT id FROM users WHERE role = "admin"');
    for (const admin of adminUsers) {
      const titleNotif = 'Bình luận mới trong blog';
      const message = `Có bình luận mới trong bài viết "${post.title}". Nhấn để xem ngay.`;
      const link = `/bai-viet/${id}`;
      await runAsync(
        'INSERT INTO notifications (title, message, link, userId, createdAt) VALUES (?, ?, ?, ?, ?)',
        [titleNotif, message, link, admin.id, createdAt]
      );
    }

    res.status(201).json({ id: commentId, content, userId: req.user.id });
  } catch (err) {
    console.error('[POST /posts/:id/comments] Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Thêm phản hồi cho bình luận
router.post('/:id/comments/:commentId/reply', authenticate, async (req, res) => {
  const { id, commentId } = req.params;
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Vui lòng cung cấp nội dung phản hồi' });
  }

  try {
    // Kiểm tra xem bình luận gốc có tồn tại không
    const comment = await getAsync('SELECT id, userId FROM comments WHERE id = ? AND postId = ?', [commentId, id]);
    if (!comment) {
      return res.status(404).json({ message: 'Bình luận không tồn tại' });
    }

    const createdAt = formatDateForMySQL(new Date());
    const result = await runAsync(
      'INSERT INTO comments (postId, userId, content, parentId, createdAt) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, content, commentId, createdAt]
    );
    const replyId = result.lastID;

    // Lấy thông tin bài viết
    const post = await getAsync('SELECT title FROM posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    // Tạo thông báo cho user sở hữu bình luận gốc
    if (comment.userId !== req.user.id) {
      const titleNotif = 'Phản hồi mới cho bình luận của bạn';
      const message = `Có phản hồi mới trong bài viết "${post.title}". Nhấn để xem ngay.`;
      const link = `/bai-viet/${id}`;
      await runAsync(
        'INSERT INTO notifications (title, message, link, userId, createdAt) VALUES (?, ?, ?, ?, ?)',
        [titleNotif, message, link, comment.userId, createdAt]
      );
    }

    // Lấy danh sách bình luận mới nhất
    const updatedComments = await allAsync(
      `SELECT comments.id, comments.content, comments.createdAt, comments.parentId, users.username as author
       FROM comments
       JOIN users ON comments.userId = users.id
       WHERE comments.postId = ?
       ORDER BY comments.createdAt ASC`,
      [id]
    );

    res.status(201).json({ comments: updatedComments });
  } catch (err) {
    console.error('[POST /posts/:id/comments/:commentId/reply] Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// Xóa bình luận (chỉ admin)
router.delete('/:id/comments/:commentId', authenticate, restrictTo('admin'), async (req, res) => {
  const { id, commentId } = req.params;

  try {
    // Kiểm tra xem bình luận có tồn tại không
    const comment = await getAsync('SELECT id FROM comments WHERE id = ? AND postId = ?', [commentId, id]);
    if (!comment) {
      return res.status(404).json({ message: 'Bình luận không tồn tại' });
    }

    // Xóa tất cả bình luận con (phản hồi) trước
    await runAsync('DELETE FROM comments WHERE parentId = ?', [commentId]);

    // Xóa bình luận gốc
    const result = await runAsync('DELETE FROM comments WHERE id = ?', [commentId]);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Bình luận không tồn tại' });
    }

    // Lấy danh sách bình luận mới nhất
    const updatedComments = await allAsync(
      `SELECT comments.id, comments.content, comments.createdAt, comments.parentId, users.username as author
       FROM comments
       JOIN users ON comments.userId = users.id
       WHERE comments.postId = ?
       ORDER BY comments.createdAt ASC`,
      [id]
    );

    res.status(200).json({ message: 'Xóa bình luận thành công', comments: updatedComments });
  } catch (err) {
    console.error('[DELETE /posts/:id/comments/:commentId] Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

module.exports = router;