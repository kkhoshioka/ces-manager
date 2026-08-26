import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ComboBox.module.css';

interface ComboBoxProps {
    value: string;
    options: string[];
    onChange: (value: string) => void;
    placeholder?: string;
    /** 呼び出し元のテーブル用スタイルをそのまま使えるようにする */
    inputClassName?: string;
    inputStyle?: React.CSSProperties;
    disabled?: boolean;
    title?: string;
}

/**
 * 候補から選べて自由入力もできる入力欄。
 *
 * ネイティブの <input list> + <datalist> は入力済みの値で候補を絞り込むため、
 * 一度選ぶと消さない限り他の候補を選べない。ここでは
 *   - フォーカス／クリック時に入力済みの文字を全選択して候補を全件表示する
 *     （消さずにそのまま上書き入力できる）
 *   - 入力し始めてから絞り込む
 * という挙動にしている。
 *
 * 明細テーブルは overflow が効いているため、候補一覧はポータルで body に出す。
 */
const ComboBox: React.FC<ComboBoxProps> = ({
    value,
    options,
    onChange,
    placeholder,
    inputClassName = '',
    inputStyle,
    disabled,
    title
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const visibleOptions = useMemo(() => {
        if (!isFiltering || !value) return options;
        const query = value.toLowerCase();
        return options.filter(option => option.toLowerCase().includes(query));
    }, [options, value, isFiltering]);

    const updatePosition = useCallback(() => {
        const input = inputRef.current;
        if (!input) return;
        const rect = input.getBoundingClientRect();
        setPosition({ top: rect.bottom + 2, left: rect.left, width: Math.max(rect.width, 160) });
    }, []);

    useLayoutEffect(() => {
        if (isOpen) updatePosition();
    }, [isOpen, updatePosition, visibleOptions.length]);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (inputRef.current?.contains(target) || listRef.current?.contains(target)) return;
            setIsOpen(false);
        };
        // 一覧はページ座標に固定で出すので、スクロールやリサイズで位置を追従させる
        const handleReposition = () => updatePosition();

        document.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('scroll', handleReposition, true);
        window.addEventListener('resize', handleReposition);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            window.removeEventListener('scroll', handleReposition, true);
            window.removeEventListener('resize', handleReposition);
        };
    }, [isOpen, updatePosition]);

    useEffect(() => {
        if (!isOpen || activeIndex < 0) return;
        const activeNode = listRef.current?.children[activeIndex] as HTMLElement | undefined;
        activeNode?.scrollIntoView({ block: 'nearest' });
    }, [isOpen, activeIndex]);

    const openWithAllOptions = () => {
        setIsFiltering(false);
        setActiveIndex(-1);
        setIsOpen(true);
    };

    const commit = (option: string) => {
        onChange(option);
        setIsOpen(false);
        setIsFiltering(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // 日本語入力の変換確定 Enter を候補選択と取り違えない
        if (event.nativeEvent.isComposing) return;

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!isOpen) {
                openWithAllOptions();
                return;
            }
            if (visibleOptions.length === 0) return;
            const delta = event.key === 'ArrowDown' ? 1 : -1;
            setActiveIndex(current => {
                const next = current + delta;
                if (next < 0) return visibleOptions.length - 1;
                if (next >= visibleOptions.length) return 0;
                return next;
            });
        } else if (event.key === 'Enter') {
            if (isOpen && activeIndex >= 0 && visibleOptions[activeIndex] !== undefined) {
                // 候補を選んだだけなので、フォームの送信までは伝えない
                event.preventDefault();
                event.stopPropagation();
                commit(visibleOptions[activeIndex]);
            } else {
                setIsOpen(false);
            }
        } else if (event.key === 'Escape') {
            setIsOpen(false);
        } else if (event.key === 'Tab') {
            setIsOpen(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <input
                ref={inputRef}
                type="text"
                className={inputClassName}
                style={inputStyle}
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                title={title}
                autoComplete="off"
                onChange={event => {
                    setIsFiltering(true);
                    setActiveIndex(-1);
                    setIsOpen(true);
                    onChange(event.target.value);
                }}
                onFocus={event => {
                    // 入力済みの値を全選択しておけば、消さずにそのまま上書きできる
                    event.target.select();
                    openWithAllOptions();
                }}
                onClick={event => {
                    if (!isOpen) {
                        (event.target as HTMLInputElement).select();
                        openWithAllOptions();
                    }
                }}
                onKeyDown={handleKeyDown}
            />
            {isOpen && position && createPortal(
                <ul
                    ref={listRef}
                    className={styles.dropdown}
                    style={{ top: position.top, left: position.left, width: position.width }}
                >
                    {visibleOptions.length === 0 ? (
                        <li className={styles.empty}>候補がありません（そのまま入力できます）</li>
                    ) : (
                        visibleOptions.map((option, index) => (
                            <li
                                key={option}
                                className={[
                                    styles.option,
                                    index === activeIndex ? styles.active : '',
                                    option === value ? styles.selected : ''
                                ].filter(Boolean).join(' ')}
                                // クリックで input の blur が先に走って一覧が閉じるのを防ぐ
                                onMouseDown={event => event.preventDefault()}
                                onClick={() => commit(option)}
                            >
                                {option}
                            </li>
                        ))
                    )}
                </ul>,
                document.body
            )}
        </div>
    );
};

export default ComboBox;
