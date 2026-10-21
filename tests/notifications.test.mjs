import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Executes the installed Expo implementation, resolving Android/native files as
// Metro does. Only the native bridge is simulated; no remote native APIs exist.
function androidRuntime() {
  const nativeRequests = [];
  const calls = [];
  const listeners = new Map();
  const native = {
    ExpoNotificationPermissionsModule: {
      getPermissionsAsync: async () => ({ granted: true }),
      requestPermissionsAsync: async () => ({ granted: true }),
    },
    ExpoNotificationScheduler: {
      scheduleNotificationAsync: async (...args) => { calls.push(args); return args[0]; },
      cancelAllScheduledNotificationsAsync: async () => { calls.push('cancel'); },
    },
    ExpoNotificationChannelManager: {
      setNotificationChannelAsync: async (id, config) => ({ id, ...config }),
    },
    ExpoNotificationsEmitter: {
      getLastNotificationResponse: () => null,
      clearLastNotificationResponse: () => {},
    },
    ExpoNotificationsHandlerModule: {},
  };
  class Emitter {
    addListener(name, callback) {
      listeners.set(name, callback);
      return { remove() { listeners.delete(name); } };
    }
    emit(name, value) { listeners.get(name)?.(value); }
  }
  const core = {
    Platform: { OS: 'android', select: (options) => options.android ?? options.default },
    LegacyEventEmitter: Emitter,
    CodedError: Error,
    UnavailabilityError: Error,
    uuid: { v4: () => 'scheduled-local-id' },
    requireNativeModule(name) {
      nativeRequests.push(name);
      if (!(name in native)) throw new Error(`Cannot find native module '${name}'`);
      return native[name];
    },
  };
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const req = (specifier) => {
      if (specifier === 'expo-modules-core') return core;
      if (specifier === 'expo') return { PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' } };
      if (specifier === 'react-native') return { Platform: core.Platform };
      const base = specifier.startsWith('.')
        ? path.resolve(path.dirname(file), specifier)
        : path.resolve('node_modules', specifier);
      const resolved = ['.android.js', '.native.js', '.js', '.ts'].map(s => base + s).find(fs.existsSync);
      if (!resolved) return createRequire(file)(specifier);
      return load(resolved);
    };
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInThisContext(`(function(require,__module,exports){${source}\n})`, { filename: file })(req, module, module.exports);
    return module.exports;
  }
  return { load, nativeRequests, calls, listeners };
}

test('local notifications load and schedule without the remote topic native module', async () => {
  const runtime = androidRuntime();
  // Reproduce the exact native failure reported by the user.
  assert.throws(() => runtime.load(path.resolve('node_modules/expo-notifications/build/TopicSubscriptionModule.android.js')), /ExpoTopicSubscriptionModule/);
  runtime.nativeRequests.length = 0;
  const api = runtime.load(path.resolve('src/services/localNotifications.ts'));
  api.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true }) });
  assert.equal((await api.requestPermissionsAsync()).granted, true);
  assert.equal((await api.getPermissionsAsync()).granted, true);
  assert.equal((await api.setNotificationChannelAsync('rega', { importance: api.AndroidImportance.DEFAULT })).id, 'rega');
  const date = new Date(Date.now() + 60000);
  const id = await api.scheduleNotificationAsync({ content: { title: 'Rega', data: { plantId: 9 } }, trigger: { type: api.SchedulableTriggerInputTypes.DATE, date, channelId: 'rega' } });
  assert.equal(id, 'scheduled-local-id');
  assert.deepEqual(runtime.calls[0][2], { type: 'date', timestamp: date.getTime(), channelId: 'rega' });
  let selected;
  const subscription = api.addNotificationResponseReceivedListener(response => { selected = response.notification.request.content.data.plantId; });
  runtime.listeners.get('onDidReceiveNotificationResponse')({ notification: { request: { content: { data: { plantId: 9 } }, trigger: null } } });
  assert.equal(selected, 9);
  subscription.remove();
  assert.equal(api.getLastNotificationResponse(), null);
  await api.clearLastNotificationResponseAsync();
  await api.cancelAllScheduledNotificationsAsync();
  assert.equal(runtime.calls.at(-1), 'cancel');
  assert.equal(runtime.nativeRequests.some(name => /Topic|PushToken/.test(name)), false);
});
