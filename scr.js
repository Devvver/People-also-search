// ==UserScript==
// @name         Google Phrases Extractor Multi-Lang Edition
// @namespace    http://tampermonkey.net/
// @version      1.9.0
// @description  Яркая фиолетовая кнопка с поддержкой RU, EN, UA
// @author       Evhen Moldovanu
// @match        https://www.google.com/search*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. ОПРЕДЕЛЕНИЕ ЯЗЫКА И НАСТРОЕК
    const pageLang = document.documentElement.lang || 'ru';

    const langConfig = {
        'ru': {
            btnText: '📋 Копировать',
            headerBtnText: 'Скопировать фразы',
            popupText: 'Скопировано',
            notFound: 'Фразы не найдены',
            targetPhrases: ['Другие также ищут', 'Поиск сопутствующих товаров и сервисов']
        },
        'uk': { // Украинский в Google часто идет как 'uk'
            btnText: '📋 Копіювати',
            headerBtnText: 'Копіювати фрази',
            popupText: 'Скопійовано',
            notFound: 'Фраз не знайдено',
            targetPhrases: ['Люди також шукають', 'Перегляньте пов’язані товари й послуги']
        },
        'en': {
            btnText: '📋 Copy',
            headerBtnText: 'Copy phrases',
            popupText: 'Copied',
            notFound: 'No phrases found',
            targetPhrases: ['People also search for', 'Find related products & services']
        }
    };

    // Выбираем конфиг (по умолчанию RU, если язык не попал в список)
    const current = langConfig[pageLang.split('-')[0]] || langConfig['ru'];

    function showPopup(text) {
        const popup = document.createElement('div');
        popup.innerText = text;
        popup.style.cssText = `
            position: fixed; bottom: 10%; left: 50%; transform: translateX(-50%);
            background-color: #6200ee; color: white; padding: 12px 24px;
            border-radius: 50px; z-index: 10000; font-size: 14px;
            box-shadow: 0 4px 15px rgba(98, 0, 238, 0.4); transition: opacity 0.5s;
        `;
        document.body.appendChild(popup);
        setTimeout(() => {
            popup.style.opacity = '0';
            setTimeout(() => popup.remove(), 500);
        }, 2000);
    }

    function createPurpleButton(text) {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.style.cssText = `
            padding: 6px 18px; font-size: 13px; cursor: pointer; font-weight: 600;
            border: none; border-radius: 8px; color: white; font-family: Arial, sans-serif;
            transition: all 0.2s ease; background: linear-gradient(135deg, #8a2be2, #6200ee);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        btn.onmouseover = function() { this.style.filter = 'brightness(1.1)'; this.style.transform = 'translateY(-1px)'; };
        btn.onmouseout = function() { this.style.filter = 'brightness(1)'; this.style.transform = 'translateY(0)'; };
        return btn;
    }

    function addHeaderCopyButton() {
        const headerTools = document.querySelector('.notranslate.p64Y7b') ||
                            document.querySelector('#hdtb-tls') ||
                            document.querySelector('.hdtb-mitem');

        if (headerTools && !document.getElementById('header-copy-btn')) {
            const container = headerTools.parentElement;
            const btn = createPurpleButton(current.headerBtnText);
            btn.id = 'header-copy-btn';
            btn.style.marginLeft = '120px'; // Тот самый отступ

            btn.onclick = function(e) {
                e.preventDefault();
                try {
                    const anchors = document.querySelectorAll('a.nPDzT.T3FoJb');
                    const words = new Set();
                    anchors.forEach(anchor => {
                        if (anchor.href) {
                            const url = new URL(anchor.href);
                            const q = url.searchParams.get("q");
                            if (q) {
                                q.split('+').forEach(word => {
                                    const clean = decodeURIComponent(word.trim());
                                    if (clean) words.add(clean);
                                });
                            }
                        }
                    });

                    if (words.size === 0) {
                        showPopup(current.notFound);
                    } else {
                        const text = Array.from(words).join('\n');
                        navigator.clipboard.writeText(text).then(() => {
                            showPopup(`${current.popupText}: ${words.size}`);
                        });
                    }
                } catch (err) { console.error(err); }
            };

            container.appendChild(btn);
        }
    }

    function addInlineCopyButtons() {
        const elements = document.querySelectorAll('h2, .m3vH9d, .p64Y7b, span, div');

        elements.forEach(el => {
            const text = el.innerText ? el.innerText.trim() : '';
            // Проверяем текст по списку фраз текущего языка
            if (current.targetPhrases.includes(text) && !el.dataset.hasBtn) {
                if (el.children.length > 1 && el.tagName !== 'H2') return;
                el.dataset.hasBtn = "true";

                const btn = createPurpleButton(current.btnText);
                btn.style.marginLeft = '15px';

                btn.onclick = function(e) {
                    e.preventDefault(); e.stopPropagation();
                    const container = el.closest('.ULSxyf, .VDgS6d, .WwS1ce, .g') || el.parentElement.parentElement;
                    const phrases = Array.from(container.querySelectorAll('.wM6W7d, .s75vqc, .VLZ4S, a div'))
                        .map(item => item.innerText.trim())
                        .filter(txt => txt.length > 1 && !current.targetPhrases.includes(txt) && !txt.includes(current.btnText));

                    const uniquePhrases = [...new Set(phrases)];
                    if (uniquePhrases.length > 0) {
                        navigator.clipboard.writeText(uniquePhrases.join('\n')).then(() =>
                            showPopup(`${current.popupText}: ${uniquePhrases.length}`)
                        );
                    }
                };
                el.style.display = 'inline-flex'; el.style.alignItems = 'center'; el.appendChild(btn);
            }
        });
    }

    const mainObserver = new MutationObserver(() => {
        addInlineCopyButtons();
        addHeaderCopyButton();
    });

    mainObserver.observe(document.body, { childList: true, subtree: true });
    addInlineCopyButtons();
    addHeaderCopyButton();
})();