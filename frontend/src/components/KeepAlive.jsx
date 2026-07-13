import React, { useState, useEffect } from 'react';
import './KeepAlive.css';

const KeepAliveContent = React.memo(({ active, children }) => {
  return children;
}, (prevProps, nextProps) => {
  if (!prevProps.active && !nextProps.active) {
    return true;
  }
  return false;
});

export default function KeepAlive({ active, children }) {
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    if (active) {
      setHasRendered(true);
    }
  }, [active]);

  if (!hasRendered) {
    return null;
  }

  return (
    <div style={{ display: active ? 'block' : 'none', width: '100%', height: '100%' }}>
      <KeepAliveContent active={active}>
        {children}
      </KeepAliveContent>
    </div>
  );
}

