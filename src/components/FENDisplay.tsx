import { h } from 'preact';

interface FENDisplayProps {
  fenCode: string;
  onCopy: () => void;
  onToggleSuffix: () => void;
  includeSuffix: boolean;
}

export function FENDisplay({ fenCode, onCopy, onToggleSuffix, includeSuffix }: FENDisplayProps) {
  return (
    <div className="fen-section">
      <h2>FEN代码</h2>
      <div className="fen-container">
        <input type="text" value={fenCode} readOnly />
        <button onClick={onCopy}>复制</button>
      </div>
      <div>
        <label>
          <input type="checkbox" checked={includeSuffix} onChange={onToggleSuffix} />
          包含后缀
        </label>
      </div>
    </div>
  );
}