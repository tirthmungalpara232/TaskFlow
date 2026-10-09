import { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import ChatMemberList from './ChatMemberList';
import GroupChatView from './GroupChatView';
import DirectChatView from './DirectChatView';

// A right-side slide-over so the Kanban board stays available behind it.
// Open with a "Chat" button on ProjectDetails, same trigger pattern as
// InviteModal's "Team members" button.
const ChatPanel = ({ isOpen, onClose, projectId }) => {
  // null => group chat; otherwise the member object being DM'd
  const [activeThread, setActiveThread] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <div className="glass-nav flex h-full w-full max-w-2xl flex-col sm:border-l">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold">
            <MessageCircle size={18} className="text-brand-600 dark:text-brand-400" />
            Project chat
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <ChatMemberList projectId={projectId} activeThread={activeThread} onSelect={setActiveThread} />

          {activeThread ? (
            <DirectChatView key={activeThread._id} projectId={projectId} otherUser={activeThread} />
          ) : (
            <GroupChatView projectId={projectId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
