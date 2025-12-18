
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wrench, Package, X, Settings, LogOut, CreditCard } from 'lucide-react';
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
        {isAdmin && (
          <NavLink
            to="/"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            end
            onClick={onClose}
          >
            <LayoutDashboard size={20} />
            <span>ダッシュボード</span>
          </NavLink>
        )}

        <NavLink
          to="/repairs"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          onClick={onClose}
        >
          <Wrench size={20} />
          <span>修理・販売管理</span>
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
              to="/masters"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={onClose}
            >
              <Settings size={20} />
              <span>マスター管理</span>
            </NavLink>

            <NavLink
              to="/machines"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={onClose}
            >
              <Package size={20} />
              <span>機材台帳</span>
            </NavLink>
            <NavLink
              to="/reports/supplier-costs"
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={onClose}
            >
              <CreditCard size={20} />
              <span>仕入先別集計</span>
            </NavLink>
          </>
        )}
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
