import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import {
  ArrowUpRight,
  Brush,
  Camera,
  Check,
  Copy,
  Eraser,
  Eye,
  Film,
  GalleryHorizontalEnd,
  Grid3X3,
  Group,
  Hand,
  ImageDown,
  Maximize2,
  MousePointer2,
  Move,
  Palette,
  Play,
  Plus,
  RefreshCcw,
  RotateCcw,
  RotateCw,
  Save,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";

const COLORS = [
  "#23d5ff",
  "#ff3bbd",
  "#a3ff12",
  "#ffd166",
  "#8b5cf6",
  "#ffffff",
  "#fb7185",
  "#34d399"
];

const ANIMATIONS = [
  { id: "none", label: "Still" },
  { id: "pulse", label: "Pulse" },
  { id: "orbit", label: "Orbit" },
  { id: "float", label: "Float" },
  { id: "glitch", label: "Glitch" }
];

const TOOLS = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "move", label: "Move", icon: Hand },
  { id: "rotate", label: "Rotate", icon: RotateCw },
  { id: "resize", label: "Resize", icon: Maximize2 },
  { id: "colour", label: "Colour", icon: Palette },
  { id: "duplicate", label: "Duplicate", icon: Copy },
  { id: "erase", label: "Erase", icon: Eraser },
  { id: "animate", label: "Animate", icon: Film }
];

const SHAPES = [
  {
    id: "creature",
    label: "Creature",
    seed: [
      ["8", 0, -70, 88, 0],
      ["3", -58, -28, 84, -18],
      ["3", 58, -28, 84, 18],
      ["6", -28, 30, 82, -10],
      ["9", 32, 30, 82, 10],
      ["1", -66, 94, 76, 12],
      ["7", 66, 94, 76, -12],
      ["0", -25, -78, 22, 0],
      ["0", 25, -78, 22, 0]
    ]
  },
  {
    id: "city",
    label: "City",
    seed: [
      ["1", -120, 35, 150, 0],
      ["4", -68, 8, 130, 0],
      ["8", -12, -24, 170, 0],
      ["7", 54, 17, 145, 0],
      ["0", 120, 38, 120, 0],
      ["2", -105, -84, 54, 0],
      ["9", -6, -124, 58, 0],
      ["3", 82, -72, 50, 0]
    ]
  },
  {
    id: "face",
    label: "Face",
    seed: [
      ["0", 0, 0, 240, 0],
      ["6", -54, -42, 74, 8],
      ["9", 54, -42, 74, -8],
      ["1", 0, 18, 76, 0],
      ["3", 0, 82, 98, 88],
      ["7", -92, -96, 84, -26],
      ["7", 92, -96, 84, 26]
    ]
  },
  {
    id: "sigil",
    label: "Symbol",
    seed: [
      ["0", 0, 0, 210, 0],
      ["8", 0, 0, 138, 90],
      ["4", -86, 0, 98, 0],
      ["4", 86, 0, 98, 180],
      ["2", 0, -102, 84, 0],
      ["5", 0, 106, 84, 180],
      ["1", 0, 0, 170, 0]
    ]
  },
  {
    id: "garden",
    label: "Pattern",
    seed: Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * Math.PI * 2;
      const radius = i % 2 ? 116 : 72;
      return [
        String((i * 7) % 10),
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        i % 2 ? 64 : 88,
        (angle * 180) / Math.PI
      ];
    })
  }
];

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function makeElement(char, x, y, overrides = {}) {
  return {
    id: uid(),
    char,
    x,
    y,
    size: overrides.size ?? 96,
    rotation: overrides.rotation ?? 0,
    color: overrides.color ?? pick(COLORS),
    animation: overrides.animation ?? "none",
    opacity: overrides.opacity ?? 0.96,
    groupId: overrides.groupId ?? null,
    z: overrides.z ?? Date.now()
  };
}

function seededArtwork(shapeId, origin = { x: 0, y: 0 }) {
  const shape = SHAPES.find((item) => item.id === shapeId) ?? pick(SHAPES);
  const groupId = uid();
  return shape.seed.map(([char, x, y, size, rotation], index) =>
    makeElement(char, origin.x + x, origin.y + y, {
      size,
      rotation,
      groupId,
      color: COLORS[index % COLORS.length],
      animation: shape.id === "garden" ? "orbit" : index % 3 === 0 ? "pulse" : "none",
      z: Date.now() + index
    })
  );
}

function surpriseArtwork() {
  const shape = pick(SHAPES);
  const base = seededArtwork(shape.id, { x: 0, y: 0 });
  const sparks = Array.from({ length: 26 }, (_, index) => {
    const angle = (index / 26) * Math.PI * 2;
    const radius = rand(180, 430);
    return makeElement(String(Math.floor(rand(0, 10))), Math.cos(angle) * radius, Math.sin(angle) * radius, {
      size: rand(26, 84),
      rotation: rand(-50, 50),
      color: pick(COLORS),
      animation: pick(["float", "pulse", "glitch", "none"]),
      opacity: rand(0.42, 0.88),
      z: Date.now() + index + 100
    });
  });
  return [...base, ...sparks];
}

function App() {
  const [view, setView] = useState("landing");
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("numera-gallery") || "[]");
    } catch {
      return [];
    }
  });
  const [initialElements, setInitialElements] = useState(() => surpriseArtwork().slice(0, 13));

  const openStudio = (elements = initialElements) => {
    setInitialElements(elements);
    setView("studio");
  };

  const saveGallery = (entry) => {
    const next = [entry, ...saved].slice(0, 24);
    setSaved(next);
    localStorage.setItem("numera-gallery", JSON.stringify(next));
  };

  return (
    <div className="min-h-screen overflow-hidden bg-night text-white">
      <AmbientBackground />
      <AnimatePresence mode="wait">
        {view === "landing" && (
          <Landing
            key="landing"
            onStart={() => openStudio(surpriseArtwork())}
            onGallery={() => setView("gallery")}
          />
        )}
        {view === "studio" && (
          <Studio
            key="studio"
            initialElements={initialElements}
            onHome={() => setView("landing")}
            onGallery={() => setView("gallery")}
            onSave={saveGallery}
            onPresent={(elements) => {
              setInitialElements(elements);
              setView("present");
            }}
          />
        )}
        {view === "gallery" && (
          <Gallery
            key="gallery"
            saved={saved}
            onHome={() => setView("landing")}
            onOpen={(elements) => openStudio(elements)}
            onPresent={(elements) => {
              setInitialElements(elements);
              setView("present");
            }}
          />
        )}
        {view === "present" && (
          <Presentation
            key="present"
            elements={initialElements}
            onStudio={() => openStudio(initialElements)}
            onHome={() => setView("landing")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="scanlines" />
      <div className="starfield" />
    </div>
  );
}

function Landing({ onStart, onGallery }) {
  const preview = useMemo(() => surpriseArtwork(), []);
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="relative min-h-screen"
    >
      <nav className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-8">
        <button className="brand-mark" onClick={onStart}>
          <span>NUMERA</span>
        </button>
        <div className="glass-pill hidden items-center gap-2 md:flex">
          <span>Numbers</span>
          <span>become</span>
          <span>worlds</span>
        </div>
        <button className="icon-button" onClick={onGallery} aria-label="Open gallery">
          <GalleryHorizontalEnd size={19} />
        </button>
      </nav>

      <section className="hero-grid relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-12 pt-24 md:px-8">
        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="hero-copy"
          >
            <div className="eyebrow">
              <Sparkles size={16} /> Demo Day creative studio
            </div>
            <h1>NUMERA</h1>
            <p>
              A futuristic playground where digits become creatures, cities, faces, symbols,
              patterns, and animated scenes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button className="primary-button" onClick={onStart}>
                <Play size={18} />
                Start Creating
              </button>
              <button className="secondary-button" onClick={onGallery}>
                <Eye size={18} />
                View Gallery
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="hero-stage"
          >
            <div className="hero-orbit">
              {Array.from({ length: 36 }, (_, index) => (
                <span
                  key={index}
                  style={{
                    "--i": index,
                    "--d": `${8 + (index % 7) * 0.35}s`,
                    color: COLORS[index % COLORS.length]
                  }}
                >
                  {index % 10}
                </span>
              ))}
            </div>
            <MiniArtwork elements={preview} className="hero-artwork" />
            <div className="hero-hud left-5 top-5">
              <Brush size={16} />
              Drag digits
            </div>
            <div className="hero-hud bottom-5 right-5">
              <WandSparkles size={16} />
              Generate art
            </div>
          </motion.div>
        </div>

        <div className="hero-peek grid gap-3 md:grid-cols-3">
          {["Infinite canvas", "Number-to-art mode", "PNG export"].map((label, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 + index * 0.08 }}
              className="feature-strip"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {label}
            </motion.div>
          ))}
        </div>
      </section>
    </motion.main>
  );
}

function Studio({ initialElements, onHome, onGallery, onSave, onPresent }) {
  const [elements, setElements] = useState(initialElements);
  const [selectedIds, setSelectedIds] = useState([]);
  const [tool, setTool] = useState("select");
  const [zoom, setZoom] = useState(0.82);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem("numera-seen-tutorial"));
  const [toast, setToast] = useState("");
  const [drag, setDrag] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    setElements(initialElements);
    setSelectedIds([]);
  }, [initialElements]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Delete" || event.key === "Backspace") eraseSelected();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelected();
      }
      if (event.key.toLowerCase() === "p") onPresent(elements);
      if (event.key === "Escape") setSelectedIds([]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [elements, selectedIds]);

  const selected = elements.filter((element) => selectedIds.includes(element.id));
  const selectionBox = getSelectionBox(selected);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(showToast.t);
    showToast.t = window.setTimeout(() => setToast(""), 1800);
  };

  const viewportToCanvas = (clientX, clientY) => {
    const rect = viewportRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - rect.width / 2 - pan.x) / zoom,
      y: (clientY - rect.top - rect.height / 2 - pan.y) / zoom
    };
  };

  const addAt = (char, point) => {
    const element = makeElement(char, point.x, point.y, {
      size: rand(72, 132),
      rotation: rand(-14, 14),
      color: pick(COLORS),
      animation: tool === "animate" ? "pulse" : "none"
    });
    setElements((current) => [...current, element]);
    setSelectedIds([element.id]);
  };

  const applyToSelected = (patcher) => {
    setElements((current) =>
      current.map((element) => (selectedIds.includes(element.id) ? { ...element, ...patcher(element) } : element))
    );
  };

  const eraseSelected = () => {
    if (!selectedIds.length) return;
    setElements((current) => current.filter((element) => !selectedIds.includes(element.id)));
    setSelectedIds([]);
    showToast("Selection erased");
  };

  const duplicateSelected = () => {
    if (!selectedIds.length) return;
    const copies = selected.map((element, index) => ({
      ...element,
      id: uid(),
      x: element.x + 34,
      y: element.y + 34,
      z: Date.now() + index,
      groupId: element.groupId ? uid() : null
    }));
    setElements((current) => [...current, ...copies]);
    setSelectedIds(copies.map((element) => element.id));
    showToast("Duplicated");
  };

  const groupSelected = () => {
    if (selectedIds.length < 2) return;
    const groupId = uid();
    applyToSelected(() => ({ groupId }));
    showToast("Grouped selection");
  };

  const generateShape = (shapeId) => {
    const generated = seededArtwork(shapeId, { x: rand(-70, 70), y: rand(-40, 80) });
    setElements((current) => [...current, ...generated]);
    setSelectedIds(generated.map((element) => element.id));
    showToast(`${SHAPES.find((shape) => shape.id === shapeId)?.label} generated`);
  };

  const surprise = () => {
    const generated = surpriseArtwork();
    setElements(generated);
    setSelectedIds(generated.slice(0, 8).map((element) => element.id));
    setPan({ x: 0, y: 0 });
    setZoom(0.78);
    showToast("Surprise composition loaded");
  };

  const saveCurrent = () => {
    const entry = {
      id: uid(),
      title: `Creation ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      date: new Date().toISOString(),
      elements
    };
    onSave(entry);
    showToast("Saved to gallery");
  };

  const exportPng = async () => {
    if (!canvasRef.current) return;
    setSelectedIds([]);
    await new Promise((resolve) => window.setTimeout(resolve, 80));
    const dataUrl = await toPng(canvasRef.current, {
      pixelRatio: 2,
      backgroundColor: "#05070f",
      cacheBust: true
    });
    const link = document.createElement("a");
    link.download = "numera-artwork.png";
    link.href = dataUrl;
    link.click();
    showToast("PNG exported");
  };

  const handleTool = (id) => {
    setTool(id);
    if (id === "duplicate") duplicateSelected();
    if (id === "erase") eraseSelected();
  };

  const pointerMove = (event) => {
    if (!drag) return;
    const point = viewportToCanvas(event.clientX, event.clientY);
    if (drag.type === "pan") {
      setPan({
        x: drag.startPan.x + (event.clientX - drag.clientX),
        y: drag.startPan.y + (event.clientY - drag.clientY)
      });
      return;
    }
    if (drag.type === "move") {
      const dx = point.x - drag.startPoint.x;
      const dy = point.y - drag.startPoint.y;
      setElements((current) =>
        current.map((element) =>
          drag.ids.includes(element.id)
            ? { ...element, x: drag.starts[element.id].x + dx, y: drag.starts[element.id].y + dy }
            : element
        )
      );
      return;
    }
    if (drag.type === "resize" && selectionBox) {
      const center = { x: selectionBox.x + selectionBox.w / 2, y: selectionBox.y + selectionBox.h / 2 };
      const startDist = Math.hypot(drag.startPoint.x - center.x, drag.startPoint.y - center.y) || 1;
      const nextDist = Math.hypot(point.x - center.x, point.y - center.y);
      const scale = Math.max(0.25, Math.min(3, nextDist / startDist));
      setElements((current) =>
        current.map((element) =>
          drag.ids.includes(element.id) ? { ...element, size: Math.max(18, drag.starts[element.id].size * scale) } : element
        )
      );
      return;
    }
    if (drag.type === "rotate" && selectionBox) {
      const center = { x: selectionBox.x + selectionBox.w / 2, y: selectionBox.y + selectionBox.h / 2 };
      const startAngle = Math.atan2(drag.startPoint.y - center.y, drag.startPoint.x - center.x);
      const nextAngle = Math.atan2(point.y - center.y, point.x - center.x);
      const delta = ((nextAngle - startAngle) * 180) / Math.PI;
      setElements((current) =>
        current.map((element) =>
          drag.ids.includes(element.id)
            ? { ...element, rotation: drag.starts[element.id].rotation + delta }
            : element
        )
      );
    }
  };

  const beginElementDrag = (event, element) => {
    event.stopPropagation();
    const ids = event.shiftKey
      ? selectedIds.includes(element.id)
        ? selectedIds.filter((id) => id !== element.id)
        : [...selectedIds, element.id]
      : selectedIds.includes(element.id)
        ? selectedIds
        : element.groupId
          ? elements.filter((item) => item.groupId === element.groupId).map((item) => item.id)
          : [element.id];
    setSelectedIds(ids);
    if (tool === "erase") {
      setElements((current) => current.filter((item) => item.id !== element.id));
      return;
    }
    if (["select", "move", "colour", "animate"].includes(tool)) {
      const point = viewportToCanvas(event.clientX, event.clientY);
      setDrag({
        type: "move",
        startPoint: point,
        ids,
        starts: Object.fromEntries(elements.filter((item) => ids.includes(item.id)).map((item) => [item.id, item]))
      });
    }
  };

  const beginCanvas = (event) => {
    const shouldPan = tool === "move" || event.button === 1 || event.altKey;
    if (shouldPan) {
      setDrag({ type: "pan", clientX: event.clientX, clientY: event.clientY, startPan: pan });
      return;
    }
    setSelectedIds([]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const char = event.dataTransfer.getData("text/numera-number");
    if (!char) return;
    addAt(char, viewportToCanvas(event.clientX, event.clientY));
  };

  const selectedSize = selected[0]?.size ?? 96;
  const selectedRotation = selected[0]?.rotation ?? 0;
  const selectedAnimation = selected[0]?.animation ?? "none";

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 h-screen overflow-hidden"
    >
      <header className="studio-topbar">
        <button className="brand-mark small" onClick={onHome}>
          <span>NUMERA</span>
        </button>
        <div className="tool-strip">
          {TOOLS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`tool-button ${tool === id ? "active" : ""}`}
              onClick={() => handleTool(id)}
              title={label}
              aria-label={label}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
        <div className="top-actions">
          <button className="quiet-button hidden sm:inline-flex" onClick={saveCurrent}>
            <Save size={17} />
            Save
          </button>
          <button className="quiet-button hidden sm:inline-flex" onClick={onGallery}>
            <GalleryHorizontalEnd size={17} />
            Gallery
          </button>
          <button className="primary-button compact" onClick={() => onPresent(elements)}>
            <Play size={17} />
            Present
          </button>
        </div>
      </header>

      <aside className="number-dock">
        {Array.from({ length: 10 }, (_, number) => (
          <button
            key={number}
            className="number-token"
            draggable
            onDragStart={(event) => event.dataTransfer.setData("text/numera-number", String(number))}
            onClick={() => addAt(String(number), { x: rand(-120, 120), y: rand(-70, 70) })}
          >
            {number}
          </button>
        ))}
      </aside>

      <section
        ref={viewportRef}
        className={`creative-viewport ${drag?.type === "pan" ? "is-panning" : ""}`}
        onPointerMove={pointerMove}
        onPointerUp={() => setDrag(null)}
        onPointerLeave={() => setDrag(null)}
        onPointerDown={beginCanvas}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <div
          ref={canvasRef}
          className="infinite-plane"
          style={{
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`
          }}
        >
          <div className="axis-line horizontal" />
          <div className="axis-line vertical" />
          {elements.map((element) => (
            <NumberElement
              key={element.id}
              element={element}
              selected={selectedIds.includes(element.id)}
              onPointerDown={(event) => beginElementDrag(event, element)}
            />
          ))}
          {selectionBox && (
            <SelectionFrame
              box={selectionBox}
              onResize={(event) => {
                event.stopPropagation();
                setDrag({
                  type: "resize",
                  ids: selectedIds,
                  startPoint: viewportToCanvas(event.clientX, event.clientY),
                  starts: Object.fromEntries(selected.map((item) => [item.id, item]))
                });
              }}
              onRotate={(event) => {
                event.stopPropagation();
                setDrag({
                  type: "rotate",
                  ids: selectedIds,
                  startPoint: viewportToCanvas(event.clientX, event.clientY),
                  starts: Object.fromEntries(selected.map((item) => [item.id, item]))
                });
              }}
            />
          )}
        </div>
      </section>

      <aside className={`control-panel ${panelOpen ? "open" : ""}`}>
        <button className="panel-toggle md:hidden" onClick={() => setPanelOpen((value) => !value)}>
          {panelOpen ? <X size={18} /> : <Grid3X3 size={18} />}
        </button>
        <div className="panel-content">
          <div className="panel-section">
            <div className="section-title">
              <WandSparkles size={16} /> Number-to-art
            </div>
            <div className="preset-grid">
              {SHAPES.map((shape) => (
                <button key={shape.id} onClick={() => generateShape(shape.id)}>
                  {shape.label}
                </button>
              ))}
            </div>
            <button className="primary-button full" onClick={surprise}>
              <Sparkles size={17} />
              Surprise Me
            </button>
          </div>

          <div className="panel-section">
            <div className="section-title">
              <Palette size={16} /> Style Lab
            </div>
            <div className="swatches">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="swatch"
                  style={{ background: color }}
                  onClick={() => applyToSelected(() => ({ color }))}
                  aria-label={`Apply color ${color}`}
                />
              ))}
            </div>
            <label className="range-row">
              <span>Size</span>
              <input
                type="range"
                min="18"
                max="260"
                value={selectedSize}
                onChange={(event) => applyToSelected(() => ({ size: Number(event.target.value) }))}
              />
            </label>
            <label className="range-row">
              <span>Rotate</span>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedRotation}
                onChange={(event) => applyToSelected(() => ({ rotation: Number(event.target.value) }))}
              />
            </label>
          </div>

          <div className="panel-section">
            <div className="section-title">
              <Film size={16} /> Motion
            </div>
            <div className="segmented">
              {ANIMATIONS.map((item) => (
                <button
                  key={item.id}
                  className={selectedAnimation === item.id ? "active" : ""}
                  onClick={() => applyToSelected(() => ({ animation: item.id }))}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="section-title">
              <Camera size={16} /> Output
            </div>
            <div className="action-grid">
              <button onClick={duplicateSelected}>
                <Copy size={16} /> Duplicate
              </button>
              <button onClick={groupSelected}>
                <Group size={16} /> Group
              </button>
              <button onClick={exportPng}>
                <ImageDown size={16} /> PNG
              </button>
              <button onClick={eraseSelected}>
                <Trash2 size={16} /> Erase
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="zoom-cluster">
        <button onClick={() => setZoom((value) => Math.max(0.32, value - 0.1))} aria-label="Zoom out">
          <ZoomOut size={17} />
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((value) => Math.min(1.7, value + 0.1))} aria-label="Zoom in">
          <ZoomIn size={17} />
        </button>
        <button onClick={() => setPan({ x: 0, y: 0 })} aria-label="Center canvas">
          <RefreshCcw size={17} />
        </button>
      </div>

      <AnimatePresence>
        {showTutorial && (
          <Tutorial
            onDone={() => {
              localStorage.setItem("numera-seen-tutorial", "yes");
              setShowTutorial(false);
            }}
          />
        )}
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <Check size={17} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

function NumberElement({ element, selected, onPointerDown }) {
  return (
    <motion.div
      className={`number-element anim-${element.animation} ${selected ? "selected" : ""}`}
      onPointerDown={onPointerDown}
      style={{
        left: element.x,
        top: element.y,
        zIndex: element.z,
        color: element.color,
        fontSize: element.size,
        opacity: element.opacity,
        transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
        textShadow: `0 0 ${Math.max(12, element.size / 2.8)}px ${element.color}`
      }}
      whileHover={{ scale: 1.04 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
    >
      {element.char}
    </motion.div>
  );
}

function SelectionFrame({ box, onResize, onRotate }) {
  return (
    <div
      className="selection-frame"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button className="resize-handle" onPointerDown={onResize} aria-label="Resize selection">
        <ArrowUpRight size={15} />
      </button>
      <button className="rotate-handle" onPointerDown={onRotate} aria-label="Rotate selection">
        <RotateCw size={15} />
      </button>
    </div>
  );
}

function getSelectionBox(items) {
  if (!items.length) return null;
  const padded = items.map((item) => {
    const radius = item.size * 0.48;
    return {
      minX: item.x - radius,
      maxX: item.x + radius,
      minY: item.y - radius,
      maxY: item.y + radius
    };
  });
  const minX = Math.min(...padded.map((item) => item.minX));
  const maxX = Math.max(...padded.map((item) => item.maxX));
  const minY = Math.min(...padded.map((item) => item.minY));
  const maxY = Math.max(...padded.map((item) => item.maxY));
  return { x: minX - 20, y: minY - 20, w: maxX - minX + 40, h: maxY - minY + 40 };
}

function Tutorial({ onDone }) {
  const cards = [
    ["Drag", "Pull any digit from the left dock onto the infinite canvas."],
    ["Shape", "Select numbers, then resize, rotate, recolor, duplicate, group, or erase."],
    ["Magic", "Use Number-to-art or Surprise Me to generate instant compositions."],
    ["Show", "Save to the gallery, enter presentation mode, or export a PNG."]
  ];
  return (
    <motion.div className="tutorial-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="tutorial-modal"
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
      >
        <div className="modal-orb">0-9</div>
        <h2>Build worlds from numbers.</h2>
        <div className="tutorial-grid">
          {cards.map(([title, body], index) => (
            <div key={title}>
              <span>{index + 1}</span>
              <strong>{title}</strong>
              <p>{body}</p>
            </div>
          ))}
        </div>
        <button className="primary-button full" onClick={onDone}>
          <Sparkles size={17} />
          Enter Studio
        </button>
      </motion.div>
    </motion.div>
  );
}

function Gallery({ saved, onHome, onOpen, onPresent }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      className="relative z-10 min-h-screen px-5 py-6 md:px-8"
    >
      <header className="gallery-header">
        <button className="brand-mark small" onClick={onHome}>
          <span>NUMERA</span>
        </button>
        <button className="secondary-button" onClick={onHome}>
          Studio launch
        </button>
      </header>
      <section className="mx-auto max-w-7xl pt-16">
        <div className="gallery-title">
          <div className="eyebrow">
            <GalleryHorizontalEnd size={16} /> Saved creations
          </div>
          <h1>Gallery</h1>
        </div>
        {saved.length === 0 ? (
          <div className="empty-gallery">
            <Sparkles size={30} />
            <h2>No saved creations yet.</h2>
            <button className="primary-button" onClick={() => onOpen(surpriseArtwork())}>
              <Plus size={17} />
              Create first artwork
            </button>
          </div>
        ) : (
          <div className="gallery-grid">
            {saved.map((entry) => (
              <article key={entry.id} className="gallery-card">
                <MiniArtwork elements={entry.elements} />
                <div className="gallery-card-footer">
                  <div>
                    <strong>{entry.title}</strong>
                    <span>{new Date(entry.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="icon-button" onClick={() => onOpen(entry.elements)} aria-label="Open artwork">
                      <Brush size={17} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => onPresent(entry.elements)}
                      aria-label="Present artwork"
                    >
                      <Play size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </motion.main>
  );
}

function Presentation({ elements, onStudio, onHome }) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="presentation-view"
    >
      <div className="presentation-nav">
        <button className="brand-mark small" onClick={onHome}>
          <span>NUMERA</span>
        </button>
        <button className="primary-button compact" onClick={onStudio}>
          <Brush size={17} />
          Edit
        </button>
      </div>
      <MiniArtwork elements={elements} className="presentation-art" />
      <div className="presentation-caption">
        <div className="eyebrow">
          <Sparkles size={16} /> Presentation mode
        </div>
        <h1>Every shape here is made from numbers.</h1>
      </div>
    </motion.main>
  );
}

function MiniArtwork({ elements, className = "" }) {
  const box = getSelectionBox(elements) ?? { x: -400, y: -300, w: 800, h: 600 };
  const scale = Math.min(1.1, 460 / Math.max(box.w, box.h, 1));
  return (
    <div className={`mini-art ${className}`}>
      <div
        className="mini-art-inner"
        style={{
          transform: `translate(-50%, -50%) scale(${scale}) translate(${-box.x - box.w / 2}px, ${-box.y - box.h / 2}px)`
        }}
      >
        {elements.map((element) => (
          <span
            key={element.id}
            className={`mini-number anim-${element.animation}`}
            style={{
              left: element.x,
              top: element.y,
              color: element.color,
              fontSize: element.size,
              opacity: element.opacity,
              transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
              textShadow: `0 0 ${Math.max(10, element.size / 3)}px ${element.color}`
            }}
          >
            {element.char}
          </span>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
