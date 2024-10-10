import { FunctionComponent } from 'preact';

interface DepthControlProps {
  depth: number;
  onDepthChange: (newDepth: number) => void;
}

export const DepthControl: FunctionComponent<DepthControlProps> = ({ depth, onDepthChange }) => {
  return (
    <div className="depth-control-section">
      <h2>搜索深度控制</h2>
      <div className="depth-slider-container">
        <label htmlFor="depth-slider">当前深度: {depth}</label>
        <input
          id="depth-slider"
          type="range"
          min="10"
          max="30"
          value={depth}
          onChange={(e) => {
            if (e.target instanceof HTMLInputElement) {
              onDepthChange(Number(e.target.value));
            }
          }}
        />
      </div>
    </div>
  );
};
