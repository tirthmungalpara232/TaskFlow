import { Component } from 'react';
import { AlertCircle } from 'lucide-react';

// Catches any render-time error anywhere below it in the tree and shows a
// friendly screen instead of the blank white page React normally leaves behind.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('TaskFlow crashed:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center dark:bg-slate-950">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950">
            <AlertCircle size={22} className="text-red-600 dark:text-red-400" />
          </div>
          <h1 className="font-display text-lg font-semibold">Something went wrong</h1>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            TaskFlow ran into an unexpected error. Your data is safe — try reloading the page.
          </p>
          <button onClick={this.handleReload} className="btn-primary mt-2">
            Reload TaskFlow
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
