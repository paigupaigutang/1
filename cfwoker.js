// @ts-ignore
import { connect } from 'cloudflare:sockets';

// How to generate your own UUID:
// [Windows] Press "Win + R", input cmd and run:  Powershell -NoExit -Command "[guid]::NewGuid()"
let userID = 'd342d11e-d424-4583-b36e-524ab1f0afa4';

const proxyIPs = ['cdn.xn--b6gac.eu.org', 'cdn-all.xn--b6gac.eu.org', 'workers.cloudflare.cyou'];

// if you want to use ipv6 or single proxyIP, please add comment at this line and remove comment at the next line
let proxyIP = proxyIPs[Math.floor(Math.random() * proxyIPs.length)];
// use single proxyIP instead of random
// let proxyIP = 'cdn.xn--b6gac.eu.org';
// ipv6 proxyIP example remove comment to use
// let proxyIP = "[2a01:4f8:c2c:123f:64:5:6810:c55a]"

let dohURL = 'https://sky.rethinkdns.com/1:-Pf_____9_8A_AMAIgE8kMABVDDmKOHTAKg='; // https://cloudflare-dns.com/dns-query or https://dns.google/dns-query

if (!isValidUUID(userID)) {
	throw new Error('uuid is invalid');
}

export default {
	/**
	 * @param {import("@cloudflare/workers-types").Request} request
	 * @param {{UUID: string, PROXYIP: string, DNS_RESOLVER_URL: string, NODE_ID: int, API_HOST: string, API_TOKEN: string}} env
	 * @param {import("@cloudflare/workers-types").ExecutionContext} ctx
	 * @returns {Promise<Response>}
	 */
	async fetch(request, env, ctx) {
		// uuid_validator(request);
		try {
			userID = env.UUID || userID;
			proxyIP = env.PROXYIP || proxyIP;
			dohURL = env.DNS_RESOLVER_URL || dohURL;
			let userID_Path = userID;
			if (userID.includes(',')) {
				userID_Path = userID.split(',')[0];
			}
			const upgradeHeader = request.headers.get('Upgrade');
			if (!upgradeHeader || upgradeHeader !== 'websocket') {
				const url = new URL(request.url);
				switch (url.pathname) {
					case `/cf`: {
						return new Response(JSON.stringify(request.cf, null, 4), {
							status: 200,
							headers: {
								"Content-Type": "application/json;charset=utf-8",
							},
						});
					}
					case `/${userID_Path}`: {
						const vlessConfig = getVLESSConfig(userID, request.headers.get('Host'));
						return new Response(`${vlessConfig}`, {
							status: 200,
							headers: {
								"Content-Type": "text/html; charset=utf-8",
							}
						});
					};
					case `/sub/${userID_Path}`: {
						const url = new URL(request.url);
						const searchParams = url.searchParams;
						const vlessSubConfig = createVLESSSub(userID, request.headers.get('Host'));
						// Construct and return response object
						return new Response(btoa(vlessSubConfig), {
							status: 200,
							headers: {
								"Content-Type": "text/plain;charset=utf-8",
							}
						});
					};
					case `/bestip/${userID_Path}`: {
						const headers = request.headers;
						const url = `https://sub.xf.free.hr/auto?host=${request.headers.get('Host')}&uuid=${userID}&path=/`;
						const bestSubConfig = await fetch(url, { headers: headers });
						return bestSubConfig;
					};
					default:
						// return new Response('Not found', { status: 404 });
						// For any other path, reverse proxy to 'ramdom website' and return the original response, caching it in the process
						const randomHostname = cn_hostnames[Math.floor(Math.random() * cn_hostnames.length)];
						const newHeaders = new Headers(request.headers);
						newHeaders.set('cf-connecting-ip', '1.2.3.4');
						newHeaders.set('x-forwarded-for', '1.2.3.4');
						newHeaders.set('x-real-ip', '1.2.3.4');
						newHeaders.set('referer', 'https://www.google.com/search?q=edtunnel');
						// Use fetch to proxy the request to 15 different domains
						const proxyUrl = 'https://' + randomHostname + url.pathname + url.search;
						let modifiedRequest = new Request(proxyUrl, {
							method: request.method,
							headers: newHeaders,
							body: request.body,
							redirect: 'manual',
						});
						const proxyResponse = await fetch(modifiedRequest, { redirect: 'manual' });
						// Check for 302 or 301 redirect status and return an error response
						if ([301, 302].includes(proxyResponse.status)) {
							return new Response(`Redirects to ${randomHostname} are not allowed.`, {
								status: 403,
								statusText: 'Forbidden',
							});
						}
						// Return the response from the proxy server
						return proxyResponse;
				}
			} else {
				return await vlessOverWSHandler(request);
			}
		} catch (err) {
			/** @type {Error} */ let e = err;
			return new Response(e.toString());
		}
	},
};

export async function uuid_validator(request) {
	const hostname = request.headers.get('Host');
	const currentDate = new Date();

	const subdomain = hostname.split('.')[0];
	const year = currentDate.getFullYear();
	const month = String(currentDate.getMonth() + 1).padStart(2, '0');
	const day = String(currentDate.getDate()).padStart(2, '0');

	const formattedDate = `${year}-${month}-${day}`;

	// const daliy_sub = formattedDate + subdomain
	const hashHex = await hashHex_f(subdomain);
	// subdomain string contains timestamps utc and uuid string TODO.
	console.log(hashHex, subdom
