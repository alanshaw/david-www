const test = require('tape')
const { parseReferer, buildStatusBadgeLink } = require('../dist/routes/referer').default

test('parseReferer returns undefined for undefined referer', (t) => {
  t.plan(1)
  t.equal(parseReferer(undefined), undefined)
  t.end()
})

test('parseReferer returns undefined for null referer', (t) => {
  t.equal(parseReferer(null), undefined)
  t.end()
})

test('parseReferer returns org and repo for default repo page referer', (t) => {
  t.plan(1)
  const slugs = parseReferer('https://github.com/alanshaw/david-www')
  t.deepEqual(slugs, {
    org: 'alanshaw',
    repo: 'david-www',
    ref: undefined
  })
  t.end()
})

test('parseReferer returns org, repo and ref for specified ref url', (t) => {
  t.plan(1)
  const slugs = parseReferer('https://github.com/alanshaw/david-www/tree/cache-graph')
  t.deepEqual(slugs, {
    org: 'alanshaw',
    repo: 'david-www',
    ref: 'cache-graph'
  })
  t.end()
})

test('parseReferer returns org, repo and ref for file blob', (t) => {
  t.plan(1)
  const slugs = parseReferer('https://github.com/alanshaw/david-www/blob/cache-graph/README.md')
  t.deepEqual(slugs, {
    org: 'alanshaw',
    repo: 'david-www',
    ref: 'cache-graph'
  })
  t.end()
})

test('parseReferer returns undefined if url does not match', (t) => {
  t.plan(1)
  const result = parseReferer('http://acme.com/does-not-match')
  t.notOk(result)
  t.end()
})

test('buildStatusBadgeLink returns undefined when param is missing', (t) => {
  const link = buildStatusBadgeLink()
  t.notOk(link)
  t.end()
})

test('buildStatusBadgeLink returns correct badge link without ref', (t) => {
  t.plan(1)
  const referer = 'https://git.acme.com/alanshaw/david-www'
  const result = buildStatusBadgeLink(referer, 'file.format')
  t.equal(result, '/alanshaw/david-www/file.format')
  t.end()
})

test('buildStatusBadgeLink returns correct badge with ref', (t) => {
  t.plan(1)
  const referer = 'https://git.acme.com/makii42/react-socket-context/tree/myBranch'
  const result = buildStatusBadgeLink(referer, 'another.format')
  t.equal(result, '/makii42/react-socket-context/myBranch/another.format')
  t.end()
})
