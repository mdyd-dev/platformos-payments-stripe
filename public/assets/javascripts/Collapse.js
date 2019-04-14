// Grab all the trigger elements on the page
const triggers = Array.from(document.querySelectorAll('[data-toggle="collapse"]'));
// Listen for click events, but only on our triggers
window.addEventListener('click', (ev) => {
  const elm = ev.target;
  console.log("click");
  if (triggers.includes(elm)) {
    console.log("click 2");
    if (elm.hasAttribute("href")) ev.preventDefault();
    const selector = elm.getAttribute('data-target');
    collapse(selector, 'toggle');
  }
}, false);

const fnmap = {
  'toggle': 'toggle',
    'show': 'add',
    'hide': 'remove'
};
const collapse = (selector, cmd) => {
  console.log("COllapsing");
  const targets = Array.from(document.querySelectorAll(selector));
  targets.forEach(target => {
    target.classList[fnmap[cmd]]('collapse');
    target.toggleAttribute('disabled');
  });
}
