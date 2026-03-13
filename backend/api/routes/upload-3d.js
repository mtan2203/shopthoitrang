const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const fs = require('fs');

// Đảm bảo thư mục uploads/3d tồn tại
const uploadDir = path.join(process.cwd(), 'uploads', '3d');
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
        // Chấp nhận các file 3D
        const allowedMimeTypes = [
            'application/octet-stream', // FBX files
            'model/gltf-binary',        // GLB files
            'model/gltf+json',          // GLTF files
            'application/json'          // GLTF files (sometimes)
        ];
        
        const allowedExtensions = ['.fbx', '.glb', '.gltf'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
            return cb(null, true);
        }
        
        console.log(`[Từ chối file 3D] ${file.originalname}: Không phải là định dạng 3D được hỗ trợ`);
        console.log(`MIME type: ${file.mimetype}, Extension: ${fileExtension}`);
        cb(null, false);
    },
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    }
});

// Middleware để xử lý lỗi multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('[Multer Error]', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File 3D quá lớn. Kích thước tối đa là 50MB',
                code: err.code
            });
        }
        return res.status(400).json({
            success: false,
            message: `Lỗi upload file 3D: ${err.message}`,
            code: err.code
        });
    }
    next(err);
};

// Route upload file 3D
router.post('/', upload.single('model3d'), handleMulterError, (req, res) => {
    try {
        if (!req.file) {
            console.error('[POST /upload-3d] Không có file được upload hoặc file không hợp lệ');
            return res.status(400).json({ 
                success: false,
                message: 'Chưa có file 3D hoặc file không hợp lệ. Hỗ trợ các định dạng: .fbx, .glb, .gltf' 
            });
        }
        
        // Lấy hostname từ request
        const host = req.get('host');
        const protocol = req.protocol;
        
        // Tạo đường dẫn tương đối và đầy đủ
        const relativePath = `/uploads/3d/${req.file.filename}`;
        const fullUrl = `${protocol}://${host}${relativePath}`;
        
        console.log('[POST /upload-3d] File đã upload:', req.file);
        console.log('[POST /upload-3d] URL đầy đủ:', fullUrl);
        
        res.status(201).json({
            success: true,
            url: relativePath,
            model3dUrl: fullUrl,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('[POST /upload-3d] Lỗi:', error.message);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Lỗi khi upload file 3D' 
        });
    }
});

// Route để kiểm tra thư mục upload 3D
router.get('/check', (req, res) => {
    res.json({
        uploadDir: uploadDir,
        exists: fs.existsSync(uploadDir),
        files: fs.readdirSync(uploadDir).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.fbx', '.glb', '.gltf'].includes(ext);
        }),
        cwd: process.cwd()
    });
});

// Route để serve file 3D
router.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            message: 'File 3D không tồn tại'
        });
    }
    
    // Set appropriate headers for 3D files
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
        case '.glb':
            contentType = 'model/gltf-binary';
            break;
        case '.gltf':
            contentType = 'model/gltf+json';
            break;
        case '.fbx':
            contentType = 'application/octet-stream';
            break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    res.sendFile(filePath);
});

module.exports = router;