import { useEffect, useState } from 'react';
import { Hash } from 'lucide-react';
import Avatar from '../Avatar';
import { getConversations } from '../../api/chat';

const ChatMemberList = ({ projectId, activeThread, onSelect }) => {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    getConversations(projectId)
      .then(setMembers)
      .catch(() => {});
  }, [projectId]);

  return (
    <div className="flex w-full shrink-0 flex-col border-b border-slate-200 dark:border-slate-800 sm:w-52 sm:border-b-0 sm:border-r">
      <button
        onClick={() => onSelect(null)}
        className={`flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
          !activeThread
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
        }`}
      >
        <Hash size={14} /> Group chat
      </button>

      <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Direct messages
      </p>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {members.map((m) => (
          <button
            key={m._id}
            onClick={() => onSelect(m)}
            className={`flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
              activeThread?._id === m._id
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
            }`}
          >
            <Avatar name={m.name} src={m.avatar} size="sm" />
            <span className="truncate">{m.name}</span>
            {m.isOwner && (
              <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                Owner
              </span>
            )}
          </button>
        ))}
        {members.length === 0 && (
          <p className="px-3 py-2 text-xs text-slate-400">No other members yet.</p>
        )}
      </div>
    </div>
  );
};

export default ChatMemberList;
