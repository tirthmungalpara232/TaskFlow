import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import Avatar from '../Avatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getGroupMessages, sendGroupMessage } from '../../api/chat';

const GroupChatView = ({ projectId }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getGroupMessages(projectId)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join-project', projectId);

    const onGroupMessage = (msg) => setMessages((prev) => [...prev, msg]);
    socket.on('group-message', onGroupMessage);

    return () => {
      socket.emit('leave-project', projectId);
      socket.off('group-message', onGroupMessage);
    };
  }, [socket, projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText('');
    try {
      const saved = await sendGroupMessage(projectId, content);
      // Only append locally as a fallback — if the socket is connected, the
      // 'group-message' broadcast (which includes our own message) handles this.
      if (!socket?.connected) setMessages((prev) => [...prev, saved]);
    } catch {
      setText(content);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {loading && <p className="text-center text-xs text-slate-400">Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-xs text-slate-400">
            No messages yet — say hi to the team.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender._id === user._id;
          return (
            <div key={m._id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              <Avatar name={m.sender.name} src={m.sender.avatar} size="sm" />
              <div className={`max-w-[75%] ${mine ? 'items-end text-right' : ''}`}>
                {!mine && (
                  <p className="mb-0.5 text-[11px] font-medium text-slate-400">{m.sender.name}</p>
                )}
                <div
                  className={`inline-block rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? 'rounded-br-sm bg-brand-600 text-white'
                      : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 p-2.5 dark:border-slate-800">
        <input
          className="input-field"
          placeholder="Message the whole team..."
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

export default GroupChatView;
