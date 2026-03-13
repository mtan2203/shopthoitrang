const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const fs = require('fs');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Tạo tên file an toàn, tránh lỗi ký tự đặc biệt
        const originalName = file.originalname;
        const timestamp = Date.now();
        const safeName = timestamp + '-' + originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, safeName);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        // Chấp nhận tất cả các file hình ảnh dựa vào MIME type
        if (file.mimetype.startsWith('image/')) {
            return cb(null, true);
        }
        
        // Hoặc kiểm tra theo phần mở rộng nếu MIME type không phải image
        const filetypes = /jpeg|jpg|png|gif|webp|svg|bmp|tiff|ico|avif/;
        const extname = path.extname(file.originalname).toLowerCase();
        if (filetypes.test(extname.substring(1))) {
            return cb(null, true);
        }
        
        console.log(`[Từ chối file] ${file.originalname}: Không phải là định dạng hình ảnh được hỗ trợ`);
        cb(null, false);
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    }
});

// Middleware để xử lý lỗi multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('[Multer Error]', err);
        return res.status(400).json({
            success: false,
            message: `Lỗi upload: ${err.message}`,
            code: err.code
        });
    }
    next(err);
};

// Route upload
router.post('/', upload.single('image'), handleMulterError, (req, res) => {
    try {
        if (!req.file) {
            console.error('[POST /upload] Không có file được upload hoặc file không hợp lệ');
            return res.status(400).json({ 
                success: false,
                message: 'Chưa có file ảnh hoặc file không hợp lệ. Hỗ trợ các định dạng hình ảnh phổ biến.' 
            });
        }
        
        // Lấy hostname từ request
        const host = req.get('host');
        const protocol = req.protocol;
        
        // Tạo đường dẫn tương đối và đầy đủ
        const relativePath = `/uploads/${req.file.filename}`;
        const fullUrl = `${protocol}://${host}${relativePath}`;
        
        console.log('[POST /upload] File đã upload:', req.file);
        console.log('[POST /upload] URL đầy đủ:', fullUrl);
        
        res.status(201).json({
            success: true,
            url: relativePath,
            imageUrl: fullUrl,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('[POST /upload] Lỗi:', error.message);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Lỗi khi upload ảnh' 
        });
    }
});

// Thêm route để kiểm tra xem upload đang hoạt động ở thư mục nào
router.get('/check', (req, res) => {
    res.json({
        uploadDir: uploadDir,
        exists: fs.existsSync(uploadDir),
        writable: fs.accessSync(uploadDir, fs.constants.W_OK, (err) => !err),
        cwd: process.cwd()
    });
});

module.exports = router;