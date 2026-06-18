import React, { useState, useEffect } from 'react';

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
      {children}
    </div>
  );
}
