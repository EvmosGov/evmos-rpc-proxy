# evmos-rpc-proxy

Cloudflare workers for a more reliable RPC endpoint

## Usage

`cp wrangler.toml.example wrangler.toml`
`wrangler publish`

## Wranger Template

```
account_id: Cloudflare workers account id
zone_id: Cloudflare workers account zone
name: worker name

PROVIDERS: array of providers
```

Refer to the [Cloudflare documentation](https://developers.cloudflare.com/workers/) for more help.

## Public Endpoints

Some public endpoints that you can use.

```
https://eth.bd.evmos.org:8545
https://json-rpc.evmos.blockhunters.org
https://evmos-json-rpc.stakely.io
https://evmos-mainnet.public.blastapi.io
https://evmos-mainnet.gateway.pokt.network/v1/lb/627586ddea1b320039c95205
https://evmos-json-rpc.agoranodes.com
```