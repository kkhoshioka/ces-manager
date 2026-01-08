import React, { useState } from 'react';
import styles from './Masters.module.css';
import SupplierMaster from './masters/SupplierMaster';
import CustomerMaster from './masters/CustomerMaster';
import ProductTypeMaster from './masters/ProductTypeMaster';
import ExpenseMaster from './masters/ExpenseMaster';
import UserMaster from './masters/UserMaster';
import SystemSettingsMaster from './masters/SystemSettingsMaster';
import { Users, Tag, DollarSign, Settings, Truck, UserCog } from 'lucide-react';

type Tab = 'customer' | 'type' | 'expense' | 'supplier' | 'user' | 'system';

const Masters: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('customer');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <Settings className={styles.icon} />
                    マスター管理
                </h1>
                <p className={styles.subtitle}>システム全体の基本データを管理します</p>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'customer' ? styles.active : ''}`}
                    onClick={() => setActiveTab('customer')}
                >
                    <Users size={18} />
                    得意先マスター
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'supplier' ? styles.active : ''}`}
                    onClick={() => setActiveTab('supplier')}
                >
                    <Truck size={18} />
                    仕入先マスター
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'type' ? styles.active : ''}`}
                    onClick={() => setActiveTab('type')}
                >
                    <Tag size={18} />
                    商品種別マスター
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'expense' ? styles.active : ''}`}
                    onClick={() => setActiveTab('expense')}
                >
                    <DollarSign size={18} />
                    営業費マスター
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'user' ? styles.active : ''}`}
                    onClick={() => setActiveTab('user')}
                >
                    <UserCog size={18} />
                    ユーザー管理
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'system' ? styles.active : ''}`}
                    onClick={() => setActiveTab('system')}
                >
                    <Settings size={18} />
                    システム設定
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'customer' && <CustomerMaster />}
                {activeTab === 'supplier' && <SupplierMaster />}
                {activeTab === 'type' && <ProductTypeMaster />}
                {activeTab === 'expense' && <ExpenseMaster />}
                {activeTab === 'user' && <UserMaster />}
                {activeTab === 'system' && <SystemSettingsMaster />}
            </div>
        </div>
    );
};

export default Masters;
