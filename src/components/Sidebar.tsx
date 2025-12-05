import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wrench, Package } from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar: React.FC = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <Wrench size={24} color="white" />
        </div>
        <h1 className={styles.logoText}>CES Manager</h1>
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          end
        >
          <LayoutDashboard size={20} />
          <span>ダッシュボード</span>
        </NavLink>

        <NavLink
          to="/repairs"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <Wrench size={20} />
          <span>修理管理</span>
        </NavLink>

        <NavLink
          to="/inventory"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <Package size={20} />
          <span>部品在庫</span>
        </NavLink>
      </nav>

      <div className={styles.footer}>
        <p>© 2025 CES</p>
      </div>
    </aside>
  );
};

export default Sidebar;
