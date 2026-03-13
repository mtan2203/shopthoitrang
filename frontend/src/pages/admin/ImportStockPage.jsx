import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { importStock } from '../../services/api'; // Đường dẫn đã được sửa trước đó

const ImportStockPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    console.log('[ImportStockPage] File selected:', e.target.files[0]?.name);
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[ImportStockPage] Form submitted, file:', file?.name);

    if (!file) {
      console.log('[ImportStockPage] No file selected');
      toast.error('Vui lòng chọn file Excel để import!');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('[ImportStockPage] Sending importStock request...');
      const response = await importStock(formData);
      console.log('[ImportStockPage] Import success:', response.data);
      toast.success(response.data.message || 'Cập nhật số lượng tồn thành công!');
    } catch (error) {
      console.error('[ImportStockPage] Import error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi import file!');
    } finally {
      setLoading(false);
      setFile(null);
      console.log('[ImportStockPage] Reset file input and loading state');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Import Số Lượng Tồn Từ File Excel</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Chọn file Excel (.xlsx)
          </label>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2 rounded-lg text-white font-medium transition-all duration-300 ${
            loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Đang xử lý...' : 'Import'}
        </button>
      </form>
    </div>
  );
};

export default ImportStockPage;