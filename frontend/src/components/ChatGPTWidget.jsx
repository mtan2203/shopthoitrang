import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import axios from 'axios';

const ChatGPTWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  useEffect(() => {
    // Khi mở chat lần đầu, hiển thị welcome message
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        role: 'bot',
        content: 'Xin chào! Tôi là trợ lý AI của Thời Trang XYZ. Bạn có thể hỏi về các sản phẩm thời trang, mã giảm giá, cách xem sản phẩm 3D hoặc bất kỳ thông tin nào bạn cần. Tôi sẵn sàng hỗ trợ bạn!',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { 
      role: 'user', 
      content: input.trim(),
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      console.log('[Chat Widget] Gửi tin nhắn:', input.trim());

      // Gửi message trực tiếp, không cần thêm context dài
      const response = await axios.post('/api/chat',
        { message: input.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // Timeout 30 giây
        }
      );

      console.log('[Chat Widget] Nhận phản hồi:', response.data);

      if (response.data.success && response.data.reply) {
        const botMessage = { 
          role: 'bot', 
          content: response.data.reply,
          model: response.data.model_used,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error('Phản hồi không hợp lệ từ server');
      }

    } catch (err) {
      console.error('Lỗi khi gọi API chat:', err);
      
      let errorMessage = 'Xin lỗi, hiện tại tôi không thể xử lý yêu cầu này. ';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage += 'Kết nối quá chậm, vui lòng thử lại.';
      } else if (err.response?.status === 401) {
        errorMessage += 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.';
      } else if (err.response?.status === 429) {
        errorMessage += 'Hệ thống đang quá tải, vui lòng thử lại sau ít phút.';
      } else if (err.response?.status >= 500) {
        errorMessage += 'Lỗi server, vui lòng thử lại sau.';
      } else {
        errorMessage += 'Vui lòng thử lại sau.';
      }

      const errorBotMessage = { 
        role: 'bot', 
        content: errorMessage,
        isError: true,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          title="Mở chat hỗ trợ"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="w-80 bg-white border rounded-lg shadow-xl flex flex-col max-h-96">
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b bg-blue-600 text-white rounded-t-lg">
            <h3 className="font-medium">Chat với Trợ lý Thời Trang XYZ</h3>
            <button 
              onClick={toggleChat}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
              title="Đóng chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow p-3 overflow-y-auto space-y-3 min-h-64 max-h-72">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-2 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-br-none' 
                      : msg.isError
                        ? 'bg-red-100 text-red-800 rounded-bl-none border border-red-200'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <div className="text-sm">{msg.content}</div>
                  {msg.model && (
                    <div className="text-xs opacity-50 mt-1">
                      via {msg.model}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-2 rounded-lg rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex border-t bg-gray-50">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isLoading ? "Đang xử lý..." : "Nhập tin nhắn..."}
              disabled={isLoading}
              className="flex-grow px-3 py-2 focus:outline-none bg-transparent disabled:opacity-50"
              maxLength={500}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="p-3 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Gửi tin nhắn"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatGPTWidget;