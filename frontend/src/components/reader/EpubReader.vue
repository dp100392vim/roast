<template>
    <div class="app">
        <!-- Главная страница -->
        <div v-if="currentView === 'home'" class="home-screen">
            <div class="upload-section">
                <h2>Загрузка EPUB книг</h2>

                <div class="translation-mode">
                    <button class="mode-btn" :class="{ active: translationMode === 'en-ru' }"
                        @click="setTranslationMode('en-ru')">
                        Английский → Русский
                    </button>
                    <button class="mode-btn" :class="{ active: translationMode === 'de-en' }"
                        @click="setTranslationMode('de-en')">
                        Немецкий → Английский
                    </button>
                </div>

                <div class="upload-area" :class="{ dragover: isDragOver }" @click="$refs.fileInput.click()"
                    @dragover.prevent="isDragOver = true" @dragleave.prevent="isDragOver = false"
                    @drop.prevent="handleFileDrop">
                    <p>Нажмите или перетащите EPUB файлы сюда</p>
                    <input ref="fileInput" type="file" accept=".epub" multiple class="file-input"
                        @change="handleFileSelect">
                </div>
            </div>

            <div v-if="books.length > 0" class="books-list">
                <h3>Загруженные книги</h3>
                <div v-for="book in books" :key="book.id" class="book-item" @click="openBook(book)">
                    <div>
                        <strong>{{ book.title }}</strong>
                        <div style="font-size: 0.9em; color: #666;">{{ book.author || 'Неизвестный автор' }}</div>
                    </div>
                    <button @click.stop="deleteBook(book.id)"
                        style="color: #dc3545; background: none; border: none; cursor: pointer;">Удалить</button>
                </div>
            </div>
        </div>

        <!-- Экран чтения -->
        <div v-if="currentView === 'reader'" class="reader-screen">
            <button class="back-btn" @click="goHome">← Назад</button>

            <div class="swipe-area" @click="handleSwipe"></div>

            <div class="reader-content" v-html="currentPageContent" @click="handleWordClick"
                @mouseup="handleTextSelection"></div>
        </div>

        <!-- Всплывающее окно -->
        <div v-if="showPopup" class="popup show" ref="popupRef" @click="closePopup">
            <div class="popup-content" @click.stop>
                <div class="popup-header">
                    <button class="close-btn" @click="closePopup">×</button>
                </div>

                <div v-if="isLoading" class="loading">
                    Загрузка...
                </div>

                <div v-if="error" class="error">
                    {{ error }}
                </div>

                <!-- Словарь -->
                <div v-if="popupType === 'dictionary' && dictionaryData">
                    <button class="bookmark-btn" @click="addBookmark(dictionaryData[0].word)">📑</button>

                    <div v-for="wordData in dictionaryData" :key="wordData.word" class="word-definition">
                        <h4>{{ wordData.word }}
                            <button v-if="wordData.phonetics?.length" class="play-btn" @click="playAudio(wordData)">
                                🔊 Озвучить
                            </button>
                        </h4>
                        <div v-if="wordData.phonetic" class="phonetic">{{ wordData.phonetic }}</div>

                        <div class="meanings">
                            <div v-for="meaning in wordData.meanings" :key="meaning.partOfSpeech" class="meaning-item">
                                <div class="part-of-speech">{{ meaning.partOfSpeech }}</div>
                                <div v-for="definition in meaning.definitions.slice(0, 3)" :key="definition.definition"
                                    class="definition">
                                    <strong>{{ definition.definition }}</strong>
                                    <div v-if="definition.example" class="example">"{{ definition.example }}"</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Переводчик -->
                <div v-if="popupType === 'translation' && translationData" class="translation-result">
                    {{ selectText }} = >
                    {{ translationData }}

                    <button class="play-deepl" @click="speakTranslation">🔊 Озвучить</button>

                </div>
            </div>
        </div>
    </div>
    <div v-if="showPopup" class="popup-overlay" @click="closePopup"></div>
    <div v-if="showPopup" class="popup show" ref="popupRef">
        <!-- содержимое попапа -->
    </div>
</template>
<script>

import JSZip from 'jszip';
import { ref, onMounted, nextTick, onUnmounted } from 'vue'

export default {
    name: 'EpubReader',
    setup() {
        const popupRef = ref(null);
        const currentView = ref('home');
        const books = ref([]);
        const currentBook = ref(null);
        const currentPageContent = ref('');
        const currentPage = ref(0);
        const bookPages = ref([]);
        const translationMode = ref('en-ru');
        const isDragOver = ref(false);
        const showPopup = ref(false);
        const popupType = ref('');
        const selectedWord = ref('');
        const selectText = ref('');
        const dictionaryData = ref(null);
        const translationData = ref('');
        const isLoading = ref(false);
        const error = ref('');

        const setTranslationMode = (mode) => {
            translationMode.value = mode;
            localStorage.setItem('translationMode', mode);
        };

        const handleFileDrop = (event) => {
            isDragOver.value = false;
            const files = Array.from(event.dataTransfer.files);
            processFiles(files);
        };

        const handleFileSelect = (event) => {
            const files = Array.from(event.target.files);
            processFiles(files);
        };

        const processFiles = async (files) => {
            for (const file of files) {
                if (file.name.endsWith('.epub')) {
                    await loadEpubFile(file);
                }
            }
        };

        const loadEpubFile = async (file) => {
            try {
                const zip = new JSZip();
                const contents = await zip.loadAsync(file);



                const opfFile = await findOpfFile(contents);


                if (!opfFile) throw new Error('OPF файл не найден');

                const opfContent = await contents.file(opfFile).async('text');


                const parser = new DOMParser();
                const opfDoc = parser.parseFromString(opfContent, 'text/xml');

                const title = opfDoc.querySelector('dc\\:title, title')?.textContent ||
                    opfDoc.getElementsByTagName('title')[0]?.textContent ||
                    file.name;
                const author = opfDoc.querySelector('dc\\:creator, creator')?.textContent ||
                    opfDoc.getElementsByTagName('creator')[0]?.textContent ||
                    'Неизвестный автор';



                const manifest = Array.from(opfDoc.querySelectorAll('item'));
                const spine = Array.from(opfDoc.querySelectorAll('itemref'));



                const bookContent = [];
                const basePath = opfFile.substring(0, opfFile.lastIndexOf('/') + 1);

                for (const itemref of spine) {
                    const idref = itemref.getAttribute('idref');
                    const manifestItem = manifest.find(item => item.getAttribute('id') === idref);

                    if (manifestItem) {
                        const href = manifestItem.getAttribute('href');
                        const fullPath = basePath + href;



                        let contentFile = contents.file(fullPath);
                        if (!contentFile) {
                            contentFile = contents.file(href);
                        }
                        if (!contentFile) {
                            contentFile = contents.file('OEBPS/' + href);
                        }
                        if (!contentFile) {
                            const fileName = href.split('/').pop();
                            for (const filePath of Object.keys(contents.files)) {
                                if (filePath.endsWith(fileName)) {
                                    contentFile = contents.file(filePath);
                                    break;
                                }
                            }
                        }

                        if (contentFile) {
                            const content = await contentFile.async('text');

                            bookContent.push(content);
                        } else {
                            console.warn('Файл не найден:', href);
                        }
                    }
                }



                if (bookContent.length === 0) {
                    throw new Error('Не удалось извлечь содержимое книги');
                }

                const book = {
                    id: Date.now() + Math.random(),
                    title,
                    author,
                    content: bookContent,
                    fileName: file.name,
                    lastPosition: 0
                };

                books.value.push(book);

                localStorage.setItem('epubBooks', JSON.stringify(books.value));

            } catch (err) {
                console.error('Ошибка загрузки EPUB:', err);
                alert('Ошибка загрузки файла: ' + err.message);
            }
        };

        const findOpfFile = async (contents) => {
            const containerFile = contents.file('META-INF/container.xml');
            if (containerFile) {
                const containerContent = await containerFile.async('text');
                const parser = new DOMParser();
                const doc = parser.parseFromString(containerContent, 'text/xml');
                const rootfile = doc.querySelector('rootfile');
                return rootfile?.getAttribute('full-path');
            }
            return null;
        };

        const addBookmark = (word) => {
            const bookId = currentBook.value.id;
            const page = currentPage.value;
            const bookmark = { page, word };

            // Получаем текущие закладки из localStorage
            const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');

            // Добавляем новую закладку для этой книги
            if (!bookmarks[bookId]) {
                bookmarks[bookId] = [];
            }
            bookmarks[bookId] = [bookmark]; // Заменяем старые закладки новой

            // Сохраняем обновлённые закладки
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        };

        const openBook = (book) => {
            currentBook.value = book;
            prepareBookForReading();
            currentView.value = 'reader';

            // Проверяем закладки
            const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
            const bookBookmarks = bookmarks[book.id];

            if (bookBookmarks && bookBookmarks.length > 0) {
                const firstBookmark = bookBookmarks[0];
                currentPage.value = firstBookmark.page;
                displayCurrentPage();

                // Скроллим к слову
                nextTick(() => {
                    const wordElements = document.querySelectorAll('.reader-content span');
                    wordElements.forEach(element => {
                        if (element.textContent === firstBookmark.word) {
                            element.scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                });
            } else if (book.lastPosition && book.lastPosition > 0) {
                currentPage.value = book.lastPosition;
                displayCurrentPage();
            } else {
                currentPage.value = findFirstTextPage();
                displayCurrentPage();
            }
        };

        const prepareBookForReading = () => {
            if (!currentBook.value) return;
            bookPages.value = currentBook.value.content;
        };

        const findFirstTextPage = () => {
            for (let i = 0; i < bookPages.value.length; i++) {
                const content = bookPages.value[i];
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');

                const textContent = doc.body?.textContent || doc.textContent || '';
                const cleanText = textContent.replace(/\s+/g, ' ').trim();

                if (cleanText.length > 100) {

                    return i;
                }
            }

            return 0;
        };

        const displayCurrentPage = () => {

            if (bookPages.value[currentPage.value]) {
                let content = bookPages.value[currentPage.value];


                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');

                const elementsToRemove = doc.querySelectorAll('head, script, style, meta, link');
                elementsToRemove.forEach(el => el.remove());

                let bodyContent = doc.body ? doc.body.innerHTML : doc.documentElement.innerHTML;

                const textContent = doc.body?.textContent || doc.textContent || '';
                const cleanText = textContent.replace(/\s+/g, ' ').trim();

                if (cleanText.length < 50) {

                    if (currentPage.value < bookPages.value.length - 1) {
                        currentPage.value++;
                        displayCurrentPage();
                        return;
                    } else {
                        bodyContent = '<p>Нет текстового содержимого на этой странице</p>';
                    }
                }

                if (!bodyContent.startsWith('<')) {
                    bodyContent = '<p>' + bodyContent + '</p>';
                }



                currentPageContent.value = bodyContent;
            } else {

                currentPageContent.value = '<div><p>Страница не найдена</p></div>';
            }
        };

        const handleSwipe = (event) => {
            const clickX = event.clientX;
            const screenWidth = window.innerWidth;

            if (clickX > screenWidth / 2) {
                nextPage();
            } else {
                prevPage();
            }
        };

        const nextPage = () => {
            if (currentPage.value < bookPages.value.length - 1) {
                currentPage.value++;
                displayCurrentPage();
                saveReadingPosition();
            }
        };

        const prevPage = () => {
            if (currentPage.value > 0) {
                currentPage.value--;
                displayCurrentPage();
                saveReadingPosition();
            }
        };

        const saveReadingPosition = () => {
            if (currentBook.value) {
                currentBook.value.lastPosition = currentPage.value;
                localStorage.setItem('epubBooks', JSON.stringify(books.value));
            }
        };
        const debounce = (func, wait) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        };
        const handleWordClick = async (event) => {
            if (showPopup.value) return;
            const selection = window.getSelection();
            if (selection.toString().trim().length > 0) return; // Пропускаем, если текст выделен
            const word = getWordAtPosition(event);
            if (word && /^[a-zA-Z]+$/.test(word)) {
                selectedWord.value = word;
                await showDictionary(word);
            }
        };
        const getWordAtPosition = (event) => {
            let range;
            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(event.clientX, event.clientY);
            } else if (document.caretPositionFromPoint) {
                const pos = document.caretPositionFromPoint(event.clientX, event.clientY);
                range = document.createRange();
                range.setStart(pos.offsetNode, pos.offset);
                range.setEnd(pos.offsetNode, pos.offset);
            } else {
                const element = document.elementFromPoint(event.clientX, event.clientY);
                if (element && element.nodeType === Node.TEXT_NODE) {
                    const text = element.textContent;
                    const rect = element.parentElement.getBoundingClientRect();
                    const offset = Math.round((event.clientX - rect.left) / (rect.width / text.length));
                    let start = offset;
                    let end = offset;
                    while (start > 0 && /[a-zA-Z]/.test(text[start - 1])) start--;
                    while (end < text.length && /[a-zA-Z]/.test(text[end])) end++;
                    return text.substring(start, end);
                }
                return '';
            }
            if (!range) return '';
            const textNode = range.startContainer;
            if (textNode.nodeType !== Node.TEXT_NODE) return '';
            const text = textNode.textContent;
            const offset = range.startOffset;
            let start = offset;
            let end = offset;
            while (start > 0 && /[a-zA-Z]/.test(text[start - 1])) start--;
            while (end < text.length && /[a-zA-Z]/.test(text[end])) end++;
            return text.substring(start, end);
        };

        const handleTextSelection = async () => {
            if (showPopup.value) return;
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            if (selectedText && selectedText.length > 0) {
                selectText.value = selectedText;
                await showTranslation(selectedText);
                selection.removeAllRanges();
            }
        };

        const showDictionary = async (word) => {
            popupType.value = 'dictionary';
            showPopup.value = true;
            isLoading.value = true;
            error.value = '';
            dictionaryData.value = null;

            try {
                const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
                if (response.ok) {
                    dictionaryData.value = await response.json();
                    // Проверка и воспроизведение аудио
                    if (dictionaryData.value[0]?.phonetics?.length) {
                        const audioUrl = dictionaryData.value[0].phonetics.find(p => p.audio)?.audio;

                        if (audioUrl) {
                            const audio = new Audio(audioUrl);
                            audio.play();
                        } else {

                            const utterance = new SpeechSynthesisUtterance(word);
                            utterance.lang = 'en-US';
                            window.speechSynthesis.speak(utterance);
                        }
                    } else {

                        const utterance = new SpeechSynthesisUtterance(word);
                        utterance.lang = 'en-US';
                        window.speechSynthesis.speak(utterance);
                    }
                } else {
                    throw new Error('Слово не найдено в словаре');
                }
            } catch (err) {
                error.value = 'Ошибка загрузки словаря: ' + err.message;
            } finally {
                isLoading.value = false;
            }
        };

        const showTranslation = async (text) => {
            popupType.value = 'translation';
            showPopup.value = true;
            isLoading.value = true;
            error.value = '';
            translationData.value = null;

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/deepl/translate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: text,
                        mode: translationMode.value
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    translationData.value = data;
                } else {
                    throw new Error('Ошибка перевода');
                }
            } catch (err) {
                error.value = 'Ошибка загрузки перевода: ' + err.message;
            } finally {
                isLoading.value = false;
            }
        };

        const playAudio = (wordData) => {
            const phonetics = wordData.phonetics?.find(p => p.audio);
            if (phonetics?.audio) {
                const audio = new Audio(phonetics.audio);
                audio.play().catch(err => console.error('Ошибка воспроизведения:', err));
            }
        };

        const speakTranslation = () => {
            if ('speechSynthesis' in window && translationData.value) {
                const utterance = new SpeechSynthesisUtterance(selectText.value);
                utterance.lang = translationMode.value === 'en-ru' ? 'en-US' : 'de-DE';
                window.speechSynthesis.speak(utterance);
            } else {
                alert('Ваш браузер не поддерживает синтез речи или нет текста для озвучивания.');
            }
        };

        const closePopup = () => {
            showPopup.value = false;
        };

        const goHome = () => {
            currentView.value = 'home';
            currentBook.value = null;
        };

        const deleteBook = (bookId) => {
            books.value = books.value.filter(book => book.id !== bookId);
            localStorage.setItem('epubBooks', JSON.stringify(books.value));
        };

        onMounted(() => {
            document.addEventListener('click', (event) => {
                if (showPopup.value && popupRef.value && !popupRef.value.contains(event.target)) {
                    closePopup();
                }
            });
            document.addEventListener('click', handleWordClick, { passive: true });

            const savedBooks = localStorage.getItem('epubBooks');
            if (savedBooks) {
                books.value = JSON.parse(savedBooks);
            }
            const savedMode = localStorage.getItem('translationMode');
            if (savedMode) {
                translationMode.value = savedMode;
            }
        });
        onUnmounted(() => {
            document.removeEventListener('click', handleWordClick);
            document.removeEventListener('mouseup', handleTextSelection);
        });

        return {
            currentView,
            books,
            currentBook,
            currentPageContent,
            currentPage,
            translationMode,
            isDragOver,
            showPopup,
            popupType,
            dictionaryData,
            translationData,
            isLoading,
            error,
            selectText,
            setTranslationMode,
            handleFileDrop,
            handleFileSelect,
            openBook,
            handleSwipe,
            nextPage,
            prevPage,
            handleWordClick,
            handleTextSelection,
            playAudio,
            closePopup,
            goHome,
            deleteBook,
            speakTranslation,
            addBookmark,
        };
    }
}

</script>

<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, Helvetica, sans-serif !important;
    background: #f5f5f5;
    height: 100vh;
    overflow: hidden;
}

.app {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.home-screen {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    height: 100vh;
    overflow-y: auto;
}

.upload-section {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.translation-mode {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.mode-btn {
    padding: 0.5rem 1rem;
    border: 2px solid #007bff;
    background: white;
    color: #007bff;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.mode-btn.active {
    background: #007bff;
    color: white;
}

.upload-area {
    border: 2px dashed #ddd;
    padding: 3rem;
    text-align: center;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.upload-area:hover {
    border-color: #007bff;
    background: #f8f9ff;
}

.upload-area.dragover {
    border-color: #007bff;
    background: #f0f8ff;
}

.file-input {
    display: none;
}

.books-list {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.book-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background 0.2s;
}

.book-item:hover {
    background: #f8f9fa;
}

.book-item:last-child {
    border-bottom: none;
}

.reader-screen {
    height: 100vh;
    position: relative;
    background: white;
}

.reader-content {
    height: 100vh;
    padding: 1.5rem;
    overflow-y: auto;
    line-height: 1.6;
    font-size: 18px;
    user-select: text;
}

.reader-content h1,
.reader-content h2,
.reader-content h3 {
    margin: 1rem 0;
}

.reader-content p {
    margin-bottom: 1rem;

}

.reader-content :deep(p) {
    padding-top: 10px;
    padding-bottom: 10px;
}

.reader-content :deep(p.bodytext) {
    color: #333;
    padding-top: 10px;
    padding-bottom: 10px;
}

.popup {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #ddd;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
    max-height: 40vh;
    overflow-y: auto;
    z-index: 1000;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    will-change: transform;
    /* Подсказка браузеру */
}

.popup.show {
    transform: translateY(0);
}

.popup-content {
    padding: 1.5rem;
}

.popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
}

.word-definition {
    margin-bottom: 1rem;
}

.phonetic {
    color: #666;
    font-style: italic;
    margin-bottom: 0.5rem;
}

.meanings {
    margin-top: 1rem;
}

.meaning-item {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
}

.part-of-speech {
    font-weight: bold;
    color: #007bff;
    margin-bottom: 0.5rem;
}

.definition {
    margin-bottom: 0.5rem;
}

.example {
    font-style: italic;
    color: #666;
    margin-left: 1rem;
}

.play-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    float: right;
    margin-right: 45px;
}

.play-deepl {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 15px;
    width: 100%;
}

.translation-result {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 6px;
    margin-top: 1rem;
}

.loading {
    text-align: center;
    padding: 2rem;
    color: #666;
}

.error {
    color: #dc3545;
    background: #f8d7da;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
}

.swipe-area {
    position: absolute;
    top: 0;
    width: 100%;
    height: 80px;
    z-index: 100;
    cursor: pointer;
}

.back-btn {
    position: fixed;
    top: 1rem;
    left: 1rem;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    cursor: pointer;
    z-index: 200;
}

.popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    z-index: 999;
}

.popup {
    z-index: 1000;
}

.bookmark-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    position: absolute;
    top: 2rem;
    right: 1rem;
}

.close-btn {
    position: absolute;
    top: 0.5rem;
    right: 1rem;
    background: none;
    border: none;
    cursor: pointer;
}
</style>
