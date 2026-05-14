import Vue from 'vue';

const stored = localStorage.getItem('timerEnabled');

const settings = Vue.observable({
  timerEnabled: stored !== null ? JSON.parse(stored) : false,
});

export default new Proxy(settings, {
  set(target, key, value) {
    target[key] = value;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  },
});

