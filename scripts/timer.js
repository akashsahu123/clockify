const hours = document.querySelector('#timer-hours');
const minutes = document.querySelector('#timer-minutes');
const seconds = document.querySelector('#timer-seconds');
const startButton = document.querySelector('#timer-start');
const pauseButton = document.querySelector('#timer-pause');
const resumeButton = document.querySelector('#timer-resume');
const stopButton = document.querySelector('#timer-stop');
let timer = document.getElementById('timer')
let id;
let duration;

const round = (e, min, max) => {
    e.target.value = e.target.valueAsNumber > max ? min : (e.target.valueAsNumber < min ? max : e.target.value);
};

hours.addEventListener('change', e => round(e, 0, 99));
minutes.addEventListener('change', e => round(e, 0, 59));
seconds.addEventListener('change', e => round(e, 0, 59));

document.querySelector('#timer .preset').addEventListener('click', handlePreset);

startButton.addEventListener('click', startTimer);
stopButton.addEventListener('click', stopTimer);
resumeButton.addEventListener('click', resumeTimer);
pauseButton.addEventListener('click', pauseTimer);


//states : running, paused, stopped

switch (localStorage.getItem('timer-state')) {
    case 'paused':
        document.body.dataset.timer = 'paused';
        setTimer(localStorage.getItem('timer-resume-remaining-time'));
        break;

    case 'running':
        document.body.dataset.timer = 'running';
        duration = localStorage.getItem('timer-ring-time') - Date.now();
        tickTimer();
        break;

    default:
    case 'stopped':
        document.body.dataset.timer = 'stopped';
        break;
}

function startTimer() {
    duration = (hours.valueAsNumber * 60 * 60 + minutes.valueAsNumber * 60 + seconds.valueAsNumber) * 1000;
    localStorage.setItem('timer-ring-time', Date.now() + duration);
    tickTimer();
    document.body.dataset.timer = 'running';
    localStorage.setItem('timer-state', 'running');
    chrome.runtime.sendMessage({ action: 'set-timer', name: 'timer-alarm', alarmInfo: { when: Date.now() + duration } });
}

function tickTimer() {
    clearTimeout(id);

    if (duration > 0) {
        duration -= 1000;
        setTimer(duration);
        id = setTimeout(tickTimer, 1000);
    }
    else {
        document.body.dataset.timer = 'stopped';
        localStorage.setItem('timer-state', stopped);
    }
}

function stopTimer() {
    clearTimeout(id);
    hours.value = '00';
    minutes.value = '00';
    seconds.value = '00';
    chrome.runtime.sendMessage({ action: 'stop-alarm', name: 'timer-alarm' });
    document.body.dataset.timer = 'stopped';
    localStorage.setItem('timer-state', 'stopped');
}

function pauseTimer() {
    chrome.runtime.sendMessage({ action: 'stop-alarm', name: 'timer-alarm' });
    clearTimeout(id);
    document.body.dataset.timer = 'paused';
    localStorage.setItem('timer-state', 'paused');
    localStorage.setItem('timer-resume-remaining-time', duration);
}

function resumeTimer() {
    duration = localStorage.getItem('timer-resume-remaining-time');
    console.log('duration', duration);

    if (duration > 0) {
        setTimer(duration);
        startTimer();
    }
    else {
        timer.dataset.state = 'stopped';
        localStorage.setItem('timer-state', 'stopped');
    }
}

function setTimer(d) {
    d = milisecondsToHMS(d);
    hours.value = ('00' + d.h).slice(-2);
    minutes.value = ('00' + d.m).slice(-2);
    seconds.value = ('00' + d.s).slice(-2);
}

function milisecondsToHMS(d) {
    let ans = {};
    d = Math.floor(d / 1000);
    ans.h = Math.floor(d / 3600);
    ans.m = Math.floor((d - ans.h * 3600) / 60);
    ans.s = (d - ans.h * 3600 - ans.m * 60);
    return ans;
}

function handlePreset(e) {
    if (e.target.dataset.value) {
        let d = e.target.dataset.value * 1000;
        setTimer(d);
    }
}