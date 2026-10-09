import { useEffect, useRef, useState } from 'react';
import { Send, Lock } from 'lucide-react';
import Avatar from '../Avatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getDirectMessages, sendDirectMessage } from '../../api/chat';

const DirectChatView = ({ projectId, otherUser }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getDirectMessages(projectId, otherUser._id)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [projectId, otherUser._id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join-dm', { projectId, otherUserId: otherUser._id });

    const onDirectMessage = (msg) => setMessages((prev) => [...prev, msg]);
    socket.on('direct-message', onDirectMessage);

    return () => {
      socket.emit('leave-dm', { projectId, otherUserId: otherUser._id });
      socket.off('direct-message', onDirectMessage);
    };
  }, [socket, projectId, otherUser._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText('');
    try {
      const saved = await sendDirectMessage(projectId, otherUser._id, content);
      if (!socket?.connected) setMessages((prev) => [...prev, saved]); // fallback if no socket
    } catch {
      setText(content);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
        <Avatar name={otherUser.name} src={otherUser.avatar} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {otherUser.name} {otherUser.isOwner && <span className="text-slate-400">(Owner)</span>}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-slate-400">
            <Lock size={10} /> Only visible to you two
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {loading && <p className="text-center text-xs text-slate-400">Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-xs text-slate-400">
            No messages yet — start the conversation.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender._id === user._id;
          return (
            <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? 'rounded-br-sm bg-brand-600 text-white'
                    : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 p-2.5 dark:border-slate-800">
        <input
          className="input-field"
          placeholder={`Message ${otherUser.name}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary flex shrink-0 items-center px-3" disabled={!text.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default DirectChatView;
