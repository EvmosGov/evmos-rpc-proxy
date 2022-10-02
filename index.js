// ENV VARS

 EDGE_CACHE_TTL = EDGE_CACHE_TTL || 30
 BROWSER_CACHE_TTL = BROWSER_CACHE_TTL || 0
 PROVIDERS = JSON.parse(PROVIDERS)
 PROVIDER_TIMEOUT = PROVIDER_TIMEOUT || 5000
 
 async function sha256(message) {

   const messageBuffer = new TextEncoder().encode(message)
   const hashBuffer = await crypto.subtle.digest("SHA-256", messageBuffer)
   const hashArr = Array.from(new Uint8Array(hashBuffer))
   const hashHex = hashArr.map(b => ("00" + b.toString(16)).slice(-2)).join("")
   return hashHex

 }
 
 async function fetchWithTimeout(url, request, timeout) {
   return Promise.race([
         fetch(url, request),
         new Promise((_, reject) =>
             setTimeout(() => reject(new Error('Timeout')), timeout)
         )
     ])
 }
 
 async function tryProvider (url, request) {

   const provider = new URL(PROVIDERS[Math.floor(Math.random() * PROVIDERS.length)])
   url.hostname = provider.hostname
   url.pathname = provider.pathname
   let response
   try {
     response = await fetchWithTimeout(url, request.clone(), PROVIDER_TIMEOUT)
     if (!response.ok) throw new Error(`${url.toString()} RPC ERROR`)
   } catch (e) {
     console.error(e)
     response = await tryProvider(url, request)
   }
   return response
 }

 async function getOriginResponse (url, event, cacheKey) {
   const cache = caches.default
 
   let response = await tryProvider(url, event.request)
   if (!cacheKey) return response
 
   const headers = { 'Cache-Control': `public, max-age=${EDGE_CACHE_TTL}` }
   response = new Response(response.body, { ...response, headers })
   event.waitUntil(cache.put(cacheKey, response.clone()))
   return response
 }

 async function formatResponse (response, body) {
   let formattedResponse
   if (body) {
     const originalBody = await response.json()
     const fullBody = JSON.stringify({ ...originalBody, ...body })
     formattedResponse = new Response(fullBody, response)
   } else {
     formattedResponse = new Response(response.body, response)
   }

   formattedResponse.headers.set('Cache-Control', `max-age=${BROWSER_CACHE_TTL}`)
   formattedResponse.headers.set('Access-Control-Allow-Method', '*')
   formattedResponse.headers.set('Access-Control-Allow-Origin', '*')
   formattedResponse.headers.set('Access-Control-Allow-Headers', '*')
   return formattedResponse
 }

 async function handleOptions(event) {
   const request = event.request
   let headers = request.headers
   if (
     headers.get("Origin") !== null &&
     headers.get("Access-Control-Request-Method") !== null &&
     headers.get("Access-Control-Request-Headers") !== null
   ){

     // Handle CORS
     let corsHead = {
       "Access-Control-Allow-Origin": "*",
       "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
       "Access-Control-Max-Age": "86400",
       "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers"),
     }
 
     return new Response(null, {
       headers: corsHead,
     })
   } else {
     return new Response(null, {
       headers: {
         Allow: "GET, HEAD, POST, OPTIONS",
       },
     })
   }
 
 }
 
 async function handleGet(event) {
   const request = event.request
   const url = new URL(request.url)
   const cache = caches.default
 
   let response
   response = await cache.match(request)
   if (!response) {
     response = await getOriginResponse(url, request, request)
   }
   return formatResponse(response)
 }
 
 async function handlePost(event) {
   const request = event.request
   const url = new URL(request.url)
   const cache = caches.default
   const body = await request.clone().json()
   const { method, id, jsonrpc } = body
    const bypassCache = method === 'eth_blockNumber'
   if (bypassCache) {
     const response = await getOriginResponse(url, event)
     return formatResponse(response, { id })
   }
 
   const cacheable = { method, jsonrpc, ...body.params }
   const cacheableBody = JSON.stringify(body.params)
   const hash = await sha256(cacheableBody)
   url.pathname = "/posts" + url.pathname + hash
   const cacheKey = new Request(url.toString(), {
     headers: request.headers,
     method: "GET",
   })
 
   let response = await cache.match(cacheKey)
   if (!response) {
     response = await getOriginResponse(url, event, cacheKey)
   }
   return formatResponse(response, { id })
 }
 
 addEventListener("fetch", event => {
   const request = event.request
   if (request.method.toUpperCase() === "OPTIONS") {
     return event.respondWith(handleOptions(event))
   } else if (request.method.toUpperCase() === "POST") {
     return event.respondWith(handlePost(event))
   }
   return event.respondWith(handleGet(event))
 })