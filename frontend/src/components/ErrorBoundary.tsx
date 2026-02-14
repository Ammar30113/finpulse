"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--fp-bg)] p-6">
          <div className="rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] px-8 py-7 text-center shadow-[var(--fp-shadow)]">
            <h2 className="text-xl font-semibold text-[var(--fp-text)]">
              Something went wrong
            </h2>
            <p className="mt-2 text-[var(--fp-text-muted)]">
              Please try refreshing the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="mt-4 rounded-full bg-[var(--fp-text)] px-4 py-2 text-sm font-medium text-[var(--fp-bg)] transition-opacity hover:opacity-90"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
