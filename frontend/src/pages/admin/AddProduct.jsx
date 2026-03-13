import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createProduct, uploadImage, getCategories } from '../../services/api';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Plus, Trash2, Tag, Image, Box, X } from 'lucide-react';

// Hàm này sẽ tạo trang thêm sản phẩm mới cho quản trị viên
const AddProduct = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    discount_price: '',
    description: '',
    images: [],
    categoryId: '',
    stock: '',
    sizes: [],
    colors: [],
    model3d: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageUrls, setImageUrls] = useState(['']);
  const [model3dFile, setModel3dFile] = useState(null);
  const [model3dUrl, setModel3dUrl] = useState('');
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  // Khi component này được load lần đầu tiên, sẽ gọi API để lấy danh sách danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res.data.categories);
      } catch (err) {
        toast.error('Lỗi khi lấy danh mục: ' + err.message);
      }
    };
    fetchCategories();
  }, []);
  // Hàm này sẽ xử lý khi người dùng nhập dữ liệu vào các trường input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  // Hàm này sẽ xử lý khi người dùng thay đổi file ảnh
  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const newImageFiles = [...imageFiles];
    newImageFiles[index] = file;
    setImageFiles(newImageFiles);

    const newImagePreviews = [...imagePreviews];
    newImagePreviews[index] = URL.createObjectURL(file);
    setImagePreviews(newImagePreviews);

    const newImageUrls = [...imageUrls];
    newImageUrls[index] = '';
    setImageUrls(newImageUrls);

    setFormData({ ...formData, images: [] });
  };
  // Hàm này sẽ xử lý khi người dùng thay đổi URL ảnh 3D sản phẩm 
  const handle3DFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedFormats = ['.fbx', '.glb', '.gltf'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedFormats.includes(fileExtension)) {
      toast.error('Chỉ hỗ trợ file .fbx, .glb, .gltf');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File 3D không được vượt quá 50MB');
      return;
    }

    setModel3dFile(file);
    setModel3dUrl('');
    toast.success(`Đã chọn file 3D: ${file.name}`);
  };
  // Hàm này sẽ xử lý khi người dùng thay đổi URL file 3D
  const handle3DUrlChange = (e) => {
    const url = e.target.value;
    setModel3dUrl(url);
    if (url) {
      setModel3dFile(null);
    }
  };
  // Hàm này sẽ xử lý khi người dùng thay đổi URL ảnh
  const handleImageUrlChange = (e, index) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = e.target.value;
    setImageUrls(newImageUrls);

    const newImagePreviews = [...imagePreviews];
    newImagePreviews[index] = e.target.value || null;
    setImagePreviews(newImagePreviews);

    const newImageFiles = [...imageFiles];
    newImageFiles[index] = null;
    setImageFiles(newImageFiles);

    setFormData({ ...formData, images: [] });
  };
  
  const addImageInput = () => {
    if (imageUrls.length < 4) {
      setImageUrls([...imageUrls, '']);
      setImagePreviews([...imagePreviews, null]);
      setImageFiles([...imageFiles, null]);
    } else {
      toast.warn('Bạn chỉ có thể thêm tối đa 4 ảnh.');
    }
  };
  // Hàm này sẽ xóa ảnh theo index
  const removeImage = (index) => {
    const newImageUrls = imageUrls.filter((_, i) => i !== index);
    const newImagePreviews = imagePreviews.filter((_, i) => i !== index);
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    setImageUrls(newImageUrls);
    setImagePreviews(newImagePreviews);
    setImageFiles(newImageFiles);
    setFormData({ ...formData, images: [] });
  };
  
  const addSize = () => {
    if (sizeInput && !formData.sizes.includes(sizeInput)) {
      setFormData({ ...formData, sizes: [...formData.sizes, sizeInput] });
      setSizeInput('');
    }
  };
  
  const removeSize = (size) => {
    setFormData({ ...formData, sizes: formData.sizes.filter(s => s !== size) });
  };

  const addColor = () => {
    if (colorInput && !formData.colors.includes(colorInput)) {
      setFormData({ ...formData, colors: [...formData.colors, colorInput] });
      setColorInput('');
    }
  };

  const removeColor = (color) => {
    setFormData({ ...formData, colors: formData.colors.filter(c => c !== color) });
  };
  // Hàm này sẽ xử lý khi người dùng submit form để thêm sản phẩm mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.price || !formData.description || !formData.categoryId || !formData.stock) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.');
      toast.error('Vui lòng điền đầy đủ các trường.');
      return;
    }

    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);
    const discountPrice = formData.discount_price ? parseFloat(formData.discount_price) : null;

    if (isNaN(price) || price <= 0) {
      setError('Giá sản phẩm phải là một số hợp lệ và lớn hơn 0.');
      toast.error('Giá sản phẩm không hợp lệ.');
      return;
    }

    if (discountPrice && (discountPrice >= price || discountPrice <= 0)) {
      setError('Giá giảm phải nhỏ hơn giá gốc và lớn hơn 0.');
      toast.error('Giá giảm không hợp lệ.');
      return;
    }

    if (isNaN(stock) || stock < 0) {
      setError('Số lượng tồn kho phải là một số hợp lệ và không âm.');
      toast.error('Tồn kho không hợp lệ.');
      return;
    }
    try {
      // Upload images 
      const uploadedImages = [];
      for (let i = 0; i < imageFiles.length; i++) {
        if (imageFiles[i]) {
          const imgData = new FormData();
          imgData.append('image', imageFiles[i]);
          const uploadRes = await uploadImage(imgData);
          uploadedImages[i] = uploadRes.data.imageUrl;
        } else if (imageUrls[i]) {
          uploadedImages[i] = imageUrls[i];
        }
      }

      const filteredImages = uploadedImages.filter(img => img);
      
      let model3dPath = model3dUrl;
      if (model3dFile) {
        // Upload 3D model file
        const model3dData = new FormData();
        model3dData.append('model3d', model3dFile);
        const upload3dRes = await fetch('http://localhost:5000/api/upload-3d', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: model3dData
        });
        
        if (upload3dRes.ok) {
          const upload3dResult = await upload3dRes.json();
          model3dPath = upload3dResult.model3dUrl;
        } else {
          throw new Error('Lỗi khi upload file 3D');
        }
      }
      // Tạo sản phẩm mới
      await createProduct({
        name: formData.name,
        price: price,
        discount_price: discountPrice,
        description: formData.description,
        images: filteredImages.length > 0 ? filteredImages : ['https://via.placeholder.com/300x200?text=No+Image'],
        categoryId: parseInt(formData.categoryId),
        stock: stock,
        sizes: formData.sizes,
        colors: formData.colors,
        model3d: model3dPath
      });

      toast.success('Thêm sản phẩm thành công!');
      navigate('/admin');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi thêm sản phẩm. Vui lòng thử lại.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };
  // Kiểm tra quyền truy cập của người dùng
  if (!user || user.role !== 'admin') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center text-red-600 py-12 bg-white rounded-2xl shadow-sm p-6"
      >
        Bạn không có quyền truy cập.
      </motion.div>
    );
  }

  return (
    // Hiển thị giao diện thêm sản phẩm mới
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 p-6"
    >
      <Helmet>
        <title>Thêm Sản Phẩm - Thời Trang XYZ</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thêm Sản Phẩm Mới</h1>
            <p className="text-gray-600 mt-1">Tạo sản phẩm mới với thông tin chi tiết và hình ảnh</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X size={18} />
            Hủy
          </button>
        </div>
        {/* Form để thêm sản phẩm mới */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Details Section */}
            <div className="space-y-6">
              <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag size={20} />
                  Thông Tin Sản Phẩm
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên Sản Phẩm *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập tên sản phẩm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giá Gốc (VNĐ) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập giá gốc"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giá Giảm (VNĐ)</label>
                    <input
                      type="number"
                      name="discount_price"
                      value={formData.discount_price}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập giá giảm (nếu có)"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô Tả *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập mô tả sản phẩm"
                      required
                    />
                  </div>
                </div>
              </div>
            
              <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Box size={20} />
                  Kích Thước & Màu Sắc
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kích Thước</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập kích thước (VD: S, M, L)"
                      />
                      <button
                        type="button"
                        onClick={addSize}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Thêm
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.sizes.map(size => (
                        <span key={size} className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm">
                          {size}
                          <button
                            type="button"
                            onClick={() => removeSize(size)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <X size={16} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Màu Sắc</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập màu sắc (VD: Đỏ, Xanh)"
                      />
                      <button
                        type="button"
                        onClick={addColor}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Thêm
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.colors.map(color => (
                        <span key={color} className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm">
                          {color}
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <X size={16} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Images & 3D Model Section */}
            <div className="space-y-6">
              <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Image size={20} />
                  Hình Ảnh Sản Phẩm (Tối đa 4 ảnh)
                </h2>
                {imageUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-3 mb-3">
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, index)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => handleImageUrlChange(e, index)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Hoặc dán URL ảnh"
                      />
                    </div>
                    {imagePreviews[index] && (
                      <div className="relative">
                        <img
                          src={imagePreviews[index]}
                          alt={`Preview ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {imageUrls.length < 4 && (
                  <button
                    type="button"
                    onClick={addImageInput}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Plus size={18} />
                    Thêm ảnh khác
                  </button>
                )}
              </div>

              <div className="p-4 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Box size={20} />
                  Model 3D (Tùy chọn)
                </h2>
                <p className="text-sm text-gray-500 mb-3">Hỗ trợ file .fbx, .glb, .gltf (tối đa 50MB)</p>
                <input
                  type="file"
                  accept=".fbx,.glb,.gltf"
                  onChange={handle3DFileChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                <div className="text-center text-gray-500 mb-3">hoặc</div>
                <input
                  type="text"
                  value={model3dUrl}
                  onChange={handle3DUrlChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dán URL file 3D"
                />
                {(model3dFile || model3dUrl) && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">
                      ✓ {model3dFile ? `File: ${model3dFile.name}` : `URL: ${model3dUrl}`}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag size={20} />
                  Danh Mục & Tồn Kho
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh Mục *</label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tồn Kho *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập số lượng tồn kho"
                      required
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Thêm Sản Phẩm
            </button>
          </div>
          {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
        </form>
      </div>
    </motion.div>
  );
};

export default AddProduct;