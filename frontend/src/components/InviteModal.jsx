import { useState } from 'react';
import { X, UserPlus, Trash2 } from 'lucide-react';
import api from '../api/axios';
import ConfirmDialog from './ConfirmDialog';
import Avatar from './Avatar';

const InviteModal = ({ isOpen, onClose, project, isOwner, onProjectUpdate }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);

  if (!isOpen) return null;

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await api.post(`/projects/${project._id}/invite`, { email });
      setMessage(data.message);
      setEmail('');
      if (data.project) onProjectUpdate(data.project);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the invite.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = (memberId) => {
    setPendingRemove(memberId);
  };

  const confirmRemove = async () => {
    const memberId = pendingRemove;
    setPendingRemove(null);
    try {
      await api.delete(`/projects/${project._id}/members/${memberId}`);
      onProjectUpdate({
        ...project,
        members: project.members.filter((m) => m._id !== memberId),
      });
    } catch (err) {
      setError('Could not remove this member.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md animate-pop-in p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Team members</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Avatar name={project.user?.name} src={project.user?.avatar} size="md" />
              <div>
                <p className="text-sm font-medium">{project.user?.name || 'Owner'}</p>
                <p className="text-xs text-slate-400">Owner</p>
              </div>
            </div>
          </div>

          {project.members?.map((member) => (
            <div key={member._id} className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Avatar name={member.name} src={member.avatar} size="md" />
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-slate-400">{member.email}</p>
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleRemove(member._id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                  aria-label={`Remove ${member.name}`}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}

          {project.pendingInvites?.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {project.pendingInvites.map((pendingEmail) => (
                <p key={pendingEmail} className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  {pendingEmail} — invited, awaiting sign-up
                </p>
              ))}
            </div>
          )}
        </div>

        {isOwner ? (
          <form onSubmit={handleInvite} className="space-y-3">
            <label className="block text-sm font-medium">Invite by email</label>
            <div className="flex gap-2">
              <input
                type="email"
                className="input-field"
                placeholder="teammate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" disabled={submitting} className="btn-primary flex shrink-0 items-center gap-1.5 px-3">
                <UserPlus size={16} />
              </button>
            </div>
            {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </form>
        ) : (
          <p className="text-xs text-slate-400">Only the project owner can invite or remove team members.</p>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!pendingRemove}
        title="Remove this team member?"
        message="They'll lose access to this project's tasks and board immediately."
        confirmLabel="Remove"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
};

export default InviteModal;
