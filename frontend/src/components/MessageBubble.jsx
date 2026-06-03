import React from 'react';
const MessageBubble = ({
  message,
  isOwn,
  status = 'SENT',
  onEditRequest,
  onReplyRequest
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Helper to parse tags
  const renderTextWithTags = (text) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-indigo-400 font-bold bg-indigo-500/10 px-1 rounded">{part}</span>;
      }
      return part;
    });
  };
  const content = message.content || '';
  const dateStr = message.createdAt 
    ? (message.createdAt.endsWith('Z') ? message.createdAt : message.createdAt + 'Z') 
    : null;
  const time = dateStr ? new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Now';
  
  const isEditable = isOwn && message.createdAt && (new Date() - new Date(message.createdAt)) < 60 * 60 * 1000;
  
  return <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className={`flex max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 relative`}>
        {!isOwn && <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0 mb-1 border border-slate-600 flex items-center justify-center text-xs font-bold shadow-sm" title={message.sender?.username || message.senderName}>
             {(message.sender?.username?.[0] || message.senderName?.[0] || 'U').toUpperCase()}
          </div>}
        
        <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${isOwn ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'}`}>
          {message.replyToMessageContent && (
            <div className={`mb-2 p-2 rounded border-l-2 text-xs truncate max-w-[200px] sm:max-w-xs ${isOwn ? 'bg-indigo-500/20 border-indigo-300 text-indigo-100' : 'bg-slate-700 border-slate-400 text-slate-300'}`}>
              <span className="font-semibold block mb-0.5">{message.replyToSenderName || 'Someone'}</span>
              {message.replyToMessageContent}
            </div>
          )}
          {message.messageType === 'IMAGE' && message.fileUrl ? (
            <div className="mb-1">
              <img src={`https://chat-web-1-b3uj.onrender.com${message.fileUrl}`} alt="attachment" className="max-w-full rounded-lg max-h-64 object-contain bg-black/10 shadow-sm" />
            </div>
          ) : message.messageType === 'FILE' && message.fileUrl ? (
            <div className="mb-1">
              <a href={`https://chat-web-1-b3uj.onrender.com${message.fileUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-black/10 rounded-lg hover:bg-black/20 transition-colors border border-white/10">
                <svg className="w-8 h-8 mr-3 text-white/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                <span className="font-medium text-sm truncate max-w-[200px]">{content || 'Attachment'}</span>
              </a>
            </div>
          ) : null}
          {content && message.messageType !== 'FILE' && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{renderTextWithTags(content)}</p>
          )}
          <div className={`text-[10px] mt-1 flex items-center justify-end ${isOwn ? 'text-indigo-200' : 'text-slate-500'}`}>
            <span>{time}</span>
            {message.isEdited && <span className="ml-1 italic opacity-75">(edited)</span>}
            {isOwn && status === 'SENT' && (
              <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {isOwn && status === 'DELIVERED' && (
              <svg className="w-3.5 h-3.5 ml-1 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7 M12 13l4 4L24 7" />
              </svg>
            )}
            {isOwn && status === 'READ' && (
              <svg className="w-3.5 h-3.5 ml-1 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7 M12 13l4 4L24 7" />
              </svg>
            )}
          </div>
        </div>
        
        {isHovered && (
          <div className="flex flex-row gap-1 items-center pb-2 shrink-0">
            {isEditable && onEditRequest && (
              <button onClick={() => onEditRequest(message)} className="bg-slate-800 p-1.5 rounded-full shadow-sm border border-slate-600 text-slate-300 hover:text-white hover:bg-indigo-500 transition-colors" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
            )}
            {onReplyRequest && (
              <button onClick={() => onReplyRequest(message)} className="bg-slate-800 p-1.5 rounded-full shadow-sm border border-slate-600 text-slate-300 hover:text-white hover:bg-indigo-500 transition-colors" title="Reply">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v.5"/></svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>;
};
export default MessageBubble;