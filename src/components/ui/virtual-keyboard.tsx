import React, { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Delete, CornerDownLeft, Space } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  onSpace: () => void;
  className?: string;
  isVisible: boolean;
}

const KEYBOARD_LAYOUTS = {
  lowercase: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ],
  uppercase: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ],
  numbers: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
    ['-', '_', '=', '+', '[', ']', '|', '\\']
  ],
  symbols: [
    ['~', '`', ':', ';', '"', "'", '<', '>', ',', '.'],
    ['?', '/', '©', '®', '™', '€', '£', '¥', '₹', '₽'],
    ['♪', '♫', '✓', '✗', '∞', 'π', 'Ω']
  ]
};

export const VirtualKeyboard = ({
  onKeyPress,
  onBackspace,
  onEnter,
  onSpace,
  className,
  isVisible
}: VirtualKeyboardProps) => {
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<'letters' | 'numbers' | 'symbols'>('letters');
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHandlingRef = useRef(false);

  const getCurrentKeys = useCallback(() => {
    if (currentLayout === 'numbers') return KEYBOARD_LAYOUTS.numbers;
    if (currentLayout === 'symbols') return KEYBOARD_LAYOUTS.symbols;
    return isShiftPressed ? KEYBOARD_LAYOUTS.uppercase : KEYBOARD_LAYOUTS.lowercase;
  }, [currentLayout, isShiftPressed]);

  const handleKeyPress = useCallback((key: string) => {
    if (isHandlingRef.current) return;
    
    isHandlingRef.current = true;
    setPressedKey(key);
    onKeyPress(key);
    
    // Auto lowercase after typing a letter if shift is pressed
    if (isShiftPressed && currentLayout === 'letters') {
      setIsShiftPressed(false);
    }

    // Clear pressed state and handling flag immediately for speed
    setTimeout(() => {
      setPressedKey(null);
    }, 50);
    
    // Reset handling flag immediately
    setTimeout(() => {
      isHandlingRef.current = false;
    }, 20);
  }, [onKeyPress, isShiftPressed, currentLayout]);

  const handleSpecialKey = useCallback((action: () => void, keyId: string) => {
    if (isHandlingRef.current) return;
    
    isHandlingRef.current = true;
    setPressedKey(keyId);
    action();
    
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    
    // Clear pressed state and handling flag immediately for speed
    setTimeout(() => {
      setPressedKey(null);
    }, 50);
    
    // Reset handling flag immediately
    setTimeout(() => {
      isHandlingRef.current = false;
    }, 20);
  }, []);

  const toggleShift = useCallback(() => {
    if (isHandlingRef.current) return;
    setIsShiftPressed(prev => !prev);
  }, []);

  const switchLayout = useCallback((layout: 'letters' | 'numbers' | 'symbols') => {
    if (isHandlingRef.current) return;
    setCurrentLayout(layout);
    setIsShiftPressed(false);
  }, []);

  if (!isVisible) return null;

  const keys = getCurrentKeys();

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-gradient-to-t from-gray-900/95 via-gray-800/95 to-gray-700/95 backdrop-blur-xl",
        "border-t border-gray-600/30 shadow-2xl",
        className
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(220, 38, 127, 0.15), rgba(219, 39, 119, 0.15)), linear-gradient(to top, rgba(17, 24, 39, 0.95), rgba(55, 65, 81, 0.95))'
      }}
    >
      <div className="p-3 pb-6 max-w-full overflow-hidden">
        {/* Keyboard Rows */}
        <div className="space-y-2">
          {keys.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center items-center gap-1.5 px-1">
              {/* Shift button for third row of letters */}
              {rowIndex === 2 && currentLayout === 'letters' && (
                <button
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleShift();
                  }}
                  className={cn(
                    "h-12 px-3 min-w-[44px] rounded-lg font-medium text-base",
                    "border border-gray-500/40 text-gray-100",
                    "transition-all duration-50 touch-manipulation select-none",
                    "active:scale-95 active:opacity-80",
                    isShiftPressed 
                      ? "bg-gradient-to-r from-pink-500/80 to-rose-500/80 border-pink-400/60 shadow-lg shadow-pink-500/20" 
                      : "bg-gray-700/60 hover:bg-gray-600/70"
                  )}
                >
                  ⇧
                </button>
              )}
              
              {row.map((key, keyIndex) => (
                <button
                  key={key}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleKeyPress(key);
                  }}
                  className={cn(
                    "h-10 flex-1 max-w-[40px] min-w-[29px] rounded-lg font-medium text-base",
                    "border border-gray-500/40 bg-gray-700/60 text-gray-100",
                    "hover:bg-gray-600/70",
                    "transition-all duration-50 touch-manipulation select-none",
                    "active:scale-95",
                    pressedKey === key && "bg-gradient-to-r from-pink-500/60 to-rose-500/60 border-pink-400/60 scale-95"
                  )}
                >
                  <span className="truncate block px-1">{key}</span>
                </button>
              ))}
              
              {/* Backspace button for third row */}
              {rowIndex === 2 && (
                <button
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSpecialKey(onBackspace, 'backspace');
                  }}
                  className={cn(
                    "h-10 px-3 min-w-[40px] rounded-lg",
                    "border border-gray-500/40 bg-gray-700/60 text-gray-100",
                    "hover:bg-red-600/20 hover:border-red-500/50 hover:text-red-300",
                    "transition-all duration-50 touch-manipulation select-none",
                    "active:scale-95",
                    pressedKey === 'backspace' && "bg-red-500/40 border-red-400/60 scale-95"
                  )}
                >
                  <Delete className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Action Row */}
        <div className="flex justify-between items-center gap-1 mt-2 px-1">
          {/* Layout Switch Buttons - Left Side */}
          <div className="flex gap-1">
            {[
              { layout: 'letters' as const, label: 'ABC' },
              { layout: 'numbers' as const, label: '123' },
              { layout: 'symbols' as const, label: '#+=' }
            ].map(({ layout, label }) => (
              <button
                key={layout}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  switchLayout(layout);
                }}
                className={cn(
                  "h-9 px-2 text-xs font-medium min-w-[32px] rounded-md",
                  "border border-gray-500/40 text-gray-100",
                  "transition-all duration-100 touch-manipulation select-none",
                  "active:scale-95",
                  currentLayout === layout
                    ? "bg-gradient-to-r from-pink-500/80 to-rose-500/80 border-pink-400/60 shadow-lg shadow-pink-500/20"
                    : "bg-gray-700/60 hover:bg-gray-600/70 backdrop-blur-sm"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          
          {/* Space Button - Center */}
          <button
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSpecialKey(onSpace, 'space');
            }}
            className={cn(
              "h-9 flex-1 max-w-[140px] min-w-[80px] font-medium text-sm rounded-md mx-2",
              "border border-gray-500/40 bg-gray-700/60 text-gray-100",
              "hover:bg-gray-600/70 backdrop-blur-sm",
              "transition-all duration-100 touch-manipulation select-none",
              "active:scale-95",
              pressedKey === 'space' && "bg-gradient-to-r from-pink-500/60 to-rose-500/60 border-pink-400/60 scale-95"
            )}
          >
            <div className="flex items-center justify-center">
              <Space className="w-3 h-3 mr-1" />
              <span className="hidden xs:inline">Space</span>
            </div>
          </button>

          {/* Enter Button - Right Side */}
          <button
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSpecialKey(onEnter, 'enter');
            }}
            className={cn(
              "h-9 px-2 min-w-[36px] rounded-md",
              "border border-gray-500/40 bg-gray-700/60 text-gray-100",
              "hover:bg-green-600/20 hover:border-green-500/50 hover:text-green-300",
              "transition-all duration-100 touch-manipulation select-none",
              "active:scale-95",
              pressedKey === 'enter' && "bg-green-500/40 border-green-400/60 scale-95"
            )}
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};