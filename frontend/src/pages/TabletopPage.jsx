import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { WOUND_LEVELS, STUN_STATES } from '../data/wounds';
import { VEHICLE_WOUND_LEVELS, VEHICLE_STUN_STATES } from '../data/vehicleWounds';

const VGA_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'Blue', hex: '#0000AA' },
  { name: 'Green', hex: '#00AA00' },
  { name: 'Cyan', hex: '#00AAAA' },
  { name: 'Red', hex: '#AA0000' },
  { name: 'Magenta', hex: '#AA00AA' },
  { name: 'Brown', hex: '#AA5500' },
  { name: 'Light Gray', hex: '#AAAAAA' },
  { name: 'Dark Gray', hex: '#555555' },
  { name: 'Light Blue', hex: '#5555FF' },
  { name: 'Light Green', hex: '#55FF55' },
  { name: 'Light Cyan', hex: '#55FFFF' },
  { name: 'Light Red', hex: '#FF5555' },
  { name: 'Pink', hex: '#FF55FF' },
  { name: 'Yellow', hex: '#FFFF55' },
  { name: 'White', hex: '#FFFFFF' },
];

const GRID_SIZE = 30;
const ZOOM_LEVELS = [18, 24, 36, 48, 60];
const DEFAULT_ZOOM = 2;

function isLightColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

function genTokenId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

const emptyGrid = () => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

function TabletopPage() {
  const [mode, setMode] = useState('select');
  const [selectedColor, setSelectedColor] = useState('#AA0000');
  const [tokens, setTokens] = useState([]);
  const [grid, setGrid] = useState(emptyGrid);
  const [characters, setCharacters] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [addEntityId, setAddEntityId] = useState('');
  const [addSize, setAddSize] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const dragTokenId = useRef(null);

  const serverState = useRef({ grid: null, tokens: null, updatedAt: null });
  const saveTimer = useRef(null);

  const saveToServer = useCallback((newGrid, newTokens) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await axios.put(`${API_URL}/tabletop`, { grid: newGrid, tokens: newTokens });
        serverState.current = { grid: newGrid, tokens: newTokens, updatedAt: res.data.updatedAt };
      } catch { /* ignore */ }
    }, 300);
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const [tabletopRes, charRes, vehRes] = await Promise.all([
          axios.get(`${API_URL}/tabletop`),
          axios.get(`${API_URL}/characters`),
          axios.get(`${API_URL}/vehicles`),
        ]);
        setCharacters(charRes.data);
        setVehicles(vehRes.data);
        if (tabletopRes.data && tabletopRes.data.updatedAt !== serverState.current.updatedAt) {
          serverState.current = {
            grid: tabletopRes.data.grid,
            tokens: tabletopRes.data.tokens,
            updatedAt: tabletopRes.data.updatedAt,
          };
          setGrid(tabletopRes.data.grid && tabletopRes.data.grid.length === GRID_SIZE
            ? tabletopRes.data.grid : emptyGrid());
          setTokens(tabletopRes.data.tokens || []);
        }
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const getEntityName = (entityId) => {
    return characters.find(c => c.id === entityId)?.name
      || vehicles.find(v => v.id === entityId)?.name
      || '??';
  };

  const getTokenStatus = (token) => {
    if (token.entityType === 'character') {
      const char = characters.find(c => c.id === token.entityId);
      if (!char) return null;
      const parts = [];
      if (char.woundLevel && char.woundLevel !== 'healthy')
        parts.push(WOUND_LEVELS.find(w => w.key === char.woundLevel)?.label || char.woundLevel);
      if (char.stunState && char.stunState !== 'none')
        parts.push(STUN_STATES.find(s => s.key === char.stunState)?.label || char.stunState);
      if (char.isProne) parts.push('Prone');
      return parts.length > 0 ? parts.join(', ') : null;
    }
    const veh = vehicles.find(v => v.id === token.entityId);
    if (!veh) return null;
    const parts = [];
    if (veh.woundLevel && veh.woundLevel !== 'healthy')
      parts.push(VEHICLE_WOUND_LEVELS.find(w => w.key === veh.woundLevel)?.label || veh.woundLevel);
    if (veh.stunState && veh.stunState !== 'none')
      parts.push(VEHICLE_STUN_STATES.find(s => s.key === veh.stunState)?.label || veh.stunState);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const updateTokens = (newTokens) => {
    setTokens(newTokens);
    saveToServer(grid, newTokens);
  };

  const updateGrid = (newGrid) => {
    setGrid(newGrid);
    saveToServer(newGrid, tokens);
  };

  const handleAddToken = () => {
    if (!addEntityId) return;
    const isChar = characters.some(c => c.id === addEntityId);
    const newTokens = [...tokens, {
      id: genTokenId(),
      entityId: addEntityId,
      entityType: isChar ? 'character' : 'vehicle',
      color: selectedColor,
      size: addSize,
      row: null,
      col: null,
    }];
    updateTokens(newTokens);
    setAddEntityId('');
  };

  const paintCell = (row, col) => {
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = selectedColor;
    updateGrid(newGrid);
  };

  const eraseCell = (row, col) => {
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = null;
    updateGrid(newGrid);
  };

  const handleCellMouseDown = (e, row, col) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    if (e.button === 0) {
      setIsDrawing(true);
      paintCell(row, col);
    }
  };

  const handleCellMouseEnter = (row, col) => {
    if (mode === 'draw' && isDrawing) {
      paintCell(row, col);
    }
  };

  const handleCellContextMenu = (e, row, col) => {
    if (mode === 'draw') {
      e.preventDefault();
      eraseCell(row, col);
    }
  };

  const handleMouseUp = () => setIsDrawing(false);

  const handleDragStart = (e, tokenId) => {
    dragTokenId.current = tokenId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e) => {
    if (dragTokenId.current === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGridDrop = (e, row, col) => {
    e.preventDefault();
    const id = dragTokenId.current;
    if (id === null) return;
    const token = tokens.find(t => t.id === id);
    if (!token) return;
    if (row + token.size > GRID_SIZE || col + token.size > GRID_SIZE) return;
    updateTokens(tokens.map(t => t.id === id ? { ...t, row, col } : t));
    dragTokenId.current = null;
  };

  const handleSideboardDrop = (e) => {
    e.preventDefault();
    const id = dragTokenId.current;
    if (id === null) return;
    updateTokens(tokens.map(t => t.id === id ? { ...t, row: null, col: null } : t));
    dragTokenId.current = null;
  };

  const handleTokenContextMenu = (e, tokenId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, tokenId });
  };

  const handleDeleteToken = () => {
    if (!contextMenu) return;
    updateTokens(tokens.filter(t => t.id !== contextMenu.tokenId));
    setContextMenu(null);
  };

  const handleClearGrid = () => {
    updateGrid(emptyGrid());
  };

  const cellSize = ZOOM_LEVELS[zoomLevel];
  const zoomIn = () => setZoomLevel(z => Math.min(z + 1, ZOOM_LEVELS.length - 1));
  const zoomOut = () => setZoomLevel(z => Math.max(z - 1, 0));

  const gridTokens = tokens.filter(t => t.row !== null);
  const sideboardTokens = tokens.filter(t => t.row === null);
  const playerChars = characters.filter(c => !c.isNPC);
  const npcChars = characters.filter(c => c.isNPC);
  const playerVehicles = vehicles.filter(v => !v.isNPC);
  const npcVehicles = vehicles.filter(v => v.isNPC);

  const renderToken = (token, inSideboard) => {
    const name = getEntityName(token.entityId);
    const status = getTokenStatus(token);
    const textColor = isLightColor(token.color) ? '#000' : '#fff';
    const label = token.size === 1 ? name.slice(0, 3).toUpperCase() : name;
    const fontSize = token.size === 1 ? '0.55rem' : token.size === 2 ? '0.65rem' : '0.75rem';
    const statusSize = token.size === 1 ? '0.4rem' : token.size === 2 ? '0.5rem' : '0.6rem';
    const canDrag = mode === 'select';

    const style = {
      backgroundColor: token.color,
      color: textColor,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      cursor: canDrag ? 'grab' : 'default',
      userSelect: 'none',
      border: '2px solid rgba(255,255,255,0.3)',
      overflow: 'hidden',
      lineHeight: 1,
    };

    if (inSideboard) {
      const sz = token.size === 1 ? 36 : token.size === 2 ? 48 : 56;
      style.width = `${sz}px`;
      style.height = `${sz}px`;
      style.flexShrink = 0;
    } else {
      style.gridRow = `${token.row + 1} / span ${token.size}`;
      style.gridColumn = `${token.col + 1} / span ${token.size}`;
      style.zIndex = 2;
      style.pointerEvents = mode === 'draw' ? 'none' : 'auto';
    }

    return (
      <div
        key={token.id}
        className="tabletop-token"
        style={style}
        draggable={canDrag}
        onDragStart={(e) => handleDragStart(e, token.id)}
        onContextMenu={(e) => handleTokenContextMenu(e, token.id)}
        title={`${name}${status ? ` — ${status}` : ''}`}
      >
        <span style={{ fontSize, fontWeight: 700 }}>{label}</span>
        {status && (
          <span style={{
            fontSize: statusSize,
            textAlign: 'center',
            padding: '0 2px',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {status}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="page tabletop-page" onMouseUp={handleMouseUp}>
      <h2>Tabletop</h2>

      <div className="tabletop-toolbar">
        <div className="tabletop-modes">
          <button className={mode === 'add' ? 'active' : ''} onClick={() => setMode('add')}>Add Token</button>
          <button className={mode === 'select' ? 'active' : ''} onClick={() => setMode('select')}>Select</button>
          <button className={mode === 'draw' ? 'active' : ''} onClick={() => setMode('draw')}>Draw</button>
        </div>
        <div className="tabletop-color-picker">
          {VGA_COLORS.map(c => (
            <div
              key={c.hex}
              className={`color-swatch${selectedColor === c.hex ? ' selected' : ''}`}
              style={{ backgroundColor: c.hex }}
              onClick={() => setSelectedColor(c.hex)}
              title={c.name}
            />
          ))}
        </div>
        {mode === 'draw' && (
          <button className="tabletop-clear-btn" onClick={handleClearGrid}>Clear Grid</button>
        )}
      </div>

      {mode === 'add' && (
        <div className="tabletop-add-form">
          <select value={addEntityId} onChange={e => setAddEntityId(e.target.value)}>
            <option value="">-- Select Character / Vehicle --</option>
            {playerChars.length > 0 && (
              <optgroup label="Player Characters">
                {playerChars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            )}
            {npcChars.length > 0 && (
              <optgroup label="NPCs">
                {npcChars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            )}
            {playerVehicles.length > 0 && (
              <optgroup label="Vehicles">
                {playerVehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </optgroup>
            )}
            {npcVehicles.length > 0 && (
              <optgroup label="NPC Vehicles">
                {npcVehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </optgroup>
            )}
          </select>
          <div className="tabletop-size-picker">
            <label><input type="radio" name="tokenSize" checked={addSize === 1} onChange={() => setAddSize(1)} /> Normal</label>
            <label><input type="radio" name="tokenSize" checked={addSize === 2} onChange={() => setAddSize(2)} /> Big (2x2)</label>
            <label><input type="radio" name="tokenSize" checked={addSize === 3} onChange={() => setAddSize(3)} /> Huge (3x3)</label>
          </div>
          <button onClick={handleAddToken} disabled={!addEntityId}>Add</button>
        </div>
      )}

      <div className="tabletop-grid-area">
        <div className="tabletop-zoom-controls">
          <button onClick={zoomIn} title="Zoom In">+</button>
          <button onClick={zoomOut} title="Zoom Out">&minus;</button>
        </div>
        <div className="tabletop-grid-scroll">
          <div
            className="tabletop-grid"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`,
              cursor: mode === 'draw' ? 'crosshair' : 'default',
            }}
          >
            {Array.from({ length: GRID_SIZE }, (_, r) =>
              Array.from({ length: GRID_SIZE }, (_, c) => (
                <div
                  key={`${r}-${c}`}
                  className="tabletop-cell"
                  style={{
                    gridRow: r + 1,
                    gridColumn: c + 1,
                    backgroundColor: grid[r]?.[c] || undefined,
                  }}
                  onMouseDown={(e) => handleCellMouseDown(e, r, c)}
                  onMouseEnter={() => handleCellMouseEnter(r, c)}
                  onContextMenu={(e) => handleCellContextMenu(e, r, c)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleGridDrop(e, r, c)}
                />
              ))
            )}
            {gridTokens.map(t => renderToken(t, false))}
          </div>
        </div>
      </div>

      <div
        className="tabletop-sideboard"
        onDragOver={handleDragOver}
        onDrop={handleSideboardDrop}
      >
        <span className="sideboard-label">Sideboard</span>
        {sideboardTokens.map(t => renderToken(t, true))}
        {sideboardTokens.length === 0 && (
          <span className="sideboard-empty">Add tokens above, then drag them onto the grid</span>
        )}
      </div>

      {contextMenu && (
        <div
          className="tabletop-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={handleDeleteToken}>Delete Token</button>
        </div>
      )}
    </div>
  );
}

export default TabletopPage;
