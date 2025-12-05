import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import styles from './MainLayout.module.css';

const MainLayout: React.FC = () => {
    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
