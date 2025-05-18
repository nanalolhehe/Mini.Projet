const MAX_USERS = 500;
const SAVE_KEY = "frenchWordDreamUsers";
const MIN_WORD_LENGTH = 2; 

const screens = {
    login: document.getElementById('login-screen'),
    mainMenu: document.getElementById('main-menu'),
    profile: document.getElementById('profile-screen'),
    game: document.getElementById('game-screen')
};

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const playerNameInput = document.getElementById('player-name');
const loginBtn = document.getElementById('login-btn');
const loginMessage = document.getElementById('login-message');
const registerNameInput = document.getElementById('register-name');
const registerSurnameInput = document.getElementById('register-surname');
const registerAgeInput = document.getElementById('register-age');
const registerBtn = document.getElementById('register-btn');
const registerMessage = document.getElementById('register-message');
const welcomeNameSpan = document.getElementById('welcome-name');
const menuLevelSpan = document.getElementById('menu-level');
const menuScoreSpan = document.getElementById('menu-score');
const newGameBtn = document.getElementById('new-game-btn');
const resumeGameBtn = document.getElementById('resume-game-btn');
const profileBtn = document.getElementById('profile-btn');
const quitBtn = document.getElementById('quit-btn');
const profileNameSpan = document.getElementById('profile-name');
const profileAgeSpan = document.getElementById('profile-age');
const profileLevelSpan = document.getElementById('profile-level');
const profileScoreSpan = document.getElementById('profile-score');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const currentLevelSpan = document.getElementById('current-level');
const wordsFoundSpan = document.getElementById('words-found');
const wordsNeededSpan = document.getElementById('words-needed');
const minLengthSpan = document.getElementById('min-length');
const lettersContainer = document.getElementById('letters-container');
const wordInput = document.getElementById('word-input');
const submitWordBtn = document.getElementById('submit-word-btn');
const gameMessage = document.getElementById('game-message');
const wordList = document.getElementById('word-list');
const saveQuitBtn = document.getElementById('save-quit-btn');

function init3DBackground() {
    const container = document.getElementById('threejs-bg');
    if (!container) return;

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 1500;

    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);
    const sizeArray = new Float32Array(particleCount);

    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
        colorArray[i] = 0.8 + Math.random() * 0.2; 
        if (i % 3 === 0) {
            sizeArray[i/3] = Math.random() * 0.2 + 0.05;
        }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.1,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        vertexColors: true,
        blending: THREE.AdditiveBlending
    });

    const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleMesh);

    camera.position.z = 3;

    function animate() {
        requestAnimationFrame(animate);

        particleMesh.rotation.x += 0.0003;
        particleMesh.rotation.y += 0.0005;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function createBubbles() {
    const container = document.getElementById('bubble-container');
    if (!container) return;

    container.innerHTML = '';

    const bubbleCount = Math.floor(window.innerWidth / 50); 
    const colors = [
        'rgba(255, 182, 230, 0.6)',
        'rgba(230, 182, 255, 0.6)',
        'rgba(182, 230, 255, 0.6)'
    ];

    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';

        const size = 30 + Math.random() * 120;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;

        bubble.style.left = `${10 + Math.random() * 80}vw`;
        bubble.style.top = `${10 + Math.random() * 80}vh`;

        bubble.style.background = colors[Math.floor(Math.random() * colors.length)];

        const duration = 15 + Math.random() * 30;
        const delay = -Math.random() * 30;
        bubble.style.animation = `floatBubble ${duration}s ${delay}s infinite ease-in-out`;

        bubble.style.filter = `blur(${Math.random() * 3}px)`;
        bubble.style.opacity = 0.3 + Math.random() * 0.4;

        container.appendChild(bubble);
    }
}

function showScreen(screenName) {
    Object.keys(screens).forEach(key => {
        if (key === screenName) {
            screens[key].classList.add('active');
        } else {
            screens[key].classList.remove('active');
        }
    });
}

function getStringByteLength(str) {

    return new TextEncoder().encode(str).length + 1; 
}

function stringToWasm(str) {
    const maxLen = getStringByteLength(str);
    const ptr = Module.ccall('malloc', 'number', ['number'], [maxLen]);
    Module.stringToUTF8(str, ptr, maxLen);
    return ptr;
}

function getC(prop='', isString=false) {
    if (!prop) return Module.ccall('hasCurrentUser', 'boolean', [])
    if (!isString) return Module.ccall(`get_${prop}`, 'number', [])
    else return Module.UTF8ToString(Module.ccall(`get_${prop}`, 'number', []));
}

function setC(prop='', val) {
    if (!prop) Module.ccall(`reset_user`, 'void', []);
    else Module.ccall(`set_${prop}`, 'void', ['number'], [val]);
}

function init() {
    console.log(localStorage);
    createFrenchWordGame({

        print: function(text) { console.log('[WASM stdout]:', text); },
        printErr: function(text) { console.error('[WASM stderr]:', text); },

    })
    .then(function(Module) {

        console.log('WebAssembly module initialized!');

        window.Module = Module;
        loadUsers()

    })
    setupEventListeners();
    init3DBackground();
    createBubbles();
    showScreen('login');
}

function setupEventListeners() {

    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);

    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    registerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') registerSurnameInput.focus();
    });

    registerSurnameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') registerAgeInput.focus();
    });

    registerAgeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleRegister();
    });

    newGameBtn.addEventListener('click', () => {
        if (!getC()) return;
        setC('level', 1)
        setC('score', 0)
        startGame();
    });

    resumeGameBtn.addEventListener('click', () => {
        if (!getC()) return;
        startGame();
    });

    profileBtn.addEventListener('click', showProfile);
    quitBtn.addEventListener('click', quitGame);

    backToMenuBtn.addEventListener('click', showMainMenu);

    submitWordBtn.addEventListener('click', submitWord);
    wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitWord();
    });

    saveQuitBtn.addEventListener('click', saveAndQuit);

}

function isWordInDictionary(word) {

    if (word.length === 2) {
        const commonTwoLetterWords = ["de", "le", "la", "en", "un", "à", "et", "ou", "si", "il", "du", "au", "ce", "ça"];
        if (commonTwoLetterWords.includes(word)) return true;
    }

    let left = 0;
    let right = frenchDict.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const cmp = word.localeCompare(frenchDict[mid]);

        if (cmp === 0) return true;
        if (cmp < 0) right = mid - 1;
        else left = mid + 1;
    }

    return false;
}

function handleLogin() {
    const name = playerNameInput.value.trim();

    if (!name) {
        showMessage(loginMessage, 'Please enter your name', 'error');
        return;
    }

    Module.ccall(
        'userExists',  
        'number',       
        ['string'],    
        [name]      
    );

    if (getC()) {
        showMainMenu();
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        registerNameInput.value = name;
        registerSurnameInput.focus();
    }
}

function handleRegister() {
    const name = registerNameInput.value.trim();
    const surname = registerSurnameInput.value.trim();
    const age = parseInt(registerAgeInput.value);

    if (!name || !surname) {
        showMessage(registerMessage, 'Please enter your name and surname', 'error');
        return;
    }

    if (isNaN(age)) {
        showMessage(registerMessage, 'Please enter a valid age', 'error');
        return;
    }

    if (getC('user_count') >= MAX_USERS) {
        showMessage(registerMessage, 'Maximum number of users reached!', 'error');
        return;
    }

    Module.ccall(
        'handleRegister',  
        'void',       
        ['string', 'string', 'number'],    
        [name, surname, age]      
    );

    saveUsers();
    showMainMenu();
}

function showMainMenu() {
    if (!getC()) {
        showScreen('login');
        return;
    }

    welcomeNameSpan.textContent = getC('name', true);
    menuLevelSpan.textContent = getC('level')
    menuScoreSpan.textContent = getC('score')
    showScreen('mainMenu');
}

function showProfile() {
    if (!getC()) {
        showScreen('login');
        return;
    }

    profileNameSpan.textContent = 
        `${getC('name', true)} ` +
        getC('surname', true);

    profileAgeSpan.textContent = getC('age');
    profileLevelSpan.textContent = getC('level');
    profileScoreSpan.textContent = getC('score');

    showScreen('profile');
}

function startGame() {
    if (!getC()) {
        showScreen('login');
        return;
    }

    Module.ccall('startGame', 'void', []);

    updateGameUI();
    wordInput.focus();
    showScreen('game');
}

function updateGameUI() {
    if (!getC()) return;

    currentLevelSpan.textContent = getC('level');
    wordsFoundSpan.textContent = getC('found_words_count');
    wordsNeededSpan.textContent = getC('required_words');
    minLengthSpan.textContent = getC('min_length');

    lettersContainer.innerHTML = '';

    for (let i = 0; i < getC('letter_count'); i++) {
        const letter = String.fromCharCode(Module.ccall('getLetter', 'number', ['number'], [i]));
        const letterEl = document.createElement('div');
        letterEl.className = 'letter';
        letterEl.textContent = letter.toUpperCase();
        letterEl.dataset.index = i;
        letterEl.style.animationDuration = `${4 + Math.random() * 3}s`;

        for (let j = 0; j < getC('selected_letter_count'); j++) {
            const index = Module.ccall('getSelectedLetter', 'number', ['number'], [j]);

            if (index == i) {
                letterEl.classList.add('selected');
                break;
            }
        }

        letterEl.addEventListener('click', () => {
            toggleLetterSelection(i);
        });

        lettersContainer.appendChild(letterEl);
    };

    wordList.innerHTML = '';
    for (let i = 0; i < getC('found_words_count'); i++) {
        const wordPtr = Module.ccall('getFoundWord', 'number', ['number'], [i]);
        const word = Module.UTF8ToString(wordPtr);
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = `
            <span>${word}</span>
            <span class="word-score">+${word.length * getC('level')}</span>
        `;
        wordList.appendChild(wordItem);
    }

    updateWordInput();
    gameMessage.classList.add('hidden');
}

function toggleLetterSelection(index) {
    Module.ccall("toggleLetterSelection", 'void', ['number'], [index]);

    updateWordInput();
    updateGameUI();
}

function updateWordInput() {
    let word = '';
    for (let i = 0; i < getC('selected_letter_count'); i++) {
        const letterPtr = Module.ccall('getLetter', 'number', ['number'], [Module.ccall('getSelectedLetter', 'number', ['number'], [i])]);
        const letter = String.fromCharCode(letterPtr);
        word = word + letter;
    }
    console.log(word);
    wordInput.value = word;
}

function submitWord() {
    const word = wordInput.value.trim().toLowerCase();

    
    gameMessage.classList.add('hidden');

    const status = Module.ccall(
        'submitWord',  
        'number',       
        ['string'],    
        [word]      
    );

    switch (status) {
        case 1:
            showMessage(gameMessage, 'Please enter a word', 'error');
            break;
        case 2:
            saveAndQuit();
            break;
        case 3:
            showMessage(gameMessage, `Word too short! Needs at least ${getC("min_length")} letters.`, 'error');
            break;
        case 4:
            showMessage(gameMessage, 'Invalid word! Can only use given letters.', 'error');
            break;
        case 5:
            showMessage(gameMessage, 'Word not in dictionary!', 'error');
            break;
        case 6:
            showMessage(gameMessage, `"${word}" has already been found! Try another word.`, 'error');
            wordInput.value = ''; 
            break;
        default:
            showMessage(gameMessage, `Valid word: "${word}" (+${word.length * getC('level')} points)`, 'success');
            if (status) {
                setTimeout(completeLevel, 1000);
            } else {
                updateGameUI();
            }
    }
    
    
    if (status !== 2 && status !== 6) {
        wordInput.focus();
    }
}

function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `dream-message ${type}`;
    element.classList.remove('hidden');

    if (type !== 'error') {
        setTimeout(() => {
            element.classList.add('hidden');
        }, 3000);
    }
}

function completeLevel() {
    showMessage(gameMessage, `Level ${getC('level')} completed! Your score: ${getC('score')}`, 'success');

    setC('level', getC('level')+1);
    saveUsers();

    setTimeout(() => {
        if (confirm(`Level ${getC('level')-1} completed! Continue to next level?`)) {
            startGame();
        } else {
            showMainMenu();
        }
    }, 1000);
}

function saveAndQuit() {
    saveUsers();
    showMainMenu();
}

function quitGame() {
    if (confirm('Are you sure you want to quit?')) {
        setC();
        showScreen('login');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    }
}

const MAX_NAME_LENGTH = 64;
const USER_SIZE = MAX_NAME_LENGTH * 2 + 4 * 3;

function writeString(str, memory, offset) {
    for (let i = 0; i < MAX_NAME_LENGTH; i++) {
        memory.setUint8(offset + i, i < str.length ? str.charCodeAt(i) : 0);
    }
}

function readString(memory, offset) {
    let str = '';
    for (let i = 0; i < MAX_NAME_LENGTH; i++) {
        const char = memory.getUint8(offset + i);
        if (char === 0) break;
        str += String.fromCharCode(char);
    }
    return str;
}

function loadUsers() {
    const usersJSON = localStorage.getItem("users");
    const users = usersJSON ? JSON.parse(usersJSON) : [];
    const userCount = users.length;
    const memory = new DataView(Module.HEAPU8.buffer);

    const ptr = Module._malloc(USER_SIZE * userCount);

    for (let i = 0; i < userCount; i++) {
        const offset = ptr + i * USER_SIZE;
        const user = users[i];
        writeString(user.name, memory, offset);
        writeString(user.surname, memory, offset + MAX_NAME_LENGTH);
        memory.setInt32(offset + MAX_NAME_LENGTH * 2, user.age, true);
        memory.setInt32(offset + MAX_NAME_LENGTH * 2 + 4, user.level, true);
        memory.setInt32(offset + MAX_NAME_LENGTH * 2 + 8, user.score, true);
    }
    console.log('it loaded');

    Module._storeUsersFromJS(ptr, userCount);
    Module._free(ptr);
}

function saveUsers() {
    const memory = new DataView(Module.HEAPU8.buffer);

    const userCount = Module._getStoredUserCount();
    const basePtr = Module._getStoredUsers();

    const users = [];

    for (let i = 0; i < userCount; i++) {
        const offset = basePtr + i * USER_SIZE;
        const user = {
            name: readString(memory, offset),
            surname: readString(memory, offset + MAX_NAME_LENGTH),
            age: memory.getInt32(offset + MAX_NAME_LENGTH * 2, true),
            level: memory.getInt32(offset + MAX_NAME_LENGTH * 2 + 4, true),
            score: memory.getInt32(offset + MAX_NAME_LENGTH * 2 + 8, true)
        };
        users.push(user);
    }

    localStorage.setItem("userCount", userCount);
    localStorage.setItem("users", JSON.stringify(users));
    console.log("Saved users to localStorage:", users);
}

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', () => {
    createBubbles(); 
});
