import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, Check, QrCode, Link, FileText, Smartphone } from 'lucide-react';

const QRCodeGenerator = () => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState(256);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [fgColor, setFgColor] = useState('#000000');
  const qrRef = useRef();

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL();
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = url;
      link.click();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getInputType = (input) => {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return 'link';
    } else if (input.includes('@') && input.includes('.')) {
      return 'email';
    } else if (/^\+?[\d\s\-\(\)]+$/.test(input)) {
      return 'phone';
    }
    return 'text';
  };

  const inputType = getInputType(text);

  const getTypeIcon = () => {
    switch (inputType) {
      case 'link': return <Link className="w-4 h-4" />;
      case 'email': return <FileText className="w-4 h-4" />;
      case 'phone': return <Smartphone className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const presetTexts = [
    { label: 'Website', value: 'http://localhost:3000/admin/tao-qr' },
    { label: 'Email', value: 'Mail:Phanmanhtan2203@gmail.com' },
    { label: 'Phone', value: 'Tel : 0799077168' },
    { label: 'WiFi', value: 'WIFI:Manhtanpro123;' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <QrCode className="w-8 h-8 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              QR Code Generator
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Tạo mã QR chuyên nghiệp từ văn bản, link, email và nhiều hơn nữa</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-indigo-600" />
              Nhập nội dung
            </h2>
            
            {/* Quick presets */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Mẫu có sẵn:</p>
              <div className="flex flex-wrap gap-2">
                {presetTexts.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => setText(preset.value)}
                    className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <textarea
                placeholder="Nhập nội dung hoặc đường dẫn..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
              />
              <div className="absolute top-3 right-3 flex items-center space-x-2">
                {text && (
                  <>
                    <div className="flex items-center text-gray-500">
                      {getTypeIcon()}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Copy text"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {text && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Loại nội dung:</span>{' '}
                  <span className="capitalize text-indigo-600">{inputType}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Độ dài:</span> {text.length} ký tự
                </p>
              </div>
            )}

            {/* Customization Options */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Tùy chỉnh</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kích thước
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={128}>Nhỏ (128px)</option>
                    <option value={256}>Trung bình (256px)</option>
                    <option value={512}>Lớn (512px)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Màu nền
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Màu mã QR
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Display Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
              <QrCode className="w-6 h-6 mr-2 text-indigo-600" />
              Mã QR của bạn
            </h2>
            
            {text ? (
              <div className="flex flex-col items-center space-y-6">
                <div 
                  ref={qrRef}
                  className="p-6 bg-gray-50 rounded-2xl shadow-inner"
                  style={{ backgroundColor: bgColor }}
                >
                  <QRCodeCanvas 
                    value={text} 
                    size={size}
                    bgColor={bgColor}
                    fgColor={fgColor}
                    level="M"
                    includeMargin={true}
                  />
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Dùng camera điện thoại để quét mã QR
                  </p>
                  <p className="text-xs text-gray-500">
                    Kích thước: {size}x{size}px
                  </p>
                </div>

                <button
                  onClick={downloadQR}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  <span>Tải xuống PNG</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <QrCode className="w-16 h-16 mb-4" />
                <p className="text-lg">Nhập nội dung để tạo mã QR</p>
                <p className="text-sm mt-2">Mã QR sẽ xuất hiện ở đây</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;