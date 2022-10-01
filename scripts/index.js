document.querySelector('footer').addEventListener('click', (e) => {
    document.body.dataset.tab = e.target.id;
    localStorage.setItem('last-saved-tab', e.target.id);
});

let tab = localStorage.getItem('last-saved-tab');

if (tab) {
    document.body.dataset.tab = tab;
}
