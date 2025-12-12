import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wrench, Package, X, Settings } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.logoContainer}>
        <div className={styles.logoInfo}>
          <div className={styles.logoIcon}>
            <Wrench size={24} color="white" />
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
          <span>修理管理</span>
        </NavLink>

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
      </nav>

      <div className={styles.footer}>
        <p>© 2025 CES</p>
      </div>
    </aside>
  );
};

export default Sidebar;
