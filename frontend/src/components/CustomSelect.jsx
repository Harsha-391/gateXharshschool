import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * CustomSelect – drop-in replacement for native <select> that always opens DOWNWARD with a scrollbar.
 */
export default function CustomSelect({ value, onChange, children, className = '', style = {}, disabled = false, placeholder = 'Select...', ...rest }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Parse <option> children into { value, label, disabled } objects
  const options = React.Children.toArray(children)
    .filter(c => c.type === 'option')
    .map(c => ({
      value: c.props.value !== undefined ? c.props.value : c.props.children,
      label: c.props.children,
      disabled: !!c.props.disabled
    }));

  const updateCoords = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      // Since portal is outside ref container, we check if target is inside portal or ref
      const portalElements = document.querySelectorAll('.custom-select-portal');
      let clickedInsidePortal = false;
      portalElements.forEach(p => {
        if (p.contains(e.target)) clickedInsidePortal = true;
      });
      if (ref.current && !ref.current.contains(e.target) && !clickedInsidePortal) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Update dropdown coordinates when open, and handle window events
  useEffect(() => {
    if (open) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
      };
    }
  }, [open]);

  const selectedOption = options.find(o => String(o.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : (placeholder || 'Select...');

  const handleSelect = (optValue) => {
    if (onChange) {
      onChange({ target: { value: optValue } });
    }
    setOpen(false);
  };

  const hasStyleClass = className.includes('select-custom') || className.includes('form-control');

  const triggerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    userSelect: 'none',
    color: selectedOption ? 'var(--text-main)' : 'var(--text-muted)',
    ...(hasStyleClass ? {} : {
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px solid var(--border-glass)',
      background: disabled ? 'var(--bg-glass)' : 'var(--bg-glass-active, var(--bg-card))',
      minHeight: '38px',
    }),
    ...(open && !hasStyleClass ? { borderColor: 'hsl(var(--color-primary))' } : {}),
  };

  const wrapperStyle = {
    position: 'relative',
    display: style.display || 'inline-block',
    width: style.width || 'auto',
    minWidth: style.minWidth || '140px',
    flex: style.flex || undefined,
    margin: style.margin || undefined,
    marginTop: style.marginTop || undefined,
    marginBottom: style.marginBottom || undefined,
    marginLeft: style.marginLeft || undefined,
    marginRight: style.marginRight || undefined,
  };

  const triggerStyleFinal = {
    ...triggerStyle,
    ...Object.fromEntries(
      Object.entries(style).filter(([key]) => !['display', 'width', 'flex', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight'].includes(key))
    )
  };

  return (
    <div ref={ref} style={wrapperStyle}>
      {/* Trigger */}
      <div
        onClick={() => { if (!disabled) setOpen(!open); }}
        className={className}
        style={triggerStyleFinal}
        {...rest}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {displayLabel}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: '8px', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Dropdown (via portal to escape overflow:hidden clip contexts) */}
      {open && createPortal(
        <div
          className="custom-select-portal"
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 999999999,
            marginTop: '4px',
            background: 'var(--bg-dropdown, var(--bg-card))',
            border: '1px solid var(--border-glass)',
            borderRadius: '8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            maxHeight: '200px',
            overflowY: 'auto',
            overflowX: 'hidden',
            animation: 'none',
          }}
        >
          {options.map((opt, idx) => {
            const isActive = String(opt.value) === String(value);
            return (
              <div
                key={`${opt.value}-${idx}`}
                onClick={() => { if (!opt.disabled) handleSelect(opt.value); }}
                style={{
                  padding: '5px 10px',
                  fontSize: '0.85rem',
                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  background: isActive ? '#FF8C42' : 'transparent',
                  color: opt.disabled ? 'var(--text-muted)' : (isActive ? '#ffffff' : 'var(--text-main)'),
                  fontWeight: isActive ? 600 : 400,
                  opacity: opt.disabled ? 0.5 : 1,
                  transition: 'background 0.1s ease, color 0.1s ease',
                  borderBottom: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                onMouseEnter={(e) => { 
                  if (!opt.disabled) {
                    e.currentTarget.style.background = '#FF8C42';
                    e.currentTarget.style.color = '#ffffff';
                  } 
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.background = isActive ? '#FF8C42' : 'transparent'; 
                  e.currentTarget.style.color = opt.disabled ? 'var(--text-muted)' : (isActive ? '#ffffff' : 'var(--text-main)');
                }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

