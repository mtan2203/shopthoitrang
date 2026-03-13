import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FaCheckCircle, FaHistory, FaMedal, FaUsers } from 'react-icons/fa';
import { getPosts } from '../services/api';
import { Link } from 'react-router-dom';

// Import ảnh banner từ assets
import aboutBanner from '../assets/images/banner/about-banner.jpg';
import teamMember1 from '../assets/images/team/member1.jpg';
import teamMember2 from '../assets/images/team/member2.jpg';
import teamMember3 from '../assets/images/team/member3.jpg';

// Định nghĩa base URL của backend
const BACKEND_BASE_URL = 'http://localhost:5000';

const About = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await getPosts();
        console.log('[About] Dữ liệu bài viết nhận được:', response.data.posts);
        setPosts(response.data.posts || []);
      } catch (error) {
        console.error('Lỗi khi lấy bài viết:', error);
      }
    };
    fetchPosts();
  }, []);

  // Dữ liệu cho các giá trị cốt lõi
  const coreValues = [  
    {
      icon: <FaCheckCircle className="text-blue-600 text-3xl mb-4" />,
      title: 'Chất Lượng',
      description: 'Cam kết mang đến những sản phẩm chất lượng cao với vải và đường may tỉ mỉ.'
    },
    {
      icon: <FaUsers className="text-blue-600 text-3xl mb-4" />,
      title: 'Khách Hàng',
      description: 'Lấy khách hàng làm trung tâm, mang đến trải nghiệm mua sắm tuyệt vời.'
    },
    {
      icon: <FaMedal className="text-blue-600 text-3xl mb-4" />,
      title: 'Uy Tín',
      description: 'Xây dựng thương hiệu dựa trên sự minh bạch và tin cậy.'
    },
    {
      icon: <FaHistory className="text-blue-600 text-3xl mb-4" />,
      title: 'Đổi Mới',
      description: 'Không ngừng cập nhật xu hướng và đổi mới sản phẩm.'
    }
  ];

  // Dữ liệu cho đội ngũ
  const teamMembers = [
    {
      image: teamMember1,
      name: 'Nguyễn Thị Minh',
      position: 'Giám đốc Sáng tạo',
      bio: 'Với hơn 10 năm kinh nghiệm trong ngành thời trang.'
    },
    {
      image: teamMember2,
      name: 'Trần Văn Hùng',
      position: 'Quản lý Sản phẩm',
      bio: 'Chuyên gia trong lĩnh vực chất liệu và thiết kế bền vững.'
    },
    {
      image: teamMember3,
      name: 'Lê Thanh Hà',
      position: 'Giám đốc Marketing',
      bio: 'Sáng tạo chiến lược xây dựng thương hiệu hiệu quả.'
    }
  ];

  return (
    <div>
      <Helmet>
        <title>Giới Thiệu - Thời Trang XYZ</title>
        <meta name="description" content="Tìm hiểu thêm về Thời Trang XYZ - Thương hiệu thời trang hàng đầu tại Việt Nam với các sản phẩm chất lượng và thiết kế độc đáo." />
      </Helmet>

      {/* Hero Section */}
      <div className="relative mb-16">
        <div className="h-96">
          <img
            src={aboutBanner}
            alt="About Banner"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent opacity-70"></div>
        </div>
        <div className="absolute inset-0 flex flex-col items-start justify-center px-8 md:px-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Về Chúng Tôi
          </h1>
          <p className="text-xl text-white max-w-lg mb-6 drop-shadow-md">
            Khám phá câu chuyện và sứ mệnh của Thời Trang XYZ - Nơi phong cách gặp gỡ chất lượng
          </p>
          <a
            href="#story"
            className="bg-white text-blue-600 hover:bg-blue-100 transition-colors px-6 py-3 rounded-full font-medium"
          >
            Khám Phá Ngay
          </a>
        </div>
      </div>

      {/* Our Story Section */}
      <section id="story" className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Câu Chuyện Của Chúng Tôi
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Thời Trang XYZ được thành lập vào năm 2023 bởi một nhóm những người đam mê thời trang với mong muốn mang đến những sản phẩm chất lượng cao nhưng vẫn có giá thành hợp lý cho người tiêu dùng Việt Nam.
              </p>
              <p>
                Từ một cửa hàng nhỏ tại Hà Nội, chúng tôi đã nhanh chóng phát triển và mở rộng hệ thống cửa hàng trên toàn quốc, trở thành điểm đến yêu thích của những tín đồ thời trang.
              </p>
              <p>
                Tại Thời Trang XYZ, chúng tôi không chỉ đơn thuần cung cấp quần áo mà còn mang đến phong cách sống, tự tin và sự thoải mái cho khách hàng. Mỗi thiết kế đều được chăm chút tỉ mỉ, từ khâu chọn chất liệu đến thiết kế và sản xuất.
              </p>
            </div>
            <div className="mt-8 flex gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">5+</div>
                <div className="text-gray-500">Cửa hàng</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">10K+</div>
                <div className="text-gray-500">Khách hàng</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">500+</div>
                <div className="text-gray-500">Sản phẩm</div>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 grid grid-cols-2 gap-4">
            <div className="rounded-lg overflow-hidden h-64">
              <img
                src="https://mensfolio.vn/wp-content/uploads/2025/02/lv-1.png"
                alt="Sản phẩm tiêu biểu"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-lg overflow-hidden h-64 mt-8">
              <img
                src="https://mensfolio.vn/wp-content/uploads/2025/02/lv-1.png"
                alt="Sản phẩm tiêu biểu"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-lg overflow-hidden h-64 -mt-16">
              <img
                src="https://azpos.vn/wp-content/uploads/2021/06/mo-cua-hang-quan-ao.png"
                alt="Quá trình sản xuất"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-lg overflow-hidden h-64 mt-8">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Carolina_Herrera_AW14_12.jpg"
                alt="Đội ngũ thiết kế"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Giá Trị Cốt Lõi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreValues.map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
                <div className="flex justify-center">{value.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Đội Ngũ Của Chúng Tôi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="h-64">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-3">{member.position}</p>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Blog Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Blog Thời Trang
        </h2>
        {posts.length === 0 ? (
          <p className="text-center text-gray-600">Chưa có bài viết nào.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
                {post.image ? (
                  <img
                    src={`${BACKEND_BASE_URL}${post.image}`}
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150'; // Fallback image
                      console.error(`[About] Lỗi tải hình ảnh: ${post.image}`);
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <p className="text-gray-500">Không có hình ảnh</p>
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
                <div className="text-sm text-gray-500 mb-4">
                  <p>Đăng bởi: {post.author}</p>
                  <p>Ngày đăng: {new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
                <Link
                  to={`/bai-viet/${post.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Xem thêm
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Vision & Mission */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold mb-4">Tầm Nhìn</h3>
              <p className="mb-4">
                Trở thành thương hiệu thời trang hàng đầu Việt Nam, đi đầu trong việc kết hợp giữa thời trang và tính bền vững.
              </p>
              <p>
                Chúng tôi hướng tới việc mở rộng thị trường ra khu vực Đông Nam Á và tạo dựng hình ảnh thời trang Việt Nam chất lượng cao.
              </p>
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold mb-4">Sứ Mệnh</h3>
              <p className="mb-4">
                Cung cấp các sản phẩm thời trang chất lượng, phù hợp với văn hóa và thị hiếu người Việt Nam.
              </p>
              <p>
                Xây dựng một cộng đồng thời trang có ý thức về môi trường và xã hội, đồng thời tạo cơ hội việc làm cho người lao động địa phương.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Sẵn Sàng Trải Nghiệm?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Ghé thăm cửa hàng của chúng tôi hoặc khám phá bộ sưu tập trực tuyến để tìm kiếm phong cách riêng của bạn.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/products"
            className="bg-blue-600 text-white hover:bg-blue-700 transition-colors px-8 py-3 rounded-full font-medium"
          >
            Khám Phá Bộ Sưu Tập
          </a>
          <a
            href="/contact"
            className="bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors px-8 py-3 rounded-full font-medium"
          >
            Liên Hệ Với Chúng Tôi
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;