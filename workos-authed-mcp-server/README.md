# WorkOS Authenticated MCP Server Demo

A demonstration of deploying an authenticated MCP (Model Context Protocol) server using [LiquidMetal Raindrop](https://docs.liquidmetal.ai/reference/mcp/).

## Features

This demo implements a protected MCP server with WorkOS authentication, exposing:

- **Addition Tool** - Adds two numbers with notification support
- **Greeting Resource** - Dynamic greeting generator using URI templates

## Authentication

The MCP server is configured with `visibility = "protected"` in `raindrop.manifest`, enabling OAuth authentication via WorkOS AuthKit. Users must authenticate before accessing the server's tools and resources.

```hcl
mcp_service "mcp" {
    visibility = "protected"
    authorization_server = "https://authkit.liquidmetal.run"
}
```

## Project Structure

- `src/mcp/index.ts` - MCP server implementation with tools and resources
- `src/_app/auth.ts` - JWT verification and authorization hooks
- `raindrop.manifest` - Raindrop deployment configuration

## Learn More

- [LiquidMetal MCP Documentation](https://docs.liquidmetal.ai/reference/mcp/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [WorkOS AuthKit](https://workos.com/docs/authkit)
