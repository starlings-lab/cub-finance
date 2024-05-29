import React, { useEffect, useRef } from 'react';

interface ClickAwayListenerProps {
  children: React.ReactNode;
  className?: string;
  onClickAway: () => void;
}

const ClickAwayListener: React.FC<ClickAwayListenerProps> = ({ children, className, onClickAway }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickAway();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClickAway]);

  return <div className={className} ref={ref}>{children}</div>;
};

export default ClickAwayListener;