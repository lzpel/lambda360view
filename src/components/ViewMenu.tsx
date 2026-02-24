import React from 'react';
import {
    AxisIcon,
    CubeIsoIcon,
    CubeFrontIcon,
    CubeBackIcon,
    CubeTopIcon,
    CubeBottomIcon,
    CubeLeftIcon,
    CubeRightIcon,
} from './Icon';

export type ViewType = 'iso' | 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right';

interface ViewMenuProps {
    onViewChange: (view: ViewType) => void;
    onToggleAxis?: () => void;
    showAxisButton?: boolean;
    axisEnabled?: boolean;
}

export function ViewMenu({
    onViewChange,
    onToggleAxis,
    showAxisButton = true,
    axisEnabled = true,
}: ViewMenuProps) {
    const buttonStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        cursor: 'pointer',
        borderRadius: 4,
        transition: 'background-color 0.15s',
        padding: 0,
    };

    const activeButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        backgroundColor: '#e3f2fd',
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = '#e3f2fd';
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>, isActive: boolean) => {
        e.currentTarget.style.backgroundColor = isActive ? '#e3f2fd' : '#fff';
    };

    const views: { type: ViewType; icon: React.ReactNode; title: string }[] = [
        { type: 'iso', icon: <CubeIsoIcon size={20} />, title: '45° View' },
        { type: 'front', icon: <CubeFrontIcon size={20} />, title: 'Front' },
        { type: 'back', icon: <CubeBackIcon size={20} />, title: 'Back' },
        { type: 'top', icon: <CubeTopIcon size={20} />, title: 'Top' },
        { type: 'bottom', icon: <CubeBottomIcon size={20} />, title: 'Bottom' },
        { type: 'left', icon: <CubeLeftIcon size={20} />, title: 'Left' },
        { type: 'right', icon: <CubeRightIcon size={20} />, title: 'Right' },
    ];

    return (
        <div
            style={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 1000,
                display: 'flex',
                gap: 4,
                padding: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
        >
            {/* 座標軸トグル */}
            {showAxisButton && (
                <>
                    <button
                        style={axisEnabled ? activeButtonStyle : buttonStyle}
                        onClick={onToggleAxis}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={(e) => handleMouseLeave(e, axisEnabled)}
                        title="Toggle Axis"
                    >
                        <AxisIcon size={20} />
                    </button>
                    <div style={{ width: 1, backgroundColor: '#ddd', margin: '0 4px' }} />
                </>
            )}

            {/* ビュー切り替えボタン */}
            {views.map(({ type, icon, title }) => (
                <button
                    key={type}
                    style={buttonStyle}
                    onClick={() => onViewChange(type)}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={(e) => handleMouseLeave(e, false)}
                    title={title}
                >
                    {icon}
                </button>
            ))}
        </div>
    );
}
