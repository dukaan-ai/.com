
import React from 'react';
import { Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface BottomNavProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  newOrderCount: number;
}

interface NavItemProps {
  icon: string;
  label: string;
  screen: Screen;
  isActive: boolean;
  onClick: (screen: Screen) => void;
  badgeCount?: number;
}

const navItems: { icon: string; labelKey: string; screen: Screen }[] = [
  { icon: 'dashboard', labelKey: 'nav_dashboard', screen: Screen.DASHBOARD },
  { icon: 'receipt_long', labelKey: 'nav_sales', screen: Screen.SALES },
  { icon: 'list_alt', labelKey: 'nav_orders', screen: Screen.ORDERS },
  { icon: 'inventory_2', labelKey: 'nav_catalog', screen: Screen.CATALOG },
  { icon: 'settings', labelKey: 'nav_settings', screen: Screen.SETTINGS },
];

const NavItem: React.FC<NavItemProps> = ({ icon, label, screen, isActive, onClick, badgeCount }) => {
  const color = isActive ? 'text-[#E6E6FA]' : 'text-neutral-400';

  return (
    <button
      onClick={() => onClick(screen)}
      className={`relative flex flex-1 flex-col items-center justify-end gap-1 ${color} transition-colors duration-200`}
      aria-label={label}
    >
       {badgeCount > 0 && (
        <span className="absolute top-0 right-[calc(50%-24px)] flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-[#1A1A1A]">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
      <span className="material-symbols-outlined text-2xl">{icon}</span>
      <p className="text-xs font-medium">{label}</p>
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onNavigate, newOrderCount }) => {
  const { t } = useLanguage();

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around border-t border-[#2D2D2D] bg-[#1A1A1A] px-2 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {navItems.map((item) => (
          <NavItem
            key={item.screen}
            icon={item.icon}
            label={t(item.labelKey)}
            screen={item.screen}
            isActive={activeScreen === item.screen}
            onClick={onNavigate}
            badgeCount={item.screen === Screen.ORDERS ? newOrderCount : undefined}
          />
        ))}
      </div>
    </footer>
  );
};

export default BottomNav;