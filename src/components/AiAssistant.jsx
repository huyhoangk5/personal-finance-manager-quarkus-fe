import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Bot, X, Send, Loader, ChevronDown, Sparkles, CheckCircle, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import './AiAssistant.css';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Floating AI Assistant - Trợ lý ảo tích hợp cho cả 2 chức năng:
 * 1. Nhập liệu thông minh (Smart Data Entry)
 * 2. Chatbot hỏi đáp (Q&A Chatbot)
 *
 * Người dùng không cần phân biệt - chỉ cần nói chuyện tự nhiên.
 * AI sẽ tự nhận diện ý định và xử lý phù hợp.
 */
const AiAssistant = ({ onTransactionSaved }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'ai',
      type: 'text',
      content: 'Xin chào! 👋 Tôi là trợ lý tài chính AI của WalletZen.\n\nTôi có thể giúp bạn:\n• **Ghi giao dịch nhanh** — chỉ cần nói, VD: _"Sáng nay ăn phở 50k"_\n• **Hỏi về tài chính** — VD: _"Tháng này tôi chi bao nhiêu tiền ăn uống?"_\n\nBạn muốn làm gì?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [previousContext, setPreviousContext] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Auto-scroll xuống khi có tin nhắn mới hoặc khi mở khung chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input khi mở chatbox
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Cleanup EventSource khi component unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]);
  }, []);

  const updateLastMessage = useCallback((updater) => {
    setMessages(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last) updated[updated.length - 1] = { ...last, ...updater(last) };
      return updated;
    });
  }, []);

  // ─── Smart Router ─────────────────────────────────────────────────────────
  // v2 — timeout 30s, refresh token cải thiện
  /**
   * Phát hiện câu hỏi vs lệnh giao dịch bằng heuristic đơn giản.
   * Nếu là câu hỏi → đi thẳng đến chatbot (tiết kiệm 1 lần gọi AI).
   * Nếu là lệnh giao dịch → đi qua parse-transaction trước.
   */
  const isLikelyChatQuestion = (text) => {
    const lower = text.toLowerCase().trim();
    // Các từ khóa câu hỏi rõ ràng
    const questionKeywords = [
      'bao nhiêu', 'như thế nào', 'tại sao', 'vì sao', 'thế nào',
      'có không', 'được không', 'có thể', 'nên', 'có nên',
      'tháng này', 'tháng trước', 'so với', 'xu hướng', 'phân tích',
      'tổng chi', 'tổng thu', 'số dư', 'còn lại', 'tiết kiệm',
      'lời khuyên', 'gợi ý', 'giúp tôi', 'cho tôi biết',
      '?', 'là gì', 'ở đâu', 'khi nào',
    ];
    // Các từ khóa giao dịch rõ ràng
    const transactionKeywords = [
      'chi ', 'mua ', 'trả ', 'thanh toán', 'nạp', 'rút',
      'nhận', 'lương', 'thưởng', 'thu nhập', 'tiền về',
      'k ', 'nghìn', 'triệu', 'đồng', 'vnd',
    ];

    const hasQuestion = questionKeywords.some(kw => lower.includes(kw));
    const hasTransaction = transactionKeywords.some(kw => lower.includes(kw));
    // Có số tiền (chữ số đứng trước hoặc sau đơn vị)
    const hasAmount = /\d/.test(lower) && (
      /\d+\s*(k|nghìn|triệu|tr|đồng|vnd)/i.test(lower) ||
      /(k|nghìn|triệu|tr)\s*\d/i.test(lower) ||
      /\d{4,}/.test(lower) // Số >= 4 chữ số (1000 trở lên)
    );

    // Nếu có dấu hiệu giao dịch RÕ RÀNG (từ khóa + số tiền) → KHÔNG phải câu hỏi
    if (hasTransaction && hasAmount) return false;
    // Nếu rõ ràng là câu hỏi và không có dấu hiệu giao dịch → là chat
    if (hasQuestion && !hasTransaction) return true;
    // Có câu hỏi lẫn giao dịch → ưu tiên route sang parse-transaction để AI quyết định
    if (hasQuestion && hasTransaction) return false;
    // Mặc định: câu ngắn không có dấu hiệu giao dịch → chat
    const wordCount = lower.split(/\s+/).length;
    return wordCount > 10 && !hasTransaction;
  };

  // ─── Xử lý gửi tin nhắn ──────────────────────────────────────────────────

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    addMessage({ role: 'user', type: 'text', content: text });
    setIsLoading(true);

    // Kiểm tra xem đây là lệnh liên quan đến giao dịch đang pending không
    if (pendingTransaction) {
      await handlePendingAction(text);
    } else if (isLikelyChatQuestion(text)) {
      // Câu hỏi rõ ràng → đi thẳng chatbot, tiết kiệm 1 API call
      await handleChatStream(text);
    } else {
      await handleSmartInput(text);
    }
  };

  /**
   * Bước 1: Gửi câu lệnh lên AI để bóc tách ý định.
   * AI sẽ trả về JSON giao dịch (nếu là lệnh ghi giao dịch)
   * hoặc câu hỏi thông thường sẽ được xử lý qua chatbot streaming.
   */
  const handleSmartInput = async (text) => {
    try {
      const res = await axios.post(`${API_URL}/api/ai/parse-transaction`, {
        userMessage: text,
        previousContext: previousContext,
      }, { timeout: 15000 });

      const result = res.data;

      if (result.isComplete) {
        // AI bóc tách được giao dịch đầy đủ → hiển thị preview card
        setPendingTransaction(result);
        setPreviousContext(JSON.stringify(result));
        addMessage({ role: 'ai', type: 'transaction_preview', data: result });
        setIsLoading(false);
      } else if (result.amount !== null || result.categoryName !== null) {
        // AI bóc tách được một phần → yêu cầu bổ sung thông tin
        setPreviousContext(JSON.stringify(result));
        addMessage({ role: 'ai', type: 'text', content: result.message || 'Tôi cần thêm thông tin để ghi giao dịch này. Bạn có thể bổ sung không?' });
        setIsLoading(false);
      } else {
        // Không phải lệnh ghi giao dịch → chuyển sang chatbot hỏi đáp
        await handleChatStream(text);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 || err.code === 'ECONNABORTED') {
        // Lỗi quota/timeout → thông báo thân thiện, không gọi thêm request
        addMessage({
          role: 'ai',
          type: 'text',
          content: '⏳ Hệ thống AI đang bận, vui lòng thử lại sau 1 phút!'
        });
        setIsLoading(false);
      } else if (status >= 400 && status < 500 && status !== 401) {
        // Lỗi client (không phải auth) → thử chatbot
        await handleChatStream(text);
      } else {
        addMessage({
          role: 'ai',
          type: 'text',
          content: '❌ Trợ lý ảo hiện không thể kết nối. Vui lòng thử lại sau!'
        });
        setIsLoading(false);
      }
    }
  };

  /**
   * Xử lý khi người dùng đang có giao dịch chờ xác nhận.
   * Hỗ trợ cả: nhấn nút bấm và gõ câu tự nhiên để xác nhận/hủy/chỉnh sửa.
   */
  const handlePendingAction = async (text) => {
    const lowerText = text.toLowerCase();

    const words = lowerText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    let isConfirm = false;
    let isCancel = false;

    if (wordCount <= 4) {
      const confirmKeywords = ['lưu', 'xác nhận', 'ok', 'đúng', 'save', 'đồng ý', 'được', 'oke', 'yes', 'chuẩn'];
      const cancelKeywords = ['hủy', 'thôi', 'cancel', 'bỏ', 'no'];
      const isJustNo = lowerText === 'không' || lowerText === 'không ạ' || lowerText === 'ko';
      
      isConfirm = confirmKeywords.some(kw => lowerText.includes(kw));
      isCancel = isJustNo || cancelKeywords.some(kw => lowerText.includes(kw));
    }

    if (isConfirm && !isCancel) {
      await confirmTransaction(pendingTransaction);
    } else if (isCancel && !isConfirm) {
      cancelTransaction();
    } else {
      // Người dùng muốn chỉnh sửa → gửi lại cho AI với context cũ
      try {
        const res = await axios.post(`${API_URL}/api/ai/parse-transaction`, {
          userMessage: text,
          previousContext: previousContext,
        }, { timeout: 15000 });
        const result = res.data;
        if (result.isComplete) {
          setPendingTransaction(result);
          setPreviousContext(JSON.stringify(result));
          addMessage({ role: 'ai', type: 'transaction_preview', data: result, isUpdate: true });
        } else {
          addMessage({ role: 'ai', type: 'text', content: result.message || 'Vui lòng cung cấp thêm thông tin.' });
        }
      } catch (err) {
        addMessage({ role: 'ai', type: 'text', content: 'Có lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const markLastPreviewAs = (status) => {
    setMessages(prev => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].type === 'transaction_preview' && !updated[i].data.status) {
          updated[i] = { ...updated[i], data: { ...updated[i].data, status } };
          break;
        }
      }
      return updated;
    });
  };

  /**
   * Xác nhận và lưu giao dịch (được gọi khi bấm nút hoặc nói lệnh xác nhận).
   */
  const confirmTransaction = async (txData) => {
    try {
      const res = await axios.post(`${API_URL}/api/ai/confirm-transaction`, {
        amount: txData.amount,
        type: txData.type,
        categoryId: txData.categoryId,
        newCategoryName: txData.newCategoryRequired ? txData.categoryName : null,
        date: txData.date,
        note: txData.note,
      });

      setPendingTransaction(null);
      setPreviousContext(null);
      markLastPreviewAs('confirmed');

      addMessage({
        role: 'ai',
        type: 'success',
        content: `✅ ${res.data.message || 'Giao dịch đã được lưu thành công!'}`
      });

      // Trigger refresh Dashboard
      if (onTransactionSaved) onTransactionSaved();

    } catch (err) {
      addMessage({
        role: 'ai',
        type: 'text',
        content: `❌ ${err.response?.data?.error || 'Lỗi khi lưu giao dịch. Vui lòng thử lại.'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelTransaction = () => {
    setPendingTransaction(null);
    setPreviousContext(null);
    markLastPreviewAs('cancelled');
    setIsLoading(false);
    addMessage({ role: 'ai', type: 'text', content: 'Đã hủy giao dịch. Bạn có muốn ghi giao dịch khác không? 😊' });
  };

  /**
   * Gọi chatbot streaming qua SSE.
   * Có timeout 30 giây: nếu không kết nối được trong 30s → báo lỗi ngay.
   */
  const handleChatStream = async (text) => {
    const aiMsgId = Date.now() + Math.random();
    console.log('[AiAssistant v2] handleChatStream, timeout=30s, text:', text.substring(0,40));
    addMessage({ id: aiMsgId, role: 'ai', type: 'streaming', content: '' });

    // AbortController để có thể hủy fetch khi timeout
    const controller = new AbortController();

    // Timeout 30 giây cho lần kết nối ban đầu (tool calling có thể mất 15-25s)
    const connectTimeout = setTimeout(() => {
      controller.abort();
    }, 30000);

    try {
      // Lấy token mới nhất từ localStorage (đã được refresh bởi axios interceptor)
      let token = localStorage.getItem('accessToken');

      const makeChatRequest = (authToken) => fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ message: text, sessionId }),
        signal: controller.signal,
      });

      let response = await makeChatRequest(token);

      // Nếu 401 → thử refresh token rồi retry
      if (response.status === 401) {
        try {
          // Dùng axios để trigger interceptor tự động refresh token
          await axios.post(`${API_URL}/api/users/refresh-token`, {
            refreshToken: localStorage.getItem('refreshToken')
          });
          token = localStorage.getItem('accessToken');
          response = await makeChatRequest(token);
        } catch (refreshErr) {
          // Refresh thất bại → redirect về login
          window.location.href = '/login';
          return;
        }
      }

      clearTimeout(connectTimeout); // Đã kết nối được → hủy timeout ban đầu

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let newSessionId = sessionId;
      let isDone = false;
      let transactionSavedInChat = false;

      setIsLoading(false); // Dừng hiệu ứng loading dots, bắt đầu hiển thị stream

      // Timeout reset khi nhận được data - nếu 45s không có data mới → hủy
      let dataTimeout = null;
      const resetDataTimeout = () => {
        clearTimeout(dataTimeout);
        dataTimeout = setTimeout(() => {
          reader.cancel();
        }, 45000);
      };
      resetDataTimeout();

      while (!isDone) {
        const { done, value } = await reader.read();
        if (done) break;

        resetDataTimeout(); // Reset timeout mỗi khi nhận chunk mới

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          // Hỗ trợ cả "data: " (chuẩn SSE) và "data:" (không có space)
          if (line.startsWith('data:')) {
            const data = line.startsWith('data: ')
              ? line.substring(6)
              : line.substring(5);
            if (data === '[DONE]') {
              // Chuyển message từ streaming → text hoàn chỉnh
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, type: 'text', content: fullContent || '(Không có phản hồi)' } : m
              ));
              // Nếu chatbot đã lưu giao dịch → trigger refresh Dashboard
              if (transactionSavedInChat && onTransactionSaved) {
                onTransactionSaved();
              }
              isDone = true;
              break;
            } else if (data.startsWith('[SESSION_ID] ')) {
              newSessionId = data.substring(13).trim();
              if (newSessionId && newSessionId !== sessionId) {
                setSessionId(newSessionId);
              }
            } else if (data.trim()) {
              // Parse JSON-wrapped token để bảo toàn khoảng trắng
              let tokenText = data;
              try {
                const parsed = JSON.parse(data);
                if (parsed && parsed.t !== undefined) {
                  tokenText = parsed.t;
                }
              } catch {
                // Fallback: dùng raw text nếu không phải JSON
                tokenText = data.replace(/\\n/g, '\n');
              }
              fullContent += tokenText;
              // Detect khi chatbot báo đã lưu giao dịch thành công
              if (tokenText.includes('✅') || fullContent.includes('Đã lưu giao dịch')) {
                transactionSavedInChat = true;
              }
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, content: fullContent } : m
              ));
            }
          }
        }
      }

      clearTimeout(dataTimeout);

      // Nếu stream kết thúc nhưng chưa nhận [DONE] (bị cắt giữa chừng)
      if (!isDone && fullContent) {
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, type: 'text', content: fullContent } : m
        ));
      } else if (!isDone && !fullContent) {
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, type: 'text', content: '⏳ Hệ thống AI đang bận. Vui lòng thử lại sau ít phút!' } : m
        ));
      }

    } catch (err) {
      clearTimeout(connectTimeout);
      const isTimeout = err.name === 'AbortError';
      const isQuota = err.message && err.message.includes('429');
      const errMsg = isTimeout
        ? '⏳ AI mất quá nhiều thời gian phản hồi. Vui lòng thử lại!'
        : isQuota
          ? '⏳ Hệ thống AI đang bận. Vui lòng đợi 1 phút rồi thử lại!'
          : `❌ Trợ lý ảo hiện không thể kết nối (${err.message?.substring(0,60) || 'unknown'}). Vui lòng thử lại sau!`;
      console.error('[AiAssistant] handleChatStream error:', err.name, err.message);
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId ? { ...m, type: 'text', content: errMsg } : m
      ));
      setIsLoading(false);
    }
  };


  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'ai',
      type: 'text',
      content: 'Cuộc trò chuyện mới đã bắt đầu! Tôi có thể giúp gì cho bạn? 😊',
    }]);
    setSessionId(null);
    setPendingTransaction(null);
    setPreviousContext(null);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        id="ai-assistant-fab"
        className={`ai-fab ${isOpen ? 'ai-fab--open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Mở trợ lý AI"
        title="Trợ lý AI WalletZen"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
        {!isOpen && <span className="ai-fab__badge">AI</span>}
      </button>

      {/* Chatbox Panel */}
      {isOpen && (
        <div className="ai-chatbox" role="dialog" aria-label="Trợ lý ảo AI WalletZen">
          {/* Header */}
          <div className="ai-chatbox__header">
            <div className="ai-chatbox__header-info">
              <div className="ai-chatbox__avatar">
                <Bot size={18} color="white" />
              </div>
              <div>
                <div className="ai-chatbox__title">WalletZen AI</div>
                <div className="ai-chatbox__subtitle">
                  <span className="ai-chatbox__online-dot" />
                  Đang hoạt động
                </div>
              </div>
            </div>
            <div className="ai-chatbox__header-actions">
              <button onClick={clearChat} className="ai-chatbox__icon-btn" title="Cuộc trò chuyện mới">
                <Trash2 size={16} />
              </button>
              <button onClick={() => setIsOpen(false)} className="ai-chatbox__icon-btn" title="Thu nhỏ">
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="ai-chatbox__messages" id="ai-messages-container">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onConfirm={() => { setIsLoading(true); confirmTransaction(pendingTransaction); }}
                onCancel={cancelTransaction}
                onEdit={(text) => {
                  setInput(text);
                  inputRef.current?.focus();
                }}
              />
            ))}
            {isLoading && (
              <div className="ai-message ai-message--ai">
                <div className="ai-message__avatar"><Bot size={14} /></div>
                <div className="ai-message__bubble ai-message__bubble--typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="ai-chatbox__input-area">
            {pendingTransaction && (
              <div className="ai-chatbox__pending-hint">
                💡 Giao dịch đang chờ xác nhận. Gõ <b>"lưu"</b> để lưu hoặc <b>"hủy"</b> để bỏ qua.
              </div>
            )}
            <div className="ai-chatbox__input-row">
              <textarea
                ref={inputRef}
                id="ai-assistant-input"
                className="ai-chatbox__input"
                placeholder="Nhập câu lệnh hoặc câu hỏi tài chính..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isLoading}
              />
              <button
                id="ai-assistant-send"
                className={`ai-chatbox__send-btn ${(!input.trim() || isLoading) ? 'ai-chatbox__send-btn--disabled' : ''}`}
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                title="Gửi"
              >
                {isLoading ? <Loader size={18} className="spin" /> : <Send size={18} />}
              </button>
            </div>
            <div className="ai-chatbox__footer-note">
              WalletZen AI · Được cung cấp bởi Groq Llama 3
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Message Bubble Component ─────────────────────────────────────────────────

const MessageBubble = ({ msg, onConfirm, onCancel }) => {
  const isUser = msg.role === 'user';

  if (msg.type === 'transaction_preview') {
    return <TransactionPreviewCard data={msg.data} isUpdate={msg.isUpdate} onConfirm={onConfirm} onCancel={onCancel} />;
  }

  return (
    <div className={`ai-message ${isUser ? 'ai-message--user' : 'ai-message--ai'}`}>
      {!isUser && (
        <div className="ai-message__avatar">
          <Bot size={14} />
        </div>
      )}
      <div className={`ai-message__bubble ${msg.type === 'success' ? 'ai-message__bubble--success' : ''} ${msg.type === 'streaming' ? 'ai-message__bubble--streaming' : ''}`}>
        <MarkdownText text={msg.content} />
        {msg.type === 'streaming' && msg.content === '' && (
          <span className="ai-message__cursor" />
        )}
      </div>
    </div>
  );
};

// ─── Transaction Preview Card ─────────────────────────────────────────────────

const TransactionPreviewCard = ({ data, isUpdate, onConfirm, onCancel }) => {
  const isExpense = data.type === 'CHI';
  const today = new Date().toISOString().split('T')[0];
  const isResolved = data.status === 'confirmed' || data.status === 'cancelled';

  return (
    <div className="ai-message ai-message--ai">
      <div className="ai-message__avatar"><Bot size={14} /></div>
      <div className="ai-tx-card">
        <div className="ai-tx-card__header">
          <span>{isUpdate ? '📝 Đã cập nhật giao dịch' : '📋 Bản xem trước giao dịch'}</span>
          {data.newCategoryRequired && (
            <span className="ai-tx-card__new-badge">Danh mục mới</span>
          )}
        </div>

        <div className="ai-tx-card__body">
          <div className="ai-tx-card__amount" style={{ color: isExpense ? 'var(--danger)' : 'var(--success)' }}>
            {isExpense ? '−' : '+'}{(data.amount || 0).toLocaleString('vi-VN')} ₫
          </div>
          <div className="ai-tx-card__fields">
            <div className="ai-tx-card__field">
              <span className="ai-tx-card__label">Loại</span>
              <span className={`ai-tx-card__value ai-tx-card__badge ${isExpense ? 'ai-tx-card__badge--expense' : 'ai-tx-card__badge--income'}`}>
                {isExpense ? 'Chi tiêu' : 'Thu nhập'}
              </span>
            </div>
            <div className="ai-tx-card__field">
              <span className="ai-tx-card__label">Danh mục</span>
              <span className="ai-tx-card__value">{data.categoryName || '—'}</span>
            </div>
            <div className="ai-tx-card__field">
              <span className="ai-tx-card__label">Ngày</span>
              <span className="ai-tx-card__value">{data.date || today}</span>
            </div>
            {data.note && (
              <div className="ai-tx-card__field">
                <span className="ai-tx-card__label">Ghi chú</span>
                <span className="ai-tx-card__value">{data.note}</span>
              </div>
            )}
          </div>

          {data.newCategoryRequired && (
            <div className="ai-tx-card__warning">
              <AlertTriangle size={14} />
              <span>Danh mục <b>"{data.categoryName}"</b> chưa có. Hệ thống sẽ tự động tạo mới khi bạn xác nhận.</span>
            </div>
          )}
        </div>

        <div className="ai-tx-card__actions">
          {data.status === 'confirmed' && (
            <button className="ai-tx-card__btn ai-tx-card__btn--confirm" disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
              <CheckCircle size={15} /> Đã lưu
            </button>
          )}
          {data.status === 'cancelled' && (
            <button className="ai-tx-card__btn ai-tx-card__btn--cancel" disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
              <X size={15} /> Đã hủy
            </button>
          )}
          {!isResolved && (
            <>
              <button id="ai-confirm-transaction-btn" className="ai-tx-card__btn ai-tx-card__btn--confirm" onClick={onConfirm}>
                <CheckCircle size={15} /> Xác nhận Lưu
              </button>
              <button id="ai-cancel-transaction-btn" className="ai-tx-card__btn ai-tx-card__btn--cancel" onClick={onCancel}>
                <X size={15} /> Hủy
              </button>
            </>
          )}
        </div>
        {!isResolved && (
          <div className="ai-tx-card__hint">
            💬 Hoặc gõ <b>"lưu"</b> / <b>"hủy"</b> / yêu cầu chỉnh sửa bên dưới
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Simple Markdown Renderer ─────────────────────────────────────────────────

const MarkdownText = ({ text }) => {
  if (!text) return null;
  // Xử lý **bold**, *italic*, _italic_, dòng mới
  const html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export default AiAssistant;
