document.querySelector('footer').addEventListener('click', (e) => {
    switch (e.target.dataset.value) {
        case 'timer':
            document.body.dataset.tab = 'timer';
            localStorage.setItem('last-saved-tab', 'timer');
            break;

        case 'stopwatch':
            document.body.dataset.tab = 'stopwatch';
            localStorage.setItem('last-saved-tab', 'stopwatch');
            break;

        case 'alarm':
            document.body.dataset.tab = 'alarm';
            localStorage.setItem('last-saved-tab', 'alarm');
            break;
    }
});

let tab = localStorage.getItem('last-saved-tab');

if (tab) {
    document.body.dataset.tab = tab;
}
