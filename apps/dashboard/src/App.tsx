
import { useState } from "react";
import {
  Activity,
  Album,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  Clock3,
  Disc3,
  FileAudio,
  LayoutDashboard,
  LogOut,
  Menu,
  Music2,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "./auth/AuthContext";
import LoginPage from "./auth/LoginPage";
import SongSubmissionsPage from "./features/song-submissions/SongSubmissionsPage";
import "./App.css";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Song Submissions", icon: FileAudio },
  { label: "Artist Applications", icon: Users, count: "04" },
  { label: "Artists", icon: Music2 },
  { label: "Songs", icon: Disc3 },
  { label: "Albums", icon: Album },
];

const stats = [
  {
    label: "Total Songs",
    value: "1,284",
    change: "+12.8%",
    positive: true,
    icon: Disc3,
    detail: "vs. last month",
  },
  {
    label: "Active Artists",
    value: "186",
    change: "+8.2%",
    positive: true,
    icon: Users,
    detail: "vs. last month",
  },
  {
    label: "Pending Submissions",
    value: "08",
    change: "-3.4%",
    positive: true,
    icon: FileAudio,
    detail: "vs. last month",
  },
  {
    label: "Storage Used",
    value: "42.8 GB",
    change: "+5.6%",
    positive: false,
    icon: Activity,
    detail: "of 100 GB demo capacity",
  },
];

const activities = [
  {
    title: "New song submission",
    description: "A new track was submitted for review",
    time: "12 minutes ago",
    type: "submission",
  },
  {
    title: "Artist application received",
    description: "A new artist application is waiting",
    time: "48 minutes ago",
    type: "artist",
  },
  {
    title: "Song published",
    description: "A song was approved and published",
    time: "2 hours ago",
    type: "published",
  },
  {
    title: "Audio upload completed",
    description: "An audio asset finished uploading",
    time: "4 hours ago",
    type: "upload",
  },
];

function App() {
  const { admin, loading, logout } = useAuth();

  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Verify authentication before showing the dashboard.
  if (loading) {
    return (
      <div className="auth-loading">
        Verifying admin session...
      </div>
    );
  }

  // Show login screen when no authenticated admin exists.
  if (!admin) {
    return <LoginPage />;
  }

  const adminInitial = admin.name.charAt(0).toUpperCase();

  const pageDescriptions: Record<string, string> = {
    Overview: "Here's what's happening across VerseServer.",
    "Song Submissions": "Review and manage incoming music submissions.",
    "Artist Applications": "Review artist applications from VerseHana.",
    Artists: "Manage registered artists and their catalogue.",
    Songs: "Manage the published music catalogue.",
    Albums: "Organize and manage music albums.",
  };

  const selectPage = (page: string) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  return (
    <div className="dashboard-shell">
      {sidebarOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Music2 size={22} strokeWidth={2.5} />
          </div>

          <div>
            <h1>VerseServer</h1>
            <span>ADMIN CONSOLE</span>
          </div>

          <button
            className="mobile-close"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.label;

            return (
              <button
                key={item.label}
                className={`nav-item ${active ? "active" : ""}`}
                onClick={() => selectPage(item.label)}
              >
                <Icon size={19} />
                <span>{item.label}</span>

                {item.count && (
                  <span className="nav-count">{item.count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-label">SYSTEM</div>

          <button
            className={`nav-item ${activePage === "Storage" ? "active" : ""}`}
            onClick={() => selectPage("Storage")}
          >
            <Activity size={19} />
            <span>Storage</span>
          </button>

          <button
            className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
            onClick={() => selectPage("Settings")}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="sidebar-status">
            <div className="status-indicator" />
            <div>
              <strong>Admin session active</strong>
              <span>Authenticated with API</span>
            </div>
          </div>

          <div className="sidebar-footer">
            <div className="admin-avatar">{adminInitial}</div>

            <div className="admin-info">
              <strong>{admin.name}</strong>
              <span>{admin.email}</span>
            </div>

            <ChevronDown size={16} className="footer-chevron" />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={21} />
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <label className="search-box">
              <Search size={17} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search..."
              />

              <kbd>⌘ K</kbd>
            </label>

            <button className="icon-button" aria-label="Notifications">
              <Bell size={19} />
              <span className="notification-dot" />
            </button>

            <div className="topbar-divider" />

            <div className="topbar-profile">
              <div className="admin-avatar">{adminInitial}</div>

              <div>
                <strong>{admin.name}</strong>
                <span>{admin.email}</span>
              </div>
            </div>

            <button
              className="icon-button"
              aria-label="Log out"
              title="Log out"
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                VERSESERVER / MANAGEMENT
              </div>

              <h2>{activePage}</h2>

              <p>
                {pageDescriptions[activePage] ??
                  `Manage ${activePage.toLowerCase()} across VerseServer.`}
              </p>
            </div>

            {activePage !== "Song Submissions" && (
  <div className="heading-actions">
    <span className="demo-badge">
      <span /> DEMO DATA
    </span>
  </div>
)}
          </div>

          {activePage === "Overview" ? (
            <>
              <section className="stats-grid">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <article className="stat-card" key={stat.label}>
                      <div className="stat-top">
                        <span>{stat.label}</span>

                        <div className="stat-icon">
                          <Icon size={19} />
                        </div>
                      </div>

                      <div className="stat-value">{stat.value}</div>

                      <div className="stat-footer">
                        <span
                          className={`stat-change ${
                            stat.positive ? "positive" : "negative"
                          }`}
                        >
                          {stat.positive ? (
                            <ArrowUpRight size={14} />
                          ) : (
                            <ArrowDownRight size={14} />
                          )}

                          {stat.change}
                        </span>

                        <span>{stat.detail}</span>
                      </div>
                    </article>
                  );
                })}
              </section>

              <section className="overview-grid">
                <article className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Recent Activity</h3>
                      <p>Latest events across your platform</p>
                    </div>

                    <button className="text-button">
                      View all
                    </button>
                  </div>

                  <div className="activity-list">
                    {activities.map((activity, index) => (
                      <div className="activity-item" key={index}>
                        <div className={`activity-icon ${activity.type}`}>
                          {activity.type === "submission" && (
                            <FileAudio size={17} />
                          )}

                          {activity.type === "artist" && (
                            <Users size={17} />
                          )}

                          {activity.type === "published" && (
                            <ShieldCheck size={17} />
                          )}

                          {activity.type === "upload" && (
                            <Activity size={17} />
                          )}
                        </div>

                        <div className="activity-description">
                          <strong>{activity.title}</strong>
                          <span>{activity.description}</span>
                        </div>

                        <time>{activity.time}</time>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel pending-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Needs Attention</h3>
                      <p>Items waiting for admin action</p>
                    </div>

                    <Clock3 size={19} className="muted-icon" />
                  </div>

                  <div className="pending-item">
                    <div className="pending-icon submission">
                      <FileAudio size={18} />
                    </div>

                    <div>
                      <strong>Song submissions</strong>
                      <span>Waiting for review</span>
                    </div>

                    <b>08</b>
                  </div>

                  <div className="pending-item">
                    <div className="pending-icon artist">
                      <Users size={18} />
                    </div>

                    <div>
                      <strong>Artist applications</strong>
                      <span>Waiting for approval</span>
                    </div>

                    <b>04</b>
                  </div>

                  <div className="pending-note">
                    <ShieldCheck size={16} />
                    Keep your catalogue up to date by reviewing pending items.
                  </div>
                </article>
              </section>

              <section className="panel quick-actions">
                <div className="panel-heading">
                  <div>
                    <h3>Quick Actions</h3>
                    <p>Common management tasks</p>
                  </div>
                </div>

                <div className="quick-action-grid">
                  <button onClick={() => selectPage("Song Submissions")}>
                    <div className="quick-icon cyan">
                      <FileAudio size={20} />
                    </div>

                    <span>
                      <strong>Review submissions</strong>
                      <small>Review incoming tracks</small>
                    </span>

                    <span className="quick-arrow">↗</span>
                  </button>

                  <button onClick={() => selectPage("Artist Applications")}>
                    <div className="quick-icon purple">
                      <Users size={20} />
                    </div>

                    <span>
                      <strong>Artist applications</strong>
                      <small>Review new applications</small>
                    </span>

                    <span className="quick-arrow">↗</span>
                  </button>

                  <button onClick={() => selectPage("Songs")}>
                    <div className="quick-icon blue">
                      <Disc3 size={20} />
                    </div>

                    <span>
                      <strong>Manage catalogue</strong>
                      <small>Browse published songs</small>
                    </span>

                    <span className="quick-arrow">↗</span>
                  </button>
                </div>
              </section>
            </>
                    ) : activePage === "Song Submissions" ? (
            <SongSubmissionsPage />
          ) : (
            <section className="panel placeholder-panel">
              <div className="placeholder-icon">
                <Music2 size={26} />
              </div>

              <h3>{activePage}</h3>

              <p>
                This section is ready for development. We'll connect it to the
                VerseServer API in the next stages.
              </p>

              <span className="coming-soon">
                MODULE IN DEVELOPMENT
              </span>
            </section>
          )}

          <footer className="page-footer">
            <span>VerseServer Admin Console</span>
            <span>Infrastructure for VerseHana</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
