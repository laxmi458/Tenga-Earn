import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────
const MOCK_TASKS = {
  video: [
    { id: 1, title: "Watch Crypto Tutorial", url: "https://youtube.com/embed/dQw4w9WgXcQ", reward: 25, timer: 15, type: "video" },
    { id: 2, title: "DeFi Explained", url: "https://youtube.com/embed/dQw4w9WgXcQ", reward: 30, timer: 20, type: "video" },
    { id: 3, title: "Blockchain Basics", url: "https://youtube.com/embed/dQw4w9WgXcQ", reward: 20, timer: 10, type: "video" },
  ],
  web: [
    { id: 4, title: "Visit CryptoNews", url: "https://coindesk.com", reward: 10, timer: 10, type: "web" },
    { id: 5, title: "Explore DeFi Hub", url: "https://defi.org", reward: 12, timer: 10, type: "web" },
  ],
  apps: [
    { id: 6, title: "Download WalletApp", url: "https://play.google.com", reward: 50, timer: 0, type: "app" },
    { id: 7, title: "Install TradePro", url: "https://play.google.com", reward: 75, timer: 0, type: "app" },
  ],
  ads: [
    { id: 8, title: "View Sponsored Ad", url: "#", reward: 5, timer: 8, type: "ad" },
    { id: 9, title: "Watch Brand Promo", url: "#", reward: 8, timer: 12, type: "ad" },
  ],
};

const MOCK_CAMPAIGNS = [
  { id: 1, title: "Promote My App", type: "app", target: 1000, completed: 340, reward: 5, budget: 50, status: "active", user: "john@email.com" },
  { id: 2, title: "Web Traffic Boost", type: "web", target: 500, completed: 500, reward: 10, budget: 30, status: "completed", user: "alice@email.com" },
  { id: 3, title: "Video Views Campaign", type: "video", target: 200, completed: 0, reward: 15, budget: 20, status: "pending", user: "bob@email.com" },
];

const MOCK_USERS = [
  { id: 1, name: "John Doe", email: "john@email.com", balance: 1240, ref_code: "TCOIN12345", total_earned: 3200, today_earned: 120, status: "active" },
  { id: 2, name: "Alice Smith", email: "alice@email.com", balance: 890, ref_code: "TCOIN67890", total_earned: 1800, today_earned: 50, status: "active" },
  { id: 3, name: "Bob Khan", email: "bob@email.com", balance: 230, ref_code: "TCOIN11111", total_earned: 500, today_earned: 30, status: "banned" },
];

const MOCK_WITHDRAWALS = [
  { id: 1, user: "john@email.com", amount: 500, method: "bKash", account: "01711111111", status: "pending" },
  { id: 2, user: "alice@email.com", amount: 300, method: "Payoneer", account: "alice@payoneer.com", status: "approved" },
  { id: 3, user: "bob@email.com", amount: 200, method: "bKash", account: "01722222222", status: "rejected" },
];

// ─── ICONS ────────────────────────────────────────────────────
const Icon = ({ name, size = 20, className = "" }) => {
  const icons = {
    home: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    campaign: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
    referral: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    profile: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    video: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    web: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    apps: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="9" height="9"/><rect x="13" y="2" width="9" height="9"/><rect x="2" y="13" width="9" height="9"/><rect x="13" y="13" width="9" height="9"/></svg>,
    ads: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    coin: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    copy: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    share: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    check: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    withdraw: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    users: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    settings: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/></svg>,
    logout: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    plus: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    ban: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    eye: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    trend: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    clock: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    x: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    bell: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    star: <svg width={size} height={size} className={className} fill="currentColor" stroke="none" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    fire: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
    admin: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    chart: <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  };
  return icons[name] || null;
};

// ─── TIMER COMPONENT ──────────────────────────────────────────
function TaskTimer({ duration, onComplete }) {
  const [remaining, setRemaining] = useState(duration);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (remaining <= 0) { setDone(true); onComplete(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const pct = ((duration - remaining) / duration) * 100;
  return (
    <div className="timer-wrap">
      <svg viewBox="0 0 36 36" width="64" height="64">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e2d3d" strokeWidth="3"/>
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={done ? "#00d4aa" : "#f59e0b"}
          strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - pct}
          strokeLinecap="round" style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s linear" }}/>
        <text x="18" y="22" textAnchor="middle" fill={done ? "#00d4aa" : "#f59e0b"} fontSize="8" fontWeight="bold">
          {done ? "✓" : remaining + "s"}
        </text>
      </svg>
    </div>
  );
}

// ─── TASK MODAL ───────────────────────────────────────────────
function TaskModal({ task, onClose, onReward }) {
  const [timerDone, setTimerDone] = useState(task.timer === 0);
  const [rewarded, setRewarded] = useState(false);

  const claim = () => {
    if (!rewarded && timerDone) {
      setRewarded(true);
      onReward(task.reward);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{task.title}</span>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18}/></button>
        </div>
        <div className="task-preview">
          {task.type === "video" && (
            <div className="video-placeholder">
              <Icon name="video" size={40} className="text-accent"/>
              <p>Video playing...</p>
              <p className="sub-text">Watch for {task.timer}s to earn</p>
            </div>
          )}
          {task.type === "web" && (
            <div className="video-placeholder">
              <Icon name="web" size={40} className="text-accent"/>
              <p>Website loaded</p>
              <p className="sub-text">Stay for {task.timer}s to earn</p>
            </div>
          )}
          {task.type === "ad" && (
            <div className="video-placeholder">
              <Icon name="ads" size={40} className="text-accent"/>
              <p>Sponsored Content</p>
              <p className="sub-text">View for {task.timer}s to earn</p>
            </div>
          )}
          {task.type === "app" && (
            <div className="video-placeholder">
              <Icon name="apps" size={40} className="text-accent"/>
              <p>Download App</p>
              <p className="sub-text">Complete download to earn</p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {task.timer > 0 && !timerDone && (
            <TaskTimer duration={task.timer} onComplete={() => setTimerDone(true)}/>
          )}
          {(timerDone || task.timer === 0) && (
            <button className={`claim-btn ${rewarded ? "claimed" : ""}`} onClick={claim} disabled={rewarded}>
              {rewarded ? <><Icon name="check" size={16}/> Claimed!</> : <>Claim +{task.reward} TCOIN</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// USER PANEL
// ════════════════════════════════════════════════════════════
function UserPanel({ user, onLogout, setUser }) {
  const [tab, setTab] = useState("home");
  const [activeTask, setActiveTask] = useState(null);
  const [taskType, setTaskType] = useState("video");
  const [notification, setNotification] = useState(null);
  const [copied, setCopied] = useState(false);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleReward = (amount) => {
    setUser(u => ({ ...u, balance: u.balance + amount, today_earned: u.today_earned + amount, total_earned: u.total_earned + amount }));
    notify(`+${amount} TCOIN earned! 🎉`);
    setActiveTask(null);
  };

  return (
    <div className="app-shell">
      {notification && (
        <div className={`toast ${notification.type}`}>{notification.msg}</div>
      )}
      {activeTask && (
        <TaskModal task={activeTask} onClose={() => setActiveTask(null)} onReward={handleReward}/>
      )}

      {/* TOP BAR */}
      <header className="top-bar">
        <div className="balance-chip">
          <Icon name="coin" size={16} className="text-gold"/>
          <span className="balance-val">{user.balance.toLocaleString()}</span>
          <span className="balance-label">TCOIN</span>
        </div>
        <div className="logo-mark">T<span>COIN</span></div>
        <button className="icon-btn notif-btn">
          <Icon name="bell" size={20}/>
          <span className="notif-dot"/>
        </button>
      </header>

      {/* CONTENT */}
      <main className="main-scroll">
        {tab === "home" && <HomeTab user={user} tasks={MOCK_TASKS} taskType={taskType} setTaskType={setTaskType} onTask={setActiveTask}/>}
        {tab === "campaign" && <CampaignTab user={user} notify={notify} setUser={setUser}/>}
        {tab === "referral" && <ReferralTab user={user} copied={copied} setCopied={setCopied} notify={notify}/>}
        {tab === "profile" && <ProfileTab user={user} notify={notify} onLogout={onLogout}/>}
      </main>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        {[
          { key: "home", label: "Home", icon: "home" },
          { key: "campaign", label: "Campaign", icon: "campaign" },
          { key: "referral", label: "Referral", icon: "referral" },
          { key: "profile", label: "Profile", icon: "profile" },
        ].map(({ key, label, icon }) => (
          <button key={key} className={`nav-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
            <Icon name={icon} size={22}/>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// HOME TAB
function HomeTab({ user, tasks, taskType, setTaskType, onTask }) {
  const cats = [
    { key: "video", label: "🎬 Videos", icon: "video" },
    { key: "web", label: "🌐 Web Visit", icon: "web" },
    { key: "apps", label: "📲 Apps", icon: "apps" },
    { key: "ads", label: "💰 Ads", icon: "ads" },
  ];

  return (
    <div className="tab-content">
      {/* STATS STRIP */}
      <div className="stats-strip">
        <div className="stat-card">
          <span className="stat-label">Today</span>
          <span className="stat-val gold">+{user.today_earned}</span>
        </div>
        <div className="stat-divider"/>
        <div className="stat-card">
          <span className="stat-label">Total Earned</span>
          <span className="stat-val">{user.total_earned}</span>
        </div>
        <div className="stat-divider"/>
        <div className="stat-card">
          <span className="stat-label">Referrals</span>
          <span className="stat-val accent">12</span>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="cat-scroll">
        {cats.map(c => (
          <button key={c.key} className={`cat-pill ${taskType === c.key ? "active" : ""}`} onClick={() => setTaskType(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      {/* TASK LIST */}
      <div className="section-header">
        <span>Available Tasks</span>
        <span className="badge">{tasks[taskType]?.length}</span>
      </div>
      <div className="task-list">
        {tasks[taskType]?.map(task => (
          <TaskCard key={task.id} task={task} onTask={onTask}/>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, onTask }) {
  const typeColors = { video: "#e63946", web: "#457b9d", app: "#2a9d8f", ad: "#e9c46a" };
  const typeIcons = { video: "video", web: "web", app: "apps", ad: "ads" };
  return (
    <div className="task-card" onClick={() => onTask(task)}>
      <div className="task-icon-wrap" style={{ background: typeColors[task.type] + "22", border: `1px solid ${typeColors[task.type]}44` }}>
        <Icon name={typeIcons[task.type]} size={22} className="task-icon"/>
      </div>
      <div className="task-info">
        <span className="task-title">{task.title}</span>
        <div className="task-meta">
          {task.timer > 0 && <span className="meta-chip"><Icon name="clock" size={11}/> {task.timer}s</span>}
          <span className="meta-chip type-chip">{task.type}</span>
        </div>
      </div>
      <div className="task-reward">
        <span className="reward-val">+{task.reward}</span>
        <span className="reward-label">TCOIN</span>
      </div>
    </div>
  );
}

// CAMPAIGN TAB
function CampaignTab({ user, notify, setUser }) {
  const [view, setView] = useState("list");
  const [myCampaigns, setMyCampaigns] = useState([
    { id: 1, title: "My Website Promo", type: "web", target: 200, completed: 45, reward: 8, budget: 20, status: "active" }
  ]);
  const [form, setForm] = useState({ title: "", type: "video", target: 100, reward: 5, budget: 10, url: "" });

  const submit = () => {
    if (!form.title || !form.url) { notify("Fill all fields", "error"); return; }
    setMyCampaigns(c => [...c, { ...form, id: Date.now(), completed: 0, status: "pending" }]);
    notify("Campaign submitted for review!");
    setView("list");
  };

  const statusColor = { active: "#00d4aa", pending: "#f59e0b", completed: "#6366f1", rejected: "#ef4444" };

  return (
    <div className="tab-content">
      <div className="page-header">
        <h2>Campaigns</h2>
        <button className="icon-btn accent-btn" onClick={() => setView(view === "create" ? "list" : "create")}>
          <Icon name={view === "create" ? "x" : "plus"} size={18}/>
        </button>
      </div>

      {view === "create" ? (
        <div className="form-card">
          <h3 className="form-title">Create Campaign</h3>
          <div className="form-group">
            <label>Campaign Title</label>
            <input className="input" placeholder="e.g. Promote My App" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="video">🎬 Video</option>
                <option value="web">🌐 Website</option>
                <option value="app">📲 App</option>
              </select>
            </div>
            <div className="form-group">
              <label>Target Views</label>
              <input className="input" type="number" value={form.target} onChange={e => setForm({ ...form, target: +e.target.value })}/>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Reward / User (TCOIN)</label>
              <input className="input" type="number" value={form.reward} onChange={e => setForm({ ...form, reward: +e.target.value })}/>
            </div>
            <div className="form-group">
              <label>Total Budget ($)</label>
              <input className="input" type="number" value={form.budget} onChange={e => setForm({ ...form, budget: +e.target.value })}/>
            </div>
          </div>
          <div className="form-group">
            <label>URL / Link</label>
            <input className="input" placeholder="https://..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}/>
          </div>
          <div className="budget-preview">
            <Icon name="coin" size={14}/>
            <span>Total: {form.target} views × ${(form.budget / form.target).toFixed(4)}/view = ${form.budget}</span>
          </div>
          <button className="primary-btn" onClick={submit}>Submit Campaign →</button>
        </div>
      ) : (
        <div className="campaign-list">
          <p className="section-label">My Campaigns</p>
          {myCampaigns.map(c => (
            <div key={c.id} className="campaign-card">
              <div className="campaign-top">
                <span className="campaign-title">{c.title}</span>
                <span className="status-badge" style={{ background: statusColor[c.status] + "22", color: statusColor[c.status] }}>{c.status}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min(100, (c.completed / c.target) * 100)}%` }}/>
              </div>
              <div className="campaign-meta">
                <span>{c.completed}/{c.target} {c.type === "video" ? "views" : "visits"}</span>
                <span className="text-accent">+{c.reward} TCOIN/user</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// REFERRAL TAB
function ReferralTab({ user, copied, setCopied, notify }) {
  const refLink = `https://tcoin.app/register?ref=${user.ref_code}`;
  const copy = () => {
    navigator.clipboard?.writeText(refLink).catch(() => {});
    setCopied(true);
    notify("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const mockReferrals = [
    { name: "Ahmed K.", earned: 240, date: "2 days ago" },
    { name: "Riya S.", earned: 180, date: "5 days ago" },
    { name: "Tanvir M.", earned: 90, date: "1 week ago" },
  ];

  return (
    <div className="tab-content">
      <div className="page-header"><h2>Referral Program</h2></div>
      <div className="ref-hero">
        <div className="ref-icon-ring">
          <Icon name="referral" size={32} className="text-accent"/>
        </div>
        <h3>Invite & Earn</h3>
        <p>Earn <strong>20 TCOIN</strong> for every friend who joins</p>
      </div>
      <div className="ref-code-box">
        <div className="ref-code-label">Your Code</div>
        <div className="ref-code">{user.ref_code}</div>
      </div>
      <div className="ref-link-box">
        <span className="ref-link-text">{refLink}</span>
        <button className={`icon-btn ${copied ? "text-accent" : ""}`} onClick={copy}>
          <Icon name={copied ? "check" : "copy"} size={18}/>
        </button>
      </div>
      <button className="primary-btn share-btn">
        <Icon name="share" size={16}/> Share Link
      </button>
      <div className="ref-stats-row">
        <div className="ref-stat"><span className="ref-stat-val">12</span><span className="ref-stat-label">Total Referrals</span></div>
        <div className="ref-stat-div"/>
        <div className="ref-stat"><span className="ref-stat-val gold">240</span><span className="ref-stat-label">TCOIN Earned</span></div>
        <div className="ref-stat-div"/>
        <div className="ref-stat"><span className="ref-stat-val accent">3</span><span className="ref-stat-label">This Week</span></div>
      </div>
      <p className="section-label">Recent Referrals</p>
      {mockReferrals.map((r, i) => (
        <div key={i} className="referral-row">
          <div className="ref-avatar">{r.name[0]}</div>
          <div className="ref-info"><span>{r.name}</span><span className="sub-text">{r.date}</span></div>
          <span className="text-accent">+{r.earned} TCOIN</span>
        </div>
      ))}
    </div>
  );
}

// PROFILE TAB
function ProfileTab({ user, notify, onLogout }) {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wForm, setWForm] = useState({ amount: "", method: "bKash", account: "" });
  const [history] = useState([
    { amount: 500, method: "bKash", status: "pending", date: "Apr 15" },
    { amount: 300, method: "Payoneer", status: "approved", date: "Apr 10" },
  ]);

  const submitWithdraw = () => {
    if (!wForm.amount || !wForm.account) { notify("Fill all fields", "error"); return; }
    notify("Withdrawal request submitted!");
    setShowWithdraw(false);
  };

  const statusColor = { pending: "#f59e0b", approved: "#00d4aa", rejected: "#ef4444" };

  return (
    <div className="tab-content">
      <div className="profile-hero">
        <div className="avatar-ring">
          <div className="avatar-big">{user.name[0]}</div>
        </div>
        <h3>{user.name}</h3>
        <p className="sub-text">{user.email}</p>
      </div>
      <div className="stats-strip">
        <div className="stat-card"><span className="stat-label">Balance</span><span className="stat-val gold">{user.balance}</span></div>
        <div className="stat-divider"/>
        <div className="stat-card"><span className="stat-label">Total Earned</span><span className="stat-val">{user.total_earned}</span></div>
        <div className="stat-divider"/>
        <div className="stat-card"><span className="stat-label">Today</span><span className="stat-val accent">+{user.today_earned}</span></div>
      </div>
      <button className="primary-btn" onClick={() => setShowWithdraw(!showWithdraw)}>
        <Icon name="withdraw" size={16}/> {showWithdraw ? "Cancel" : "Withdraw TCOIN"}
      </button>
      {showWithdraw && (
        <div className="form-card">
          <div className="form-row">
            <div className="form-group">
              <label>Amount (TCOIN)</label>
              <input className="input" type="number" placeholder="Min 100" value={wForm.amount} onChange={e => setWForm({ ...wForm, amount: e.target.value })}/>
            </div>
            <div className="form-group">
              <label>Method</label>
              <select className="input" value={wForm.method} onChange={e => setWForm({ ...wForm, method: e.target.value })}>
                <option>bKash</option>
                <option>Payoneer</option>
                <option>USDT</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Account Number</label>
            <input className="input" placeholder="bKash number / email" value={wForm.account} onChange={e => setWForm({ ...wForm, account: e.target.value })}/>
          </div>
          <button className="primary-btn" onClick={submitWithdraw}>Submit Request →</button>
        </div>
      )}
      <p className="section-label">Withdrawal History</p>
      {history.map((w, i) => (
        <div key={i} className="withdraw-row">
          <div><span className="task-title">{w.method}</span><span className="sub-text"> · {w.date}</span></div>
          <div className="withdraw-right">
            <span className="reward-val">{w.amount} T</span>
            <span className="status-badge" style={{ background: statusColor[w.status] + "22", color: statusColor[w.status] }}>{w.status}</span>
          </div>
        </div>
      ))}
      <button className="logout-btn" onClick={onLogout}><Icon name="logout" size={16}/> Sign Out</button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ADMIN PANEL
// ════════════════════════════════════════════════════════════
function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [withdrawals, setWithdrawals] = useState(MOCK_WITHDRAWALS);
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2500);
  };

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "chart" },
    { key: "tasks", label: "Content", icon: "video" },
    { key: "users", label: "Users", icon: "users" },
    { key: "withdrawals", label: "Withdrawals", icon: "withdraw" },
    { key: "campaigns", label: "Campaigns", icon: "campaign" },
  ];

  return (
    <div className="admin-shell">
      {notification && <div className={`toast ${notification.type}`}>{notification.msg}</div>}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <Icon name="admin" size={22} className="text-accent"/> TCOIN <span>Admin</span>
        </div>
        <nav className="admin-nav">
          {navItems.map(n => (
            <button key={n.key} className={`admin-nav-btn ${tab === n.key ? "active" : ""}`} onClick={() => setTab(n.key)}>
              <Icon name={n.icon} size={18}/> {n.label}
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={onLogout}><Icon name="logout" size={16}/> Logout</button>
      </aside>
      <main className="admin-main">
        {tab === "dashboard" && <AdminDashboard users={users} withdrawals={withdrawals} campaigns={campaigns}/>}
        {tab === "tasks" && <AdminTasks tasks={tasks} setTasks={setTasks} notify={notify}/>}
        {tab === "users" && <AdminUsers users={users} setUsers={setUsers} notify={notify}/>}
        {tab === "withdrawals" && <AdminWithdrawals withdrawals={withdrawals} setWithdrawals={setWithdrawals} notify={notify}/>}
        {tab === "campaigns" && <AdminCampaigns campaigns={campaigns} setCampaigns={setCampaigns} notify={notify}/>}
      </main>
    </div>
  );
}

function AdminDashboard({ users, withdrawals, campaigns }) {
  const stats = [
    { label: "Total Users", value: users.length, icon: "users", color: "#6366f1" },
    { label: "Active Campaigns", value: campaigns.filter(c => c.status === "active").length, icon: "campaign", color: "#00d4aa" },
    { label: "Pending Withdrawals", value: withdrawals.filter(w => w.status === "pending").length, icon: "withdraw", color: "#f59e0b" },
    { label: "Total Tasks", value: Object.values(MOCK_TASKS).flat().length, icon: "fire", color: "#ef4444" },
  ];
  return (
    <div className="admin-section">
      <h2 className="admin-title">Dashboard</h2>
      <div className="admin-stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="admin-stat-card" style={{ "--accent": s.color }}>
            <div className="admin-stat-icon" style={{ background: s.color + "22" }}>
              <Icon name={s.icon} size={22} style={{ color: s.color }}/>
            </div>
            <div>
              <div className="admin-stat-val">{s.value}</div>
              <div className="admin-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="admin-two-col">
        <div className="admin-card">
          <h3>Recent Users</h3>
          {users.slice(0, 3).map(u => (
            <div key={u.id} className="admin-list-row">
              <div className="ref-avatar" style={{ fontSize: 12 }}>{u.name[0]}</div>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div><div className="sub-text">{u.email}</div></div>
              <span className="reward-val">{u.balance} T</span>
            </div>
          ))}
        </div>
        <div className="admin-card">
          <h3>Pending Campaigns</h3>
          {campaigns.filter(c => c.status === "pending").map(c => (
            <div key={c.id} className="admin-list-row">
              <Icon name="campaign" size={18} className="text-accent"/>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</div><div className="sub-text">{c.user}</div></div>
              <span className="status-badge pending">{c.status}</span>
            </div>
          ))}
          {campaigns.filter(c => c.status === "pending").length === 0 && <p className="sub-text">No pending campaigns</p>}
        </div>
      </div>
    </div>
  );
}

function AdminTasks({ tasks, setTasks, notify }) {
  const [form, setForm] = useState({ type: "video", title: "", url: "", reward: 10, timer: 15 });
  const [showAdd, setShowAdd] = useState(false);

  const addTask = () => {
    if (!form.title || !form.url) { notify("Fill all fields", "error"); return; }
    const newTask = { ...form, id: Date.now(), reward: +form.reward, timer: +form.timer };
    setTasks(t => ({ ...t, [form.type]: [...(t[form.type] || []), newTask] }));
    notify("Task added successfully!");
    setShowAdd(false);
    setForm({ type: "video", title: "", url: "", reward: 10, timer: 15 });
  };

  const deleteTask = (type, id) => {
    setTasks(t => ({ ...t, [type]: t[type].filter(x => x.id !== id) }));
    notify("Task deleted");
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-title">Content Management</h2>
        <button className="accent-btn-sm" onClick={() => setShowAdd(!showAdd)}>
          <Icon name={showAdd ? "x" : "plus"} size={16}/> {showAdd ? "Cancel" : "Add Task"}
        </button>
      </div>
      {showAdd && (
        <div className="admin-form-card">
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="video">Video</option>
                <option value="web">Web Visit</option>
                <option value="apps">App Download</option>
                <option value="ads">Ad View</option>
              </select>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input className="input" placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/>
            </div>
          </div>
          <div className="form-group">
            <label>URL</label>
            <input className="input" placeholder="https://..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}/>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Reward (TCOIN)</label>
              <input className="input" type="number" value={form.reward} onChange={e => setForm({ ...form, reward: e.target.value })}/>
            </div>
            <div className="form-group">
              <label>Timer (sec)</label>
              <input className="input" type="number" value={form.timer} onChange={e => setForm({ ...form, timer: e.target.value })}/>
            </div>
          </div>
          <button className="primary-btn" onClick={addTask}>Add Task →</button>
        </div>
      )}
      {Object.entries(tasks).map(([type, list]) => (
        <div key={type} className="admin-card" style={{ marginBottom: 16 }}>
          <h3 style={{ textTransform: "capitalize", marginBottom: 12 }}>{type} Tasks <span className="badge">{list.length}</span></h3>
          {list.map(t => (
            <div key={t.id} className="admin-list-row">
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</div>
                <div className="sub-text">{t.url?.slice(0, 40)}...</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span className="reward-val">+{t.reward}T</span>
                <span className="sub-text">{t.timer}s</span>
                <button className="danger-btn-sm" onClick={() => deleteTask(type, t.id)}>
                  <Icon name="x" size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function AdminUsers({ users, setUsers, notify }) {
  const toggleBan = (id) => {
    setUsers(u => u.map(x => x.id === id ? { ...x, status: x.status === "banned" ? "active" : "banned" } : x));
    notify("User status updated");
  };
  const editBalance = (id, delta) => {
    setUsers(u => u.map(x => x.id === id ? { ...x, balance: Math.max(0, x.balance + delta) } : x));
    notify("Balance updated");
  };
  return (
    <div className="admin-section">
      <h2 className="admin-title">User Control</h2>
      <div className="admin-card">
        {users.map(u => (
          <div key={u.id} className="admin-user-row">
            <div className="ref-avatar" style={{ fontSize: 12 }}>{u.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
              <div className="sub-text">{u.email} · {u.ref_code}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="reward-val" style={{ minWidth: 60, textAlign: "right" }}>{u.balance} T</span>
              <button className="sm-btn" onClick={() => editBalance(u.id, 50)} title="+50">+50</button>
              <button className="sm-btn danger" onClick={() => editBalance(u.id, -50)} title="-50">-50</button>
              <button className={`sm-btn ${u.status === "banned" ? "accent" : "danger"}`} onClick={() => toggleBan(u.id)}>
                {u.status === "banned" ? "Unban" : "Ban"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminWithdrawals({ withdrawals, setWithdrawals, notify }) {
  const update = (id, status) => {
    setWithdrawals(w => w.map(x => x.id === id ? { ...x, status } : x));
    notify(`Withdrawal ${status}`);
  };
  const statusColor = { pending: "#f59e0b", approved: "#00d4aa", rejected: "#ef4444" };
  return (
    <div className="admin-section">
      <h2 className="admin-title">Withdrawal Control</h2>
      <div className="admin-card">
        {withdrawals.map(w => (
          <div key={w.id} className="admin-list-row" style={{ alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{w.user}</div>
              <div className="sub-text">{w.method} · {w.account}</div>
              <div style={{ marginTop: 4 }}>
                <span className="reward-val">{w.amount} TCOIN</span>
                <span className="status-badge" style={{ marginLeft: 8, background: statusColor[w.status] + "22", color: statusColor[w.status] }}>{w.status}</span>
              </div>
            </div>
            {w.status === "pending" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="sm-btn accent" onClick={() => update(w.id, "approved")}>Approve</button>
                <button className="sm-btn danger" onClick={() => update(w.id, "rejected")}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminCampaigns({ campaigns, setCampaigns, notify }) {
  const update = (id, status) => {
    setCampaigns(c => c.map(x => x.id === id ? { ...x, status } : x));
    notify(`Campaign ${status}`);
  };
  const statusColor = { active: "#00d4aa", pending: "#f59e0b", completed: "#6366f1", rejected: "#ef4444" };
  return (
    <div className="admin-section">
      <h2 className="admin-title">Campaign Control</h2>
      <div className="admin-card">
        {campaigns.map(c => (
          <div key={c.id} className="admin-list-row" style={{ alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</span>
                <span className="status-badge" style={{ background: statusColor[c.status] + "22", color: statusColor[c.status] }}>{c.status}</span>
              </div>
              <div className="sub-text">{c.user} · {c.type} · Target: {c.target}</div>
              <div style={{ marginTop: 4 }}>
                <span className="sub-text">Budget: ${c.budget} · Reward: {c.reward}T/user</span>
              </div>
              <div className="progress-bar" style={{ marginTop: 8 }}>
                <div className="progress-fill" style={{ width: `${(c.completed / c.target) * 100}%` }}/>
              </div>
              <div className="sub-text">{c.completed}/{c.target} completed</div>
            </div>
            {c.status === "pending" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="sm-btn accent" onClick={() => update(c.id, "active")}>Approve</button>
                <button className="sm-btn danger" onClick={() => update(c.id, "rejected")}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", ref: "" });
  const [err, setErr] = useState("");

  const submit = () => {
    if (!form.email || !form.password) { setErr("Please fill all fields"); return; }
    if (form.email === "admin@tcoin.app" && form.password === "admin123") {
      onLogin({ role: "admin" });
    } else {
      onLogin({
        role: "user",
        name: form.name || "Demo User",
        email: form.email,
        balance: 500,
        ref_code: "TCOIN" + Math.floor(10000 + Math.random() * 90000),
        total_earned: 500,
        today_earned: 50,
      });
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-bg"/>
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">T</div>
          <span>TCOIN</span>
        </div>
        <p className="auth-tagline">Earn crypto doing simple tasks</p>
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
        </div>
        {mode === "register" && (
          <div className="form-group">
            <input className="input" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
          </div>
        )}
        <div className="form-group">
          <input className="input" type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/>
        </div>
        <div className="form-group">
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/>
        </div>
        {mode === "register" && (
          <div className="form-group">
            <input className="input" placeholder="Referral code (optional)" value={form.ref} onChange={e => setForm({ ...form, ref: e.target.value })}/>
          </div>
        )}
        {err && <p className="auth-err">{err}</p>}
        <button className="primary-btn" onClick={submit}>{mode === "login" ? "Sign In →" : "Create Account →"}</button>
        <div className="auth-hint">
          <Icon name="admin" size={13}/> Admin: admin@tcoin.app / admin123
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════
export default function App() {
  const [session, setSession] = useState(null);

  const handleLogin = (userData) => setSession(userData);
  const handleLogout = () => setSession(null);
  const setUser = (updater) => setSession(s => typeof updater === "function" ? { ...s, ...updater(s) } : { ...s, ...updater });

  if (!session) return <AuthScreen onLogin={handleLogin}/>;
  if (session.role === "admin") return <AdminPanel onLogout={handleLogout}/>;
  return <UserPanel user={session} onLogout={handleLogout} setUser={setUser}/>;
}
