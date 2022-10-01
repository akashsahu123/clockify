//stowatch states : start, running, paused

const startButton = document.querySelector('#stopwatch-start');
const pauseButton = document.querySelector('#stopwatch-pause');
const resumeButton = document.querySelector('#stopwatch-resume');
const resetButton = document.querySelector('#stopwatch-reset');
const lapButton = document.querySelector('#stopwatch-lap');
const stopwatch = document.getElementById('stopwatch');
const stopwatchTimer = document.getElementById('stopwatch-time');
const lapsContainer = document.getElementById('stopwatch-laps-container');
let currentTime;
let id;
let laps = [];

startButton.addEventListener('click', () => { localStorage.setItem('stopwatch-start-time', Date.now()); startStopwatch(); })
pauseButton.addEventListener('click', pauseStopwatch);
resumeButton.addEventListener('click', resumeStopwatch);
resetButton.addEventListener('click', resetStopwatch);
lapButton.addEventListener('click', lapStopwatch);


switch (localStorage.getItem('stopwatch-state')) {
    case 'paused':
        document.body.dataset.stopwatch = 'paused';
        setStopwatchTimer(localStorage.getItem('stopwatch-last-time'));
        initLaps();
        break;

    case 'running':
        document.body.dataset.stopwatch = 'running';
        startStopwatch();
        initLaps();
        break;

    default:
    case 'start':
        document.body.dataset.stopwatch = 'start';
        setStopwatchTimer(0);
}

function startStopwatch() {
    document.body.dataset.stopwatch = 'running';
    localStorage.setItem('stopwatch-state', 'running');
    currentTime = Date.now() - localStorage.getItem('stopwatch-start-time');
    tickStopwatch();
}

function pauseStopwatch() {
    document.body.dataset.stopwatch = 'paused';
    localStorage.setItem('stopwatch-state', 'paused');
    clearTimeout(id);
    localStorage.setItem('stopwatch-last-time', currentTime);
}

function tickStopwatch() {
    clearTimeout(id);
    setStopwatchTimer(currentTime);
    currentTime += 60;
    id = setTimeout(tickStopwatch, 60);
}

function resumeStopwatch() {
    document.body.dataset.stopwatch = 'running';
    localStorage.setItem('stopwatch-state', 'running');
    currentTime = Number(localStorage.getItem('stopwatch-last-time'));
    tickStopwatch();
}

function resetStopwatch() {
    document.body.dataset.stopwatch = 'start';
    localStorage.setItem('stopwatch-state', 'start');
    clearTimeout(id);
    setStopwatchTimer(0);
    localStorage.removeItem('stopwatch-start-time', 0);
    lapsContainer.innerHTML = '';
    laps = [];
    localStorage.removeItem('stopwatch-laps');
}

function lapStopwatch() {
    let t = currentTime;
    let l = [laps.length + 1, t, t - (laps[laps.length - 1] ? laps[laps.length - 1][1] : 0)];
    laps.push(l);
    insertLap(l[0], l[1], l[2]);
    localStorage.setItem('stopwatch-laps', JSON.stringify(laps));
}

function setStopwatchTimer(d) {
    stopwatchTimer.innerText = msToString(d);
}

function insertLap(a, b, c) {
    let fragment = document.createDocumentFragment();
    let container = document.createElement('div');
    container.style.display = 'flex';
    container.style['justify-content'] = 'space-between';
    container.style.padding = '15px';
    container.classList.add('shadow-sm');
    container.style.background = 'white';
    container.style.margin = '5px';
    fragment.appendChild(container);
    let sno = document.createElement('div');
    let lapItem = document.createElement('div');
    let intervalItem = document.createElement('div');
    sno.innerText = a;
    lapItem.innerText = msToString(b);
    intervalItem.innerText = msToString(c);
    container.append(sno, lapItem, intervalItem);
    lapsContainer.appendChild(fragment);
}

function msToString(d) {
    let h = ('00' + Math.floor(d / (1000 * 60 * 60))).slice(-2);
    let m = ('00' + Math.floor((d / (1000 * 60)) % 60)).slice(-2);
    let s = ('00' + Math.floor((d / 1000) % 60)).slice(-2);
    let ms = ('00' + Math.floor((d % 1000) / 10)).slice(-2);
    return `${h}:${m}:${s}.${ms}`
}

function initLaps() {
    laps = JSON.parse(localStorage.getItem('stopwatch-laps')) || [];

    for (const lap of laps) {
        insertLap(lap[0], lap[1], lap[2]);
    }
}