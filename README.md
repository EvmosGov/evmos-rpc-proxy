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

## More Info

Refer to the [Cloudflare documentation](https://developers.cloudflare.com/workers/) for more help.