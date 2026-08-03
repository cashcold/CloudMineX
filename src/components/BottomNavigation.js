import React, { Component } from 'react';
import { Home, TrendingUp, Users, MessageSquare, User } from 'lucide-react';

export class BottomNavigation extends Component {
  render() {
    const { activeTab, onTabChange } = this.props;

    const navItems = [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'income', label: 'Yields', icon: TrendingUp },
      { id: 'chat', label: 'Chat', icon: MessageSquare },
      { id: 'team', label: 'Team', icon: Users },
      { id: 'profile', label: 'Profile', icon: User },
    ];

    return (
      <nav id="bottom-navigation" className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D1B2A] border-t border-[#10253A] h-16 flex items-center px-4 sm:px-12 justify-around max-w-2xl mx-auto shadow-2xl md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center gap-1 group cursor-pointer py-1 px-3"
            >
              <div 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-[#00D4A8] scale-125' : 'bg-transparent group-hover:bg-[#94A3B8]/30'
                }`}
              />
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#00D4A8]' : 'text-[#94A3B8] group-hover:text-white'}`} />
              <span className={`text-[10px] uppercase tracking-tighter transition-colors ${
                isActive ? 'font-bold text-[#00D4A8]' : 'font-medium text-[#94A3B8] group-hover:text-white'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }
}

export default BottomNavigation;

