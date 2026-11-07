import React from '../node_modules/react/index.js';
import { createRoot } from '../node_modules/react-dom/client.js';

// React páka pro sloty - zachováno
let leverRoot = null, leverMount = null;
window.addEventListener('casino:render', event => {
  const mount = document.getElementById('slotLeverMount');
  if (!mount) { leverRoot?.unmount(); leverRoot = leverMount = null; return; }
  if (mount !== leverMount) { leverRoot?.unmount(); leverRoot = createRoot(mount); leverMount = mount; }
  leverRoot.render(React.createElement('button', {
    className: `slot-lever ${event.detail.spinning ? 'is-pulled' : ''}`,
    type: 'button', disabled: event.detail.spinning,
    onClick: () => document.getElementById('btnSpinSlots')?.click(),
    'aria-label': 'Zatáhnout za páku a roztočit válce'
  }, React.createElement('span', { className: 'lever-arm' }, React.createElement('span', { className: 'lever-knob' })), React.createElement('span', { className: 'lever-label' }, 'TAHAT')));
});

// Inicializace páky po načtení stránky
window.addEventListener('DOMContentLoaded',()=>{
  if(document.getElementById('slotLeverMount')){
    window.dispatchEvent(new CustomEvent('casino:render',{detail:{game:'slots',spinning:false}}));
  }
},{once:true});
