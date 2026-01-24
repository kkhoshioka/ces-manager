
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wrench, Package, X, Settings, LogOut, PieChart, Banknote, FileText, Tractor, Receipt, Database, TrendingUp } from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, signOut } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.logoContainer}>
        <div className={styles.logoInfo}>
          <div className={styles.logoIcon}>
            <Wrench size={24} color="#1e3a8a" />
          </div>
          <h1 className={styles.logoText}>CES Manager</h1>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          end
          onClick={onClose}
        >
          <LayoutDashboard size={20} />
          <span>ダッシュボード</span>
        </NavLink>

        <NavLink
          to="/repairs"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          onClick={onClose}
        >
          <Wrench size={20} />
          <span>修理・販売管理</span>
        </NavLink>

        <NavLink
          to="/dashboard/annual-summary"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          onClick={onClose}
        >
          <TrendingUp size={20} />
          <span>年間損益概況</span>
        </NavLink>

        {isAdmin && (
          <>
            <NavLink
              to="/inventory"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={onClose}
            >
              <Package size={20} />
              <span>部品在庫</span>
            </NavLink>

            <NavLink
              to="/machines"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={onClose}
            >
              <Tractor size={20} />
              <span>機材台帳</span>
            </NavLink>
            <NavLink
              to="/reports/supplier-costs"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <PieChart size={20} />
              <span className={styles.navText}>原価管理</span>
            </NavLink>



            <NavLink
              to="/sales-management"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={onClose}
            >
              <Banknote size={20} />
              <span>売上・入金管理</span>
            </NavLink>

            <NavLink
              to="/monthly-invoicing"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={onClose}
            >
              <FileText size={20} />
              <span>月次請求書発行</span>
            </NavLink>

            <NavLink
              to="/monthly-expenses"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={onClose}
            >
              <Receipt size={20} />
              <span>月次営業費入力</span>
            </NavLink>

            <NavLink
              to="/data-management"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={onClose}
            >
              <Database size={20} />
              <span>データ管理</span>
            </NavLink>

          </>
        )}

        <div className={styles.divider}></div>
        <NavLink
          to="/masters"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          style={{ marginTop: 'auto' }}
          onClick={onClose}
        >
          <Settings size={20} />
          <span>マスター管理</span>
        </NavLink>
      </nav>

      <div className={styles.footer}>
        <button
          onClick={signOut}
          className={styles.navItem}
          style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}
        >
          <LogOut size={20} />
          <span>ログアウト</span>
        </button>
        <p style={{ marginTop: '1rem' }}>© 2025 CES</p>
      </div>
    </aside>
  );
};

export default Sidebar;
