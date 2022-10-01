chrome.runtime.onMessage.addListener(onMessage);

chrome.alarms.onAlarm.addListener((a) => {
    fireAlarm(a);
});

const notifications = {
    clear(name, callback) {
        chrome.runtime.sendMessage({
            action: 'remove-notification',
            name
        }, () => {
            chrome.runtime.lastError;
            callback();
        });
    },

    create(name, opts) {
        const args = new URLSearchParams();
        args.set('name', name);
        args.set('title', opts.title);
        console.log(opts.message);
        args.set('message', opts.message);
        args.set('sound', opts.sound);
        args.set('volume', opts.volume);
        args.set('repeats', opts.repeats);

        chrome.storage.local.get({
            'notify-position': 'center'
        }, data => {
            args.set('position', data['notify-position']);

            const p = {
                width: 300,
                height: 420,
                type: 'popup',
                url: 'notification/notify.html?' + args.toString()
            };
            chrome.windows.create(p);
        });
    },

    kill() {
        chrome.runtime.sendMessage({
            action: 'remove-all-notifications'
        }, () => chrome.runtime.lastError);
    }
};

//if schedule true, then schedule alarm also else only update schedule time.

function updateScheduleAlarm(a, schedule = false) {
    let h = a.time.hour;
    let m = a.time.minute;
    let timeNow = new Date();
    let timeScheduled = new Date(timeNow.getFullYear(), timeNow.getMonth(), timeNow.getDate(), h, m);

    if (timeNow >= timeScheduled) {
        timeScheduled = new Date(timeScheduled.valueOf() + 24 * 60 * 60 * 1000);
    };

    if (a.repeat === 'once') {
        let when = timeScheduled.valueOf();
        a.nextScheduleTime = when;

        if (schedule)
            chrome.alarms.create(a.name, { when });

    }
    else {
        let selectedDays = [];

        if (a.repeat === 'daily')
            selectedDays = [0, 1, 2, 3, 4, 5, 6];
        else {
            selectedDays = a.repeat;
        }

        a.nextScheduleTime = Number.POSITIVE_INFINITY;

        selectedDays.forEach(d => {
            let when = findNextTime(timeScheduled, d);
            a.nextScheduleTime = Math.min(a.nextScheduleTime, when);
            let period = 7 * 24 * 60;

            if (schedule)
                chrome.alarms.create(a.name + d, { when, periodInMinutes: period });
        });
    }
}

function findNextTime(date, day) {
    let currentDay = date.getDay();
    let diff = day - currentDay;

    if (diff < 0)
        diff += 7;


    return date.valueOf() + diff * 24 * 60 * 60 * 1000;
}

function onMessage(request, sender, respose) {
    switch (request.action) {
        case 'set-timer':
            chrome.alarms.create(request.name, request.alarmInfo);
            break;

        case 'set-alarm':
            let a = request.alarm;

            chrome.storage.local.get({ alarms: [] }, ({ alarms }) => {
                alarms.forEach(t => {
                    if (t.name === a.name) {
                        t.active = true;
                    }
                });

                if (request.new)
                    alarms.push(a);

                updateScheduleAlarm(a, true); //create alarm
                chrome.storage.local.set({ 'alarms': alarms }, () => {
                    chrome.runtime.sendMessage({ 'action': 'update-entry' });
                });
            });

            break;

        case 'disable-alarm':
            chrome.storage.local.get({ alarms: [] }, ({ alarms }) => {
                alarms.forEach(t => {
                    if (t.name === request.name) {
                        t.active = false;
                    }
                });


                deScheduleAlarm(request.name);

                chrome.storage.local.set({ alarms }, () => {
                    chrome.runtime.sendMessage({ 'action': "update-entry" });
                });
            });
            break;

        case 'stop-alarm':
            chrome.storage.local.get({ alarms: [] }, ({ alarms }) => {
                alarms = alarms.filter(t => t.name !== request.name);

                chrome.storage.local.set({ alarms }, () => {
                    chrome.runtime.sendMessage({ action: "update-entry" });
                });
            });
            deScheduleAlarm(request.name);
            break;

        case 'set-notification-position':
            if (request.position === 'center') {
                chrome.windows.update(sender.tab.windowId, {
                    left: parseInt((request.screen.width - request.window.width) / 2),
                    top: parseInt((request.screen.height - request.window.height) / 2)
                });
            }
            else if (request.position === 'br') {
                chrome.windows.update(sender.tab.windowId, {
                    left: parseInt(request.screen.width - request.window.width),
                    top: parseInt(request.screen.height - request.window.height)
                });
            }
            else if (request.position === 'tr') {
                chrome.windows.update(sender.tab.windowId, {
                    left: parseInt(request.screen.width - request.window.width),
                    top: 0
                });
            }
            break;

        case 'bring-notification-in-front':
            chrome.storage.local.get({
                'notify-on-top': false
            }, data => {
                if (data['notify-on-top']) {
                    chrome.tabs.update(sender.tab.id, {
                        highlighted: true
                    });
                    chrome.windows.update(sender.tab.windowId, {
                        focused: true
                    });
                }
            });

            break;
    }
}

function showAlarm(name, title, sound, repeats, volume, message) {
    notifications.clear(name, () => {
        notifications.create(name, {
            title,
            message,
            sound,
            volume,
            repeats
        });

        // delete alarms scheduled once, update next schedule time in alarm.

        chrome.storage.local.get({ alarms: [] }, ({ alarms }) => {
            alarms = alarms.filter(a => {

                if (a.name === name && a.repeat === 'once') {
                    deScheduleAlarm(a.name);
                    return false;
                }
                else {
                    updateScheduleAlarm(a, false);
                    return true;
                }
            });

            chrome.storage.local.set({ alarms }, () => chrome.runtime.sendMessage({ 'action': 'update-entry' }));
        });
    });
}

function deScheduleAlarm(name) {

    if (name.startsWith('alarm')) {
        chrome.alarms.getAll(alarms => {
            alarms.forEach(a => {
                if (a.name.startsWith(name)) {
                    chrome.alarms.clear(a.name);
                }
            });
        });
    }
    else {
        chrome.alarms.clear(name);
    }
}

function fireAlarm({ name }) {
    let title, sound;

    if (name.startsWith('alarm')) {
        title = 'Alarm';
        sound = 'sounds/daydream.mp3';
    }
    else {
        title = 'Timer';
        sound = 'sounds/fireflies.mp3';
    }

    let repeat = 5;
    let message = '';

    chrome.storage.local.get({ alarms: [] }, ({ alarms }) => {
        alarms.forEach(t => {
            if (t.name === name) {
                message = t.label;
            }
        });

        showAlarm(name, title, sound, repeat, 0.8, message);
    });
}