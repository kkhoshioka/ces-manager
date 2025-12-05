import React from 'react';

const Dashboard: React.FC = () => {
    return (
        <div>
            <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>ダッシュボード</h1>
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                <p>ようこそ、CES Managerへ。</p>
            </div>
        </div>
    );
};

export default Dashboard;
