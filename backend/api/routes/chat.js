const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
require('dotenv').config();
const { authenticate } = require('../middleware/auth');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function for exponential backoff delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Smart Mock Response System
const getSmartMockResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Patterns và responses
  const patterns = [
    {
      keywords: ['hello', 'hi', 'xin chào', 'chào', 'hey', 'bro'],
      response: 'Xin chào bạn! 👋 Tôi là trợ lý AI của Thời Trang XYZ. Bạn cần hỗ trợ gì hôm nay? Tôi có thể giúp bạn tìm sản phẩm, tư vấn size, hoặc hướng dẫn xem 3D!'
    },
    {
      keywords: ['sản phẩm', 'product', 'áo', 'quần', 'váy', 'giày', 'thời trang'],
      response: 'Chúng tôi có nhiều sản phẩm thời trang đa dạng! 👗👔 Bạn có thể duyệt qua danh mục sản phẩm hoặc sử dụng tính năng tìm kiếm. Mỗi sản phẩm đều có hỗ trợ xem 3D để bạn có trải nghiệm tốt nhất!'
    },
    {
      keywords: ['3d', 'xem 3d', '3 chiều', 'three d'],
      response: 'Tính năng xem 3D của chúng tôi rất tuyệt vời! 🔄 Cho phép bạn xem sản phẩm từ mọi góc độ, xoay 360 độ. Chỉ cần click vào nút "Xem 3D" trên trang sản phẩm để trải nghiệm nhé!'
    },
    {
      keywords: ['size', 'kích thước', 'kích cỡ', 'đo size'],
      response: 'Chúng tôi có bảng size chi tiết cho từng sản phẩm! 📏 Bạn có thể xem hướng dẫn đo size hoặc liên hệ để được tư vấn size phù hợp nhất. Size chuẩn sẽ giúp bạn tự tin hơn!'
    },
    {
      keywords: ['giá', 'price', 'tiền', 'cost', 'bao nhiêu'],
      response: 'Giá cả của chúng tôi rất cạnh tranh! 💰 Bạn có thể xem giá trực tiếp trên trang sản phẩm. Chúng tôi cũng thường có các chương trình khuyến mãi hấp dẫn để bạn tiết kiệm hơn!'
    },
    {
      keywords: ['mã giảm giá', 'coupon', 'discount', 'khuyến mãi', 'voucher'],
      response: 'Chúng tôi thường xuyên có các mã giảm giá và chương trình khuyến mãi! 🎉 Bạn có thể kiểm tra mục "Khuyến mãi" hoặc đăng ký nhận thông báo để không bỏ lỡ ưu đãi nào.'
    },
    {
      keywords: ['giao hàng', 'ship', 'vận chuyển', 'delivery'],
      response: 'Chúng tôi hỗ trợ giao hàng toàn quốc! 🚚 Nhiều phương thức vận chuyển nhanh chóng. Phí ship được tính tự động khi bạn nhập địa chỉ. Đơn hàng trên 500k được miễn phí ship!'
    },
    {
      keywords: ['thanh toán', 'payment', 'momo', 'vnpay', 'cod'],
      response: 'Chúng tôi hỗ trợ nhiều phương thức thanh toán tiện lợi: 💳 COD, MoMo, VNPay, và chuyển khoản ngân hàng. Tất cả đều an toàn và bảo mật 100%!'
    },
    {
      keywords: ['help', 'giúp', 'hỗ trợ', 'support'],
      response: 'Tôi luôn sẵn sàng hỗ trợ bạn! 💪 Bạn có thể hỏi về sản phẩm, tư vấn thời trang, hướng dẫn mua hàng, hoặc bất kỳ vấn đề nào khác. Cứ thoải mái nhé!'
    },
    {
      keywords: ['màu', 'color', 'màu sắc'],
      response: 'Chúng tôi có đa dạng màu sắc cho từng sản phẩm! 🌈 Bạn có thể xem tất cả màu có sẵn trên trang sản phẩm, và sử dụng tính năng 3D để xem màu thật nhất.'
    }
  ];
  
  // Tìm pattern phù hợp
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return {
        success: true,
        model_used: 'smart-mock',
        reply: pattern.response
      };
    }
  }
  
  // Default response cho câu hỏi không match
  return {
    success: true,
    model_used: 'smart-mock',
    reply: `Cảm ơn bạn đã liên hệ với Thời Trang XYZ! Tôi hiểu bạn quan tâm về "${message}". 

Tôi có thể hỗ trợ bạn về:
• 👗 Tư vấn sản phẩm và size
• 🔄 Hướng dẫn xem sản phẩm 3D  
• 💰 Thông tin về giá cả và khuyến mãi
• 🚚 Chính sách giao hàng và thanh toán
• 💳 Các phương thức thanh toán

Bạn có thể hỏi cụ thể hơn không? (Hiện tại hệ thống đang dùng chế độ demo 🤖)`
  };
};

// Route POST /api/chat
router.post('/', authenticate, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Vui lòng cung cấp message' });
  }

  console.log('[Chat] Gửi message tới OpenAI:', message);

  // Validate API key - nếu không có thì dùng mock luôn
  if (!process.env.OPENAI_API_KEY) {
    console.error('[Chat] Lỗi: OPENAI_API_KEY không được cấu hình trong .env');
    console.warn('[Chat] Sử dụng smart mock response do thiếu API key');
    return res.json(getSmartMockResponse(message));
  }

  const models = ['gpt-3.5-turbo']; // Chỉ dùng 3.5-turbo
  const maxRetries = 1; // Không retry nhiều

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Chat] Đang thử model: ${model} (lần ${attempt})`);

        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { 
              role: 'system', 
              content: 'Bạn là trợ lý AI của website Thời Trang XYZ. Website này bán sản phẩm thời trang và hỗ trợ xem sản phẩm 3D. Luôn trả lời theo ngữ cảnh website này và giữ giọng điệu thân thiện, hữu ích. Trả lời ngắn gọn và súc tích.' 
            },
            { role: 'user', content: message },
          ],
          max_tokens: 300, // Giảm tokens để tiết kiệm
          temperature: 0.7,
        });

        console.log(`[Chat] Nhận từ OpenAI (model ${model}):`, completion.choices[0].message.content);

        return res.json({
          success: true,
          model_used: model,
          reply: completion.choices[0].message.content,
        });

      } catch (error) {
        const status = error.response?.status || 500;
        const errorMsg = error.response?.data?.error?.message || error.message;

        console.error(`[Chat] Lỗi khi gọi model ${model} (lần ${attempt}):`, status, errorMsg);

        // Xử lý lỗi quota (429) - Chuyển thẳng sang smart mock
        if (status === 429) {
          console.warn(`[Chat] Model ${model} bị lỗi quota (429). Chuyển sang smart mock response.`);
          return res.json(getSmartMockResponse(message));
        } 
        // Xử lý lỗi authentication (401)
        else if (status === 401) {
          console.error('[Chat] Lỗi xác thực: API key không hợp lệ');
          console.warn('[Chat] Sử dụng smart mock response do API key không hợp lệ');
          return res.json(getSmartMockResponse(message));
        } 
        // Các lỗi khác
        else {
          console.error(`[Chat] Lỗi khác với model ${model}:`, errorMsg);
          if (attempt < maxRetries) {
            await delay(1000);
            continue;
          } else {
            break; // Chuyển sang fallback
          }
        }
      }
    }
  }

  // Fallback to smart mock response if all models fail
  console.warn('[Chat] Tất cả các model đều thất bại. Trả về smart mock response.');
  return res.json(getSmartMockResponse(message));
});

module.exports = router;