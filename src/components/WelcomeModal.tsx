import { useState, useEffect } from 'preact/hooks';
import { Changelog } from './Changelog';

// 使用环境变量作为版本号
const APP_VERSION = import.meta.env.VITE_GIT_COMMIT_HASH || 'development';

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('lastSeenVersion');
    const skipFutureModals =
      localStorage.getItem('skipFutureModals') === 'true';

    if (!skipFutureModals || lastSeenVersion !== APP_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = (skip: boolean) => {
    setIsOpen(false);
    localStorage.setItem('lastSeenVersion', APP_VERSION);
    if (skip) {
      localStorage.setItem('skipFutureModals', 'true');
    } else {
      localStorage.removeItem('skipFutureModals');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <dialog open={true} className="welcome-modal">
        <div className="welcome-modal-content">
          <h2>欢迎使用</h2>
          <p>该应用正在开发完善中</p>
          <p>目前在 JJ象棋 残局截图上进行了测试</p>
          <p>请注意：需要在设置中关闭行棋提示</p>
          <Changelog />
          <div className="button-group">
            <button
              onClick={() => handleClose(false)}
              className="primary-button"
            >
              我知道了
            </button>
            <button
              onClick={() => handleClose(true)}
              className="secondary-button"
            >
              不再提示
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
