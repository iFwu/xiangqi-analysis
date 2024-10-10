interface FENDisplayProps {
  fenCode: string;
  onCopy: () => void;
}

export function FENDisplay({ fenCode, onCopy }: FENDisplayProps) {
  return (
    <div className="fen-section">
      <h2>FEN代码</h2>
      <div className="fen-container">
        <input type="text" value={fenCode} readOnly />
        <button onClick={onCopy}>复制</button>
      </div>
    </div>
  );
}
