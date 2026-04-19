var TWC = TWC || {};

TWC.theme = (function() {
    var _currentTheme = 'light';
    var _storageKey = 'twc-theme';
    var _listeners = [];

    function init() {
        var saved = TWC.utils.storageGet(_storageKey, 'light');
        _currentTheme = saved;
        applyTheme(_currentTheme);
    }

    function applyTheme(theme) {
        _currentTheme = theme;
        var root = document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(theme);
        if (theme === 'dark') {
            root.style.colorScheme = 'dark';
        } else {
            root.style.colorScheme = 'light';
        }
        TWC.utils.storageSet(_storageKey, theme);
        _notifyListeners(theme);
    }

    function toggle() {
        var newTheme = _currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    }

    function getTheme() {
        return _currentTheme;
    }

    function isDark() {
        return _currentTheme === 'dark';
    }

    function onThemeChange(callback) {
        _listeners.push(callback);
    }

    function _notifyListeners(theme) {
        for (var i = 0; i < _listeners.length; i++) {
            _listeners[i](theme);
        }
    }

    function getThemeColors() {
        if (_currentTheme === 'dark') {
            return {
                bgPrimary: '#1e1e2e',
                bgSecondary: '#262637',
                bgTertiary: '#2d2d3f',
                bgCard: '#2a2a3c',
                bgHover: '#353548',
                border: '#3f3f5c',
                textPrimary: '#e2e2f0',
                textSecondary: '#a0a0b8',
                textMuted: '#6c6c88',
                accent: '#5b8def',
                accentHover: '#7aa5ff',
                success: '#4ade80',
                warning: '#fbbf24',
                danger: '#f87171',
                info: '#60a5fa',
                scrollbarTrack: '#2a2a3c',
                scrollbarThumb: '#4a4a6a'
            };
        }
        return {
            bgPrimary: '#f5f7fa',
            bgSecondary: '#ffffff',
            bgTertiary: '#f0f2f5',
            bgCard: '#ffffff',
            bgHover: '#e8ecf2',
            border: '#dde1e8',
            textPrimary: '#1f2937',
            textSecondary: '#4b5563',
            textMuted: '#9ca3af',
            accent: '#3b82f6',
            accentHover: '#2563eb',
            success: '#22c55e',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#3b82f6',
            scrollbarTrack: '#f0f2f5',
            scrollbarThumb: '#c1c8d4'
        };
    }

    return {
        init: init,
        applyTheme: applyTheme,
        toggle: toggle,
        getTheme: getTheme,
        isDark: isDark,
        onThemeChange: onThemeChange,
        getThemeColors: getThemeColors
    };
})();
