const alarm = document.querySelector('#alarm');
const hours = document.querySelector('#alarm-hour');
const minutes = document.querySelector('#alarm-minute');
const alarmEdit = document.querySelector('#alarm-edit');
const cancelBtn = document.querySelector('#alarm-btn input[value="cancel"]');
const createBtn = document.querySelector('#alarm-create');
const saveBtn = document.querySelector('#alarm-btn input[value="save"]');
const alarmOptions = document.getElementById('alarm-options');
const alarmDays = document.querySelectorAll('#alarm-days input');
console.log(alarmDays);
const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const alarmEntry = document.querySelector("#alarm-view > template");
const alarmView = document.getElementById('alarm-view');

const round = (e, min, max) => {
    e.target.value = ('00' + Math.min(max, Math.max(min, e.target.valueAsNumber))).slice(-2);
};

hours.addEventListener('input', e => round(e, 0, 23));
minutes.addEventListener('input', e => round(e, 0, 59));
cancelBtn.addEventListener('click', () => { document.body.dataset.alarm = 'alarm-view'; setView(); });
saveBtn.addEventListener('click', saveAlarm);

document.getElementById('alarm-repeat').addEventListener('change', (e) => {
    alarmEdit.dataset.repeat = (e.target.value === 'custom' ? 'custom' : 'no-custom');
});

createBtn.addEventListener('click', () => document.body.dataset.alarm = 'alarm-edit');

saveBtn.addEventListener('click', saveAlarm);

chrome.runtime.onMessage.addListener((req) => {
    if (req.action === 'update-entry') {
        setView();
    }
});

function saveAlarm() {
    let time = {
        hour: hours.value,
        minute: minutes.value
    };

    let repeat = document.querySelector('#alarm-repeat input:checked').value;

    if (repeat === 'custom') {
        repeat = [...alarmDays].filter(d => d.checked).map(d => Number(d.value));

        if (repeat.length == 0) {
            repeat = 'once';
        }
    }

    let label = document.getElementById('alarm-label').value;
    let name = 'alarm-' + Date.now();
    let active = true;

    let a = { name, time, repeat, label, active }
    document.body.dataset.alarm = 'alarm-view';
    setView();
    chrome.runtime.sendMessage({ action: 'set-alarm', new: true, 'h': 3, alarm: a });
}

function setView() {

    chrome.storage.local.get({ alarms: [] }, ({ alarms }) => {

        if (alarms.length === 0) {
            alarmView.innerHTML = `<div class='p-4 text-center' style='font-size: large;'>You have no scheduled alarm.</div>`;
            return;
        }

        alarms.sort((a, b) => a.nextScheduleTime - b.nextScheduleTime);
        alarmView.innerHTML = '';
        alarms.forEach(a => {
            let entry = document.importNode(alarmEntry.content, true);
            entry.querySelector('.entry-time').textContent = `${a.time.hour}:${a.time.minute}`;
            let r = a.nextScheduleTime - Date.now();
            let d = Math.floor(r / (24 * 60 * 60 * 1000));
            let h = Math.floor(r / (60 * 60 * 1000)) % 24;
            let m = Math.floor(r / (60 * 1000)) % 60;

            entry.querySelector('.entry-rem-time').textContent = `Next in ${d > 0 ? `${d} days, ` : ''}${h > 0 ? `${h} hours, ` : ''}${m} mins.`;
            entry.querySelector('.delete-alarm').addEventListener('click', () => {
                chrome.runtime.sendMessage({ 'action': 'stop-alarm', 'name': a.name });
            });


            entry.children[0].id = a.name;
            alarmView.appendChild(entry);

            document.querySelector(`#${a.name} input[type='checkbox']`).checked = a.active;
            document.querySelector(`#${a.name} input[type='checkbox']`).addEventListener('change', (e) => {

                if (e.target.checked) {
                    chrome.runtime.sendMessage({ 'action': 'set-alarm', new: false, alarm: a });
                }
                else {
                    chrome.runtime.sendMessage({ 'action': 'disable-alarm', name: a.name });
                }
            });

        });
    });
}

setView();
setInterval(setView, 30 * 1000);

