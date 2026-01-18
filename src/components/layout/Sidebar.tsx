import { Lock, Trash2, Key, Shield } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setTab: (t: string) => void;
}

export function Sidebar({ activeTab, setTab }: SidebarProps) {
  const tabs = [
    { id: "files", label: "Files", icon: <Lock size={20} /> },
    { id: "vault", label: "Passwords", icon: <Key size={20} /> },
    { id: "shred", label: "Shredder", icon: <Trash2 size={20} /> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Shield size={28} color="var(--accent)" />
        <span className="app-title">QRE Toolkit</span>
      </div>

      {tabs.map((t) => (
        <button
          key={t.id}
          className={`nav-btn ${activeTab === t.id ? "active" : ""}`}
          onClick={() => setTab(t.id)}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
