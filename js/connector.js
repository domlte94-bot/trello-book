/* Power-Up registration: card section, button and badge */
var BASE = window.location.href.replace(/[^/]*$/, '');
var ICON = BASE + 'img/icon.svg';

function openEditor(t, index) {
  var isNew = index == null;
  return t.modal({
    url: './edit.html',
    args: isNew ? {} : { index: index },
    title: isNew ? 'Add project' : 'Edit project',
    height: 760,
    accentColor: '#2457c5'
  });
}

TrelloPowerUp.initialize({
  'card-back-section': function (t) {
    return {
      title: 'Projects',
      icon: ICON,
      content: { type: 'iframe', url: t.signUrl('./section.html'), height: 140 }
    };
  },
  'card-buttons': function () {
    return [{ icon: ICON, text: 'Add project', callback: function (t) { return openEditor(t); } }];
  },
  'card-badges': function (t) {
    return KC.get(t).then(function (c) {
      if (!c || !c.length) return [];
      return [{ icon: ICON, text: c.length === 1 ? '1 project' : c.length + ' projects' }];
    });
  }
}, KC.hasKey() ? KC_CONFIG : undefined);
