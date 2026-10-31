import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  Download,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { BeatsTool } from "./features/beats/BeatsTool";
import { ChordsTool } from "./features/chords/ChordsTool";
import { IdeasTool } from "./features/ideas/IdeasTool";
import { MelodiesTool } from "./features/melodies/MelodiesTool";
import type { ToolId } from "./shared/types";

const tools: {
  id: ToolId;
  label: string;
  kicker: string;
  description: string;
  accent: string;
  icon: string;
}[] = [
  {
    id: "melodies",
    label: "Melody Lab",
    kicker: "01 / Lead lines",
    description: "Find the note that wants to be next.",
    accent: "coral",
    icon: "∿",
  },
  {
    id: "chords",
    label: "Chord Kitchen",
    kicker: "02 / Harmony",
    description: "Turn a feeling into a progression.",
    accent: "lime",
    icon: "⌁",
  },
  {
    id: "beats",
    label: "Beat Machine",
    kicker: "03 / Rhythm",
    description: "Give your idea a pulse and a pocket.",
    accent: "blue",
    icon: "▦",
  },
  {
    id: "ideas",
    label: "Idea Blender",
    kicker: "04 / Wildcards",
    description: "Shake the box. Keep what sparks.",
    accent: "yellow",
    icon: "✳",
  },
];

function App() {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("virtual-composer-theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    localStorage.setItem("virtual-composer-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Go to Virtual Composer home">
          <span className="brand-mark">VC</span>
          <span>Virtual Composer</span>
        </Link>
        <div className="topbar-right">
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setIsDark((dark) => !dark)}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
            <span>{isDark ? "light" : "dark"}</span>
          </button>
          <ToolsMenu />
          <RouteBackLink />
        </div>
      </header>

      <main>
        <RouteTransition />
      </main>
      <footer className="footer">
        <span>made for unfinished ideas</span>
        <span>
          midi in / magic out <span className="footer-star">✦</span>
        </span>
      </footer>
    </div>
  );
}

function RouteTransition() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="route-transition">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/tools/:toolId" element={<ToolRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function ToolsMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`tools-menu${isOpen ? " is-open" : ""}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="tools-menu-trigger"
        type="button"
        aria-expanded={isOpen}
        aria-controls="tools-menu-popover"
        onClick={() => setIsOpen((open) => !open)}
      >
        tools <ChevronDown size={14} />
      </button>
      <nav
        id="tools-menu-popover"
        className="tools-menu-popover"
        aria-label="Available tools"
      >
        {tools.map((tool) => (
          <Link key={tool.id} to={`/tools/${tool.id}`}>
            <span className={`menu-swatch accent-${tool.accent}`} />
            <span className="menu-tool-copy">
              <strong>{tool.label}</strong>
              <small>{tool.kicker}</small>
            </span>
            <ArrowUpRight size={14} />
          </Link>
        ))}
      </nav>
    </div>
  );
}

function RouteBackLink() {
  const { pathname } = useLocation();
  return pathname.startsWith("/tools/") ? (
    <Link className="back-button" to="/">
      <ArrowLeft size={16} /> all tools
    </Link>
  ) : null;
}

function Home() {
  return (
    <section className="home-page">
      <div className="hero">
        <div className="eyebrow">
          <span className="eyebrow-line" /> your tiny studio for big ideas
        </div>
        <h1>
          Make a little <em>noise.</em>
        </h1>
        <p className="hero-copy">
          A curious collection of MIDI tools for getting unstuck, finding a
          groove, and making something you didn&apos;t expect.
        </p>
      </div>
      <div className="tools-heading">
        <span>Pick a door</span>
        <span className="tools-count">04 instruments inside</span>
      </div>
      <div className="tool-grid">
        {tools.map((item, index) => (
          <Link
            key={item.id}
            className={`tool-card accent-${item.accent}`}
            to={`/tools/${item.id}`}
          >
            <div className="card-top">
              <span className="card-number">0{index + 1}</span>
              <ArrowUpRight size={20} />
            </div>
            <div className="tool-icon">{item.icon}</div>
            <div className="card-kicker">{item.kicker}</div>
            <h2>{item.label}</h2>
            <p>{item.description}</p>
          </Link>
        ))}
      </div>
      <div className="home-tip">
        <span className="tip-label">START HERE</span> Pick a tool, make a loop,
        download a .mid. Your DAW is waiting.
      </div>
    </section>
  );
}

function ToolRoute() {
  const navigate = useNavigate();
  const { toolId } = useParams();
  const tool = tools.find((item) => item.id === toolId);

  if (!tool) return <Navigate to="/" replace />;

  return <ToolView tool={tool} onBack={() => navigate("/")} />;
}

function ToolView({
  tool,
  onBack,
}: {
  tool: (typeof tools)[number];
  onBack: () => void;
}) {
  const toolContent = {
    melodies: <MelodiesTool />,
    chords: <ChordsTool />,
    beats: <BeatsTool />,
    ideas: <IdeasTool />,
  }[tool.id];
  return (
    <section className={`tool-page accent-${tool.accent}`}>
      <div className="tool-page-header">
        <div>
          <button className="mobile-back" onClick={onBack}>
            <ArrowLeft size={15} /> back to tools
          </button>
          <div className="eyebrow">
            <span className="eyebrow-line" /> {tool.kicker}
          </div>
          <h1>{tool.label}</h1>
          <p>{tool.description}</p>
        </div>
        <div className="tool-page-mark">{tool.icon}</div>
      </div>
      {toolContent}
    </section>
  );
}

export function DownloadButton({
  onClick,
  label = "Download MIDI",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button className="download-button" onClick={onClick}>
      <Download size={17} /> {label}
    </button>
  );
}

export default App;
