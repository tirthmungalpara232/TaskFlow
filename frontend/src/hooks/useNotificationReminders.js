import { useEffect } from 'react';
import api from '../api/axios';

const SESSION_FLAG = 'taskflow_reminders_shown';

// On mount: asks for browser notification permission (only if not already
// asked), then checks for tasks due tomorrow and fires one reminder per task.
// Runs once per browser session so it doesn't nag on every page navigation.
const useNotificationReminders = (enabled) => {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return; // unsupported browser (e.g. iOS Safari)
    if (sessionStorage.getItem(SESSION_FLAG)) return;

    const run = async () => {
      let permission = Notification.permission;

      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        sessionStorage.setItem(SESSION_FLAG, '1');
        return;
      }

      try {
        const { data: dueTomorrow } = await api.get('/tasks/due-tomorrow');
        dueTomorrow.forEach((task) => {
          new Notification('Due tomorrow — TaskFlow', {
            body: `${task.title} (${task.project?.title || 'a project'})`,
            tag: task._id, // prevents duplicate notifications for the same task
          });
        });
      } catch (err) {
        // Silently ignore — reminders are a nice-to-have, not critical path
      }

      sessionStorage.setItem(SESSION_FLAG, '1');
    };

    run();
  }, [enabled]);
};

export default useNotificationReminders;
