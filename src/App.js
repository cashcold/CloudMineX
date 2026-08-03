import React, { Component } from 'react';
import Header from './components/Header';
import BottomNavigation from './components/BottomNavigation';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Recharge from './pages/Recharge';
import Income from './pages/Income';
import Withdraw from './pages/Withdraw';
import Team from './pages/Team';
import Share from './pages/Share';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import CommunityChat from './pages/CommunityChat';
import LandingPage from './pages/LandingPage';
import { userService } from './services/api';

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showLanding: true,
      activeTab: 'home',
      user: null,
    };
    this.handleNavigate = this.handleNavigate.bind(this);
    this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
    this.handleToggleLanding = this.handleToggleLanding.bind(this);
  }

  componentDidMount() {
    this.checkAdminUrl = this.checkAdminUrl.bind(this);
    this.checkAdminUrl();
    this.loadStoredUser();
    window.addEventListener('popstate', this.checkAdminUrl);
    window.addEventListener('hashchange', this.checkAdminUrl);
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.checkAdminUrl);
    window.removeEventListener('hashchange', this.checkAdminUrl);
  }

  checkAdminUrl() {
    const search = window.location.search || '';
    const hash = window.location.hash || '';
    const path = window.location.pathname || '';

    const isAdmin = (
      search.toLowerCase().includes('admin') ||
      hash.toLowerCase().includes('admin') ||
      path.toLowerCase().includes('/admin')
    );

    if (isAdmin) {
      this.setState({ activeTab: 'admin', showLanding: false });
    }
    return isAdmin;
  }

  async loadStoredUser() {
    const search = window.location.search || '';
    const hash = window.location.hash || '';
    const path = window.location.pathname || '';
    const isAdmin = (
      search.toLowerCase().includes('admin') ||
      hash.toLowerCase().includes('admin') ||
      path.toLowerCase().includes('/admin')
    );

    try {
      const storedUserId = localStorage.getItem('cloudminex_user_id');
      if (storedUserId) {
        const res = await userService.getUser(storedUserId);
        if (res && res.user) {
          this.setState({ 
            user: res.user, 
            showLanding: isAdmin ? false : false,
            activeTab: isAdmin ? 'admin' : this.state.activeTab,
          });
          return;
        }
      }
      
      if (isAdmin) {
        this.setState({ showLanding: false, activeTab: 'admin' });
      } else {
        this.setState({ showLanding: true });
      }
    } catch (err) {
      console.error('Error loading user:', err);
      if (isAdmin) {
        this.setState({ showLanding: false, activeTab: 'admin' });
      } else {
        this.setState({ showLanding: true });
      }
    }
  }

  async loadUser() {
    const { user } = this.state;
    if (!user) return;
    try {
      const res = await userService.getUser(user.id);
      if (res && res.user) {
        this.setState({ user: res.user });
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  }

  handleLoginSuccess(loggedInUser) {
    if (loggedInUser && loggedInUser.id) {
      localStorage.setItem('cloudminex_user_id', loggedInUser.id);
    }
    this.setState({
      user: loggedInUser,
      showLanding: false,
      activeTab: 'home',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleLogout() {
    localStorage.removeItem('cloudminex_user_id');
    this.setState({ user: null, showLanding: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleToggleLanding(show = true) {
    this.setState({ showLanding: show });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleNavigate(tabId) {
    if (tabId === 'landing') {
      this.setState({ showLanding: true });
      return;
    }
    this.setState({ activeTab: tabId, showLanding: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadUser();
  }

  renderPage() {
    const { activeTab, user } = this.state;

    switch (activeTab) {
      case 'home':
        return <Home user={user} onNavigate={this.handleNavigate} onRefreshUser={() => this.loadUser()} />;
      case 'recharge':
        return <Recharge user={user} onNavigate={this.handleNavigate} onRefreshUser={() => this.loadUser()} />;
      case 'income':
        return <Income user={user} onNavigate={this.handleNavigate} />;
      case 'withdraw':
        return <Withdraw user={user} onNavigate={this.handleNavigate} onRefreshUser={() => this.loadUser()} />;
      case 'team':
        return <Team user={user} onNavigate={this.handleNavigate} />;
      case 'share':
        return <Share user={user} onNavigate={this.handleNavigate} />;
      case 'profile':
        return <Profile user={user} onNavigate={this.handleNavigate} onGoToLanding={() => this.handleLogout()} />;
      case 'admin':
        return <AdminDashboard onNavigate={this.handleNavigate} />;
      case 'chat':
        return <CommunityChat user={user} onNavigate={this.handleNavigate} />;
      default:
        return <Home user={user} onNavigate={this.handleNavigate} onRefreshUser={() => this.loadUser()} />;
    }
  }

  render() {
    const { showLanding, activeTab, user } = this.state;

    if (showLanding) {
      return (
        <LandingPage 
          onLoginSuccess={this.handleLoginSuccess}
        />
      );
    }

    return (
      <div id="cloudminex-root" className="min-h-screen bg-[#07111F] text-white flex flex-col md:flex-row font-sans selection:bg-[#00D4A8] selection:text-[#07111F]">
        {/* Desktop Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={this.handleNavigate} 
          user={user} 
          onGoToLanding={() => this.handleToggleLanding(true)}
        />

        {/* Main Application Canvas */}
        <div className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto w-full">
          <Header 
            activeTab={activeTab} 
            onTabChange={this.handleNavigate} 
            user={user} 
            onGoToLanding={() => this.handleToggleLanding(true)}
          />

          <main id="app-content-container" className="flex-1 p-3 sm:p-5 pb-20 md:pb-8 max-w-3xl mx-auto w-full">
            {this.renderPage()}
          </main>

          {/* Fixed Mobile Bottom Navigation */}
          <div className="md:hidden">
            <BottomNavigation activeTab={activeTab} onTabChange={this.handleNavigate} />
          </div>
        </div>
      </div>
    );
  }
}

export default App;

