
import { Component, type ErrorInfo, type ReactNode } from 'react';
import Button from './ui/Button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    color: '#1e293b'
                }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>エラーが発生しました</h1>
                    <p style={{ marginBottom: '2rem', color: '#64748b' }}>
                        申し訳ありません。予期せぬエラーでページを表示できません。<br />
                        再読み込みをお試しください。
                    </p>
                    <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '0.5rem', marginBottom: '2rem', maxWidth: '600px', overflow: 'auto' }}>
                        <code style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                            {this.state.error?.message}
                        </code>
                    </div>
                    <Button onClick={() => window.location.reload()}>
                        ページを再読み込み
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
