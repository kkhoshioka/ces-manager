
import React from 'react';
import { Loader2, Server, Coffee } from 'lucide-react';

const ServerAwakeOverlay: React.FC = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0f172a', // Slate 900
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            color: '#f8fafc',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{
                position: 'relative',
                marginBottom: '2rem'
            }}>
                <Server size={64} color="#3b82f6" style={{ opacity: 0.8 }} />
                <div style={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    animation: 'bounce 2s infinite'
                }}>
                    <Coffee size={32} color="#f59e0b" />
                </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                サーバーを起動しています...
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem', textAlign: 'center', maxWidth: '400px', lineHeight: '1.6' }}>
                しばらくアクセスがなかったため、サーバーがスリープモードになっています。<br />
                起動まで1分ほどかかる場合があります。
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#1e293b', padding: '0.75rem 1.5rem', borderRadius: '9999px', border: '1px solid #334155' }}>
                <Loader2 className="animate-spin" size={20} color="#3b82f6" />
                <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>接続待機中...</span>
            </div>

            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ServerAwakeOverlay;
