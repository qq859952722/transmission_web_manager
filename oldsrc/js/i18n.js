var TWC = TWC || {};

TWC.i18n = (function() {
    var _currentLang = 'zh-CN';
    var _data = null;
    var _storageKey = 'twc-lang';

    function init() {
        var saved = TWC.utils.storageGet(_storageKey, 'zh-CN');
        _currentLang = saved;
        _updateData();
    }

    function _updateData() {
        if (_currentLang === 'zh-CN') {
            _data = typeof TWC_LANG_ZH !== 'undefined' ? TWC_LANG_ZH : {};
        } else {
            _data = typeof TWC_LANG_EN !== 'undefined' ? TWC_LANG_EN : {};
        }
    }

    function setLanguage(lang) {
        _currentLang = lang;
        TWC.utils.storageSet(_storageKey, lang);
        _updateData();
        window.location.reload(); // Simplest way to re-render everything
    }

    function getLanguage() {
        return _currentLang;
    }

    function t(path) {
        if (!_data) return path;
        var parts = path.split('.');
        var current = _data;
        for (var i = 0; i < parts.length; i++) {
            if (current[parts[i]] === undefined) return path;
            current = current[parts[i]];
        }
        return current;
    }

    return {
        init: init,
        setLanguage: setLanguage,
        getLanguage: getLanguage,
        t: t
    };
})();
