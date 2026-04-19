import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Shown in UI and logs, e.g. "Exam session" */
  context?: string;
};

type State = {
  hasError: boolean;
  message?: string;
};

/**
 * Catches render errors in child tree so the whole app does not unmount.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', this.props.context ?? 'app', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            maxWidth: 520,
            margin: '2rem auto',
            fontFamily: 'system-ui, sans-serif',
            lineHeight: 1.5,
          }}
        >
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Something went wrong</h1>
          {this.props.context ? (
            <p style={{ color: '#666', marginBottom: '0.5rem' }}>{this.props.context}</p>
          ) : null}
          {this.state.message ? (
            <pre
              style={{
                fontSize: '0.85rem',
                background: '#f5f5f5',
                padding: '0.75rem',
                borderRadius: 6,
                overflow: 'auto',
              }}
            >
              {this.state.message}
            </pre>
          ) : null}
          <button
            type="button"
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
