import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';

interface SystemSettings {
    defaultLaborRate: string;
    defaultTravelTimeRate: string;
    defaultTravelDistanceRate: string;
    [key: string]: string;
}

const SystemSettingsMaster: React.FC = () => {
    const [settings, setSettings] = useState<SystemSettings>({
        defaultLaborRate: '8000',
        defaultTravelTimeRate: '3000',
        defaultTravelDistanceRate: '50'
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            // Adjust API_BASE_URL as needed, assuming relative proxy or global const
            const res = await fetch('http://localhost:3000/api/system-settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Failed to load settings', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/system-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: '設定を保存しました' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            setMessage({ type: 'error', text: '保存に失敗しました' });
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                システム設定（デフォルト単価）
            </h2>

            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: message.type === 'success' ? '#166534' : '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <AlertCircle size={20} />
                    {message.text}
                </div>
            )}

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>
                        自社工賃 単価 (円/時間)
                    </label>
                    <input
                        type="number"
                        name="defaultLaborRate"
                        value={settings.defaultLaborRate}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                    />
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                        修理案件の「自社工賃」追加時のデフォルト単価です
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>
                        出張費（移動時間） 単価 (円/時間)
                    </label>
                    <input
                        type="number"
                        name="defaultTravelTimeRate"
                        value={settings.defaultTravelTimeRate}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>
                        出張費（移動距離） 単価 (円/km)
                    </label>
                    <input
                        type="number"
                        name="defaultTravelDistanceRate"
                        value={settings.defaultTravelDistanceRate}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                    />
                </div>

                <div style={{ textAlign: 'right', marginTop: '2rem' }}>
                    <button
                        onClick={handleSave}
                        style={{
                            backgroundColor: '#0f172a',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.375rem',
                            fontWeight: 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            border: 'none'
                        }}
                    >
                        <Save size={18} />
                        設定を保存
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemSettingsMaster;
