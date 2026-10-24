const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const preload = fs.readFileSync(
  path.resolve(__dirname, '../../main/assets/script/user-api-preload.js'),
  'utf8',
)

function loadPreloadWithoutNativeUrlSearchParams() {
  const nativeCalls = []
  const context = vm.createContext({
    URLSearchParams: undefined,
    __lx_native_call__: (_key, action, data) => nativeCalls.push({ action, data: JSON.parse(data) }),
    __lx_native_call__set_timeout: () => {},
    __lx_native_call__utils_str2b64: () => '',
    __lx_native_call__utils_b642buf: () => '[]',
    __lx_native_call__utils_str2md5: () => '',
    __lx_native_call__utils_aes_encrypt: () => '',
    __lx_native_call__utils_rsa_encrypt: () => '',
    console: { log() {}, info() {}, warn() {}, error() {} },
  })
  vm.runInContext(preload, context)
  vm.runInContext("lx_setup('key', 'id', 'name', '', '1', '', '', '')", context)
  return { context, nativeCalls }
}

test('QuickJS preload supplies the URLSearchParams operations used by XingHai', () => {
  const { context } = loadPreloadWithoutNativeUrlSearchParams()

  const result = vm.runInContext(`(() => {
    const params = new URLSearchParams('source=kw&tag=first')
    params.append('tag', 'second value')
    params.set('rid', 'MUSIC_123')
    return JSON.stringify({
      source: params.get('source'),
      tag: params.get('tag'),
      missing: params.get('missing'),
      query: params.toString(),
    })
  })()`, context)

  assert.deepEqual(JSON.parse(result), {
    source: 'kw',
    tag: 'first',
    missing: null,
    query: 'source=kw&tag=first&tag=second+value&rid=MUSIC_123',
  })
})
