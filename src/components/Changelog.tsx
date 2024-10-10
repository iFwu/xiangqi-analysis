import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { html } from '../../CHANGELOG.md';

export const Changelog: FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="changelog">
      <h3 onClick={toggleExpand} className="changelog-title">
        <span className="changelog-arrow">{isExpanded ? '▼' : '▶'}</span>
        更新日志
      </h3>
      {isExpanded && (
        <div
          className="changelog-content markdown-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
};
