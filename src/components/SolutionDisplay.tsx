import { h } from 'preact';

export function SolutionDisplay() {
  return (
    <div className="solution-section">
      <h2>解法展示</h2>
      <canvas id="solutionCanvas" width="300" height="300"></canvas>
      <div className="solution-controls">
        <button>上一步</button>
        <button>下一步</button>
      </div>
    </div>
  );
}