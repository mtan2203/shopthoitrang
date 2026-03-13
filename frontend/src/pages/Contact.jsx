import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FaEnvelope, FaMapMarkerAlt, FaPhone, FaFacebookF, FaInstagram, FaTiktok, FaPaperPlane } from 'react-icons/fa';
import api from '../services/api';

// Import ảnh banner từ assets
import contactBanner from '../assets/images/banner/contact-banner.jpg';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState('');
  const [newsletterError, setNewsletterError] = useState('');

  // Thông tin liên hệ
  const contactInfo = [
    {
      icon: <FaMapMarkerAlt className="text-blue-600 text-2xl" />,
      title: 'Địa Chỉ',
      details: [
        '123 Đường Lê Lợi, Quận 1',
        'TP. Hồ Chí Minh, Việt Nam'
      ]
    },
    {
      icon: <FaPhone className="text-blue-600 text-2xl" />,
      title: 'Điện Thoại',
      details: [
        '+84 (0) 28 1234 5678',
        '+84 (0) 901 234 567'
      ]
    },
    {
      icon: <FaEnvelope className="text-blue-600 text-2xl" />,
      title: 'Email',
      details: [
        'info@thoitrangxyz.com',
        'support@thoitrangxyz.com'
      ]
    }
  ];

  // Cửa hàng
  const storeLocations = [
    {
      name: 'Cửa hàng Quận 1',
      address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
      phone: '028 1234 5678',
      hours: 'T2-CN: 9:00 - 21:00'
    },
    {
      name: 'Cửa hàng Quận 3',
      address: '456 Đường Nam Kỳ Khởi Nghĩa, Quận 3, TP.HCM',
      phone: '028 8765 4321',
      hours: 'T2-CN: 9:00 - 21:00'
    },
    {
      name: 'Cửa hàng Hà Nội',
      address: '789 Đường Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
      phone: '024 9876 5432',
      hours: 'T2-CN: 9:00 - 21:00'
    }
  ];

  // FAQ nhanh
  const faqs = [
    {
      question: 'Thời gian giao hàng là bao lâu?',
      answer: 'Thời gian giao hàng từ 2-5 ngày làm việc tùy thuộc vào khu vực của bạn.'
    },
    {
      question: 'Chính sách đổi trả như thế nào?',
      answer: 'Bạn có thể đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm còn nguyên tem mác.'
    },
    {
      question: 'Có phí vận chuyển không?',
      answer: 'Đơn hàng từ 500.000đ sẽ được miễn phí vận chuyển toàn quốc.'
    }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await api.post('/contact', formData);
      setSuccess('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError('Đã xảy ra lỗi khi gửi liên hệ. Vui lòng thử lại hoặc liên hệ trực tiếp qua số điện thoại của chúng tôi.');
      console.error('Lỗi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (!newsletterEmail) {
      setNewsletterError('Vui lòng nhập địa chỉ email của bạn');
      return;
    }
    
    try {
      await api.post('/newsletter-signup', { email: newsletterEmail });
      setNewsletterSuccess('Cảm ơn bạn đã đăng ký! Bạn sẽ nhận được những thông tin mới nhất từ chúng tôi.');
      setNewsletterEmail('');
      setNewsletterError('');
    } catch (err) {
      setNewsletterError('Không thể đăng ký vào lúc này. Vui lòng thử lại sau.');
      console.error('Lỗi đăng ký bản tin:', err);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Liên Hệ - Thời Trang XYZ</title>
        <meta name="description" content="Liên hệ với Thời Trang XYZ để được hỗ trợ, tư vấn và giải đáp thắc mắc về sản phẩm và dịch vụ của chúng tôi." />
      </Helmet>

      {/* Hero Section */}
      <div className="relative mb-16">
        <div className="h-80">
          <img
            src={contactBanner}
            alt="Contact Banner"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
            Liên Hệ Với Chúng Tôi
          </h1>
          <p className="text-xl text-white max-w-2xl text-center mb-6">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy để lại thông tin, và chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.
          </p>
        </div>
      </div>

      {/* Contact Info Section */}
      <section className="container mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {contactInfo.map((info, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">{info.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{info.title}</h3>
              {info.details.map((detail, i) => (
                <p key={i} className="text-gray-600">{detail}</p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form & Map Section */}
      <section className="container mx-auto px-4 mb-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Contact Form */}
          <div className="lg:w-1/2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gửi Tin Nhắn</h2>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Họ Tên</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Chủ đề</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Chọn chủ đề</option>
                    <option value="customer-support">Hỗ trợ khách hàng</option>
                    <option value="product-inquiry">Thắc mắc về sản phẩm</option>
                    <option value="order-status">Tình trạng đơn hàng</option>
                    <option value="returns">Đổi/Trả hàng</option>
                    <option value="feedback">Góp ý/Phản hồi</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-gray-700 font-medium">Tin nhắn</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="5"
                  required
                />
              </div>
              {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
              {success && <p className="text-green-600 mb-4 text-center">{success}</p>}
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors ${
                  loading ? 'bg-blue-400 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {loading ? 'Đang gửi...' : 'Gửi Tin Nhắn'}
              </button>
            </form>
          </div>

          {/* Map & Store Locations */}
          <div className="lg:w-1/2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Vị Trí Cửa Hàng</h2>
            <div className="mb-6 rounded-lg overflow-hidden h-64 bg-gray-200">
              {/* Placeholder for map - in a real application, you'd embed Google Maps or similar */}
              <img 
                src="https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/155102/Originals/ve-ban-do-tren-google-maps-11.jpg" 
                alt="Store Map" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-4">
              {storeLocations.map((location, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-lg mb-2">{location.name}</h3>
                  <p className="text-gray-600"><strong>Địa chỉ:</strong> {location.address}</p>
                  <p className="text-gray-600"><strong>Điện thoại:</strong> {location.phone}</p>
                  <p className="text-gray-600"><strong>Giờ mở cửa:</strong> {location.hours}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-12">
            Câu Hỏi Thường Gặp
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <a 
                href="/faq" 
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
              >
                Xem tất cả câu hỏi thường gặp →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Kết Nối Với Chúng Tôi
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          Theo dõi chúng tôi trên các nền tảng mạng xã hội để cập nhật xu hướng mới nhất, khuyến mãi đặc biệt và các sự kiện sắp tới.
        </p>
        <div className="flex justify-center gap-4">
          <a 
            href="https://facebook.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-600 text-white p-4 rounded-full hover:bg-blue-700 transition-colors"
          >
            <FaFacebookF size={24} />
          </a>
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-pink-600 text-white p-4 rounded-full hover:bg-pink-700 transition-colors"
          >
            <FaInstagram size={24} />
          </a>
          <a 
            href="https://tiktok.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-black text-white p-4 rounded-full hover:bg-gray-800 transition-colors"
          >
            <FaTiktok size={24} />
          </a>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-blue-600 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Đăng Ký Nhận Bản Tin
            </h2>
            <p className="text-blue-100 mb-8">
              Đăng ký để nhận thông tin về các bộ sưu tập mới, khuyến mãi đặc biệt và các sự kiện độc quyền.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input 
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Email của bạn"
                className="flex-grow py-3 px-4 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
              <button 
                type="submit"
                className="bg-white text-blue-600 py-3 px-6 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>Đăng Ký</span>
                  <FaPaperPlane />
                </div>
              </button>
            </form>
            {newsletterError && <p className="text-red-300 mt-4">{newsletterError}</p>}
            {newsletterSuccess && <p className="text-blue-100 mt-4">{newsletterSuccess}</p>}
            <p className="text-blue-200 text-sm mt-4">
              Chúng tôi tôn trọng quyền riêng tư của bạn và cam kết không chia sẻ thông tin với bên thứ ba.
            </p>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-12">
          Kênh Hỗ Trợ Khác
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaPhone className="text-blue-600 text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Hotline</h3>
            <p className="text-gray-600 mb-4">Gọi ngay để được tư vấn nhanh chóng</p>
            <a href="tel:1900123456" className="text-blue-600 font-medium text-lg hover:underline">
              1900 123 456
            </a>
            <p className="text-gray-500 text-sm mt-2">8:00 - 22:00 (Thứ 2 - Chủ nhật)</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Live Chat</h3>
            <p className="text-gray-600 mb-4">Chat trực tiếp với nhân viên tư vấn</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors">
              Bắt đầu Chat
            </button>
            <p className="text-gray-500 text-sm mt-2">Phản hồi trong vòng 5 phút</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaEnvelope className="text-blue-600 text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Email</h3>
            <p className="text-gray-600 mb-4">Gửi email cho chúng tôi</p>
            <a href="mailto:support@thoitrangxyz.com" className="text-blue-600 font-medium hover:underline">
              support@thoitrangxyz.com
            </a>
            <p className="text-gray-500 text-sm mt-2">Phản hồi trong vòng 24h</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      
    </div>
  );
};

export default Contact;