'use strict'

const symbols = require('../core/symbols')
const secret = {
  config: Symbol('ref config')
}

updateHistory(pathToRoute(location.pathname), queryToParams(location.search), {history: false})
window.addEventListener('click', onClick, true)

function onClick (ev) {
  const config = ev.target[secret.config]
  if (config) {
    ev.target.$route(config.path, config.params, config.options)
    ev.preventDefault()
  }
}

module.exports = function ref (elem, state, next) {
  if (!(elem instanceof Element)) return next()
  elem.$require('attributes')
  elem.$using('ref')

  elem.$route = $route

  if (elem instanceof HTMLAnchorElement) {
    elem.$attribute('iref', irefAttribute)
    elem.$attribute('iref-params', irefParamsAttribute)
    elem.$attribute('iref-options', irefOptionsAttribute)
  }
  return next()
}

function irefAttribute (path, elem) {
  elem[secret.config] = elem[secret.config] || {}
  const config = elem[secret.config]
  config.path = path

  const query = elem.href ? elem.href.search : ''
  const href = path + query
  elem.setAttribute('href', href)
}

function irefParamsAttribute (params, elem) {
  elem[secret.config] = elem[secret.config] || {}
  const config = elem[secret.config]
  config.params = params

  const path = elem.href ? elem.href.pathname : ''
  const href = path + paramsToQuery(params)
  elem.setAttribute('href', href)
}

function irefOptionsAttribute (options, elem) {
  elem[secret.config] = elem[secret.config] || {}
  elem[secret.config].options = options
}

function $route (path, params, options) {
  if (params === undefined) {
    params = {}
  }
  if (options === undefined) {
    options = {}
  }

  let route = pathToRoute(path)
  if (route.some(filterRelativeTokens)) {
    route = relativeToAbsoluteRoute(this, route)
  }
  updateHistory(route, params, options)
  window.scrollTo(0, 0)
}

function relativeToAbsoluteRoute (node, relativeRoute) {
  let router = findParentRouter(node)
  let routerLevel = router ? router[symbols.routerLevel] : 0

  for (let token of relativeRoute) {
    if (token === '..') routerLevel--
  }
  if (routerLevel < 0) {
    throw new Error('invalid relative route')
  }

  const currentRoute = []
  while (router) {
    currentRoute.unshift(router[symbols.currentView])
    router = findParentRouter(router)
  }
  const route = relativeRoute.filter(filterAbsoluteTokens)
  return currentRoute.slice(0, routerLevel).concat(route)
}

function filterAbsoluteTokens (token) {
  return (token !== '..' && token !== '.')
}

function filterRelativeTokens (token) {
  return (token === '..' || token === '.')
}

function filterEmptyTokens (token) {
  return (token !== '')
}

function findParentRouter (node) {
  while(node.parentNode) {
    node = node.parentNode
    if (node[symbols.routerLevel] !== undefined) {
      return node
    }
  }
}

function updateHistory (route, params, options) {
  if (options.inherit) {
    params = Object.assign({}, history.state.params, params)
  }

  const url = routeToPath(route) + paramsToQuery(params)
  if (options.history === false) {
    history.replaceState({route, params}, '', url)
  } else {
    history.pushState({route, params}, '', url)
  }

  const eventConfig = {bubbles: true, cancelable: false }
  document.dispatchEvent(new Event('popstate', eventConfig))
}

function routeToPath (route) {
  if (route === undefined) {
    route = []
  }
  return '/' + route.join('/')
}

function pathToRoute (path) {
  if (path.charAt(0) === '/') {
    path = path.slice(1)
  }
  return path.split('/').filter(filterEmptyTokens)
}

function paramsToQuery (params) {
  if (params === undefined) {
    params = {}
  }

  let query = ''
  for (let param in params) {
    if (params[param] !== undefined) {
      query += `${param}=${params[param]}&`
    }
  }
  if (query !== '') {
    query = '?' + query.slice(0, -1)
  }
  return query
}

function queryToParams (query) {
  if (query.charAt(0) === '?') {
    query = query.slice(1)
  }
  query = query.split('&')

  const params = {}
  for (let keyValue of query) {
    keyValue = keyValue.split('=')
    if (keyValue.length === 2) {
      params[keyValue[0]] = keyValue[1]
    }
  }
  return params
}
