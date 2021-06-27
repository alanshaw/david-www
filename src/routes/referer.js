const refererRegex = /https?:\/\/[-a-zA-Z0-9.:]+\/([-a-zA-Z0-9.]+)\/([-a-zA-Z0-9.]+)(?:\/(?:blob|tree)\/([-a-zA-Z0-9.]+).*)?/

const parseReferer = (referer) => {
  if (referer === undefined || referer === null) {
    return undefined
  }
  const match = referer.match(refererRegex)
  if (!match || match.length < 3) {
    return undefined
  }
  const {
    1: org,
    2: repo,
    3: ref
  } = match

  return { org, repo, ref }
}

const buildStatusBadgeLink = (referer, suffix) => {
  if (referer === undefined || suffix === undefined) {
    return undefined
  }
  const slugs = parseReferer(referer)
  if (!slugs) {
    return undefined
  }
  const ref = slugs.ref ? `${slugs.ref}/` : ''
  return `/${slugs.org}/${slugs.repo}/${ref}${suffix}`
}

export default {
  parseReferer,
  buildStatusBadgeLink
}
