import { useState } from 'react';
import { Bold, Italic, Underline, Type, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify, Plus, Minus, Undo2 } from 'lucide-react';

interface TextFormattingToolbarProps {
  onFormat: (tag: string, value?: string) => void;
  onUndo: () => void;
  visible: boolean;
  canUndo: boolean;
}

export const TextFormattingToolbar = ({ onFormat, onUndo, visible, canUndo }: TextFormattingToolbarProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    { name: 'Verde', value: '#00ff85' },
    { name: 'Rosso', value: '#ff4444' },
    { name: 'Azzurro', value: '#00d4ff' },
    { name: 'Rosa', value: '#ff2882' },
    { name: 'Viola', value: '#a855f7' },
    { name: 'Giallo', value: '#fbbf24' },
    { name: 'Bianco', value: '#ffffff' },
    { name: 'Grigio', value: '#9ca3af' },
  ];

  if (!visible) return null;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-pl-dark/95 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl p-4 z-40 w-64">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm">Formatta Testo</h3>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            onUndo();
          }}
          disabled={!canUndo}
          className={`p-2 rounded-lg transition ${canUndo ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
          title="Annulla (Undo)"
        >
          <Undo2 size={16} />
        </button>
      </div>

      {/* Text Style */}
      <div className="mb-3">
        <p className="text-gray-400 text-xs mb-2">Stile</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onFormat('strong');
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
            title="Grassetto"
          >
            <Bold size={18} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onFormat('em');
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
            title="Corsivo"
          >
            <Italic size={18} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onFormat('u');
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
            title="Sottolineato"
          >
            <Underline size={18} />
          </button>
        </div>
      </div>

      {/* Font Size */}
      <div className="mb-3">
        <p className="text-gray-400 text-xs mb-2">Dimensione</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onFormat('font-size-increase');
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition flex items-center justify-center gap-1"
            title="Aumenta"
          >
            <Plus size={16} />
            <Type size={16} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onFormat('font-size-decrease');
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition flex items-center justify-center gap-1"
            title="Diminuisci"
          >
            <Minus size={16} />
            <Type size={16} />
          </button>
        </div>
      </div>

      {/* Text Alignment */}
      <div className="mb-3">
        <p className="text-gray-400 text-xs mb-2">Allineamento</p>
        <div className="grid grid-cols-4 gap-2">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onFormat('align-left');
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
            title="Sinistra"
          >
            <AlignLeft size={16} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onFormat('align-center');
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
            title="Centro"
          >
            <AlignCenter size={16} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onFormat('align-right');
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
            title="Destra"
          >
            <AlignRight size={16} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onFormat('align-justify');
            }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
            title="Giustificato"
          >
            <AlignJustify size={16} />
          </button>
        </div>
      </div>

      {/* Color Picker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-400 text-xs">Colore</p>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setShowColorPicker(!showColorPicker);
            }}
            className="p-1 bg-white/10 hover:bg-white/20 rounded text-white transition"
          >
            <Palette size={16} />
          </button>
        </div>

        {showColorPicker && (
          <div className="grid grid-cols-4 gap-2">
            {colors.map(color => (
              <button
                key={color.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onFormat('color', color.value);
                  setShowColorPicker(false);
                }}
                className="w-8 h-8 rounded-lg border-2 border-white/20 hover:border-white/50 transition"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-gray-400 text-xs">
          Seleziona testo nella textarea per formattare
        </p>
      </div>
    </div>
  );
};
